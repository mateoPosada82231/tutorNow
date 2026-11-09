package co.edu.epi.tutornow.admin;

import co.edu.epi.tutornow.admin.dto.AdminPublicationResponse;
import co.edu.epi.tutornow.admin.dto.AdminReviewResponse;
import co.edu.epi.tutornow.admin.service.AdminModerationService;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.model.EstadoModeracion;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminModerationService")
class AdminModerationServiceTest {

    @Mock
    private SolicitudAsesoriaRepository solicitudRepository;
    @Mock
    private ResenaRepository resenaRepository;
    @Mock
    private PropuestaRepository propuestaRepository;
    @InjectMocks
    private AdminModerationService adminModerationService;

    private final Materia materia = Materia.builder()
            .id(1L).nombre("Calculo Diferencial").activa(true).build();

    private SolicitudAsesoria solicitud() {
        return SolicitudAsesoria.builder()
                .id(10L)
                .estudiante(Usuario.builder().id(2L)
                        .correoElectronico("estudiante@elpoli.edu.co")
                        .nombreCompleto("Estudiante Uno").rol(Rol.ESTUDIANTE).activo(true).build())
                .materia(materia)
                .tema("Derivadas")
                .modalidad(null)
                .estado(EstadoSolicitud.PUBLICADA)
                .estadoModeracion(EstadoModeracion.VISIBLE)
                .build();
    }

    private Resena resena() {
        return Resena.builder()
                .id(20L)
                .asesoria(co.edu.epi.tutornow.tutorial.model.Asesoria.builder().id(5L).build())
                .autor(Usuario.builder().id(3L)
                        .correoElectronico("alumno@elpoli.edu.co")
                        .nombreCompleto("Autor Uno").rol(Rol.ESTUDIANTE).activo(true).build())
                .rolAutor(RolAutorResena.ESTUDIANTE)
                .rating(1)
                .comentario("Muy mal tutor")
                .estadoModeracion(EstadoModeracion.VISIBLE)
                .build();
    }

    @Nested
    @DisplayName("retirar publicaciones")
    class RetirarPublicaciones {

        @Test
        @DisplayName("marca RETIRADA y rechaza propuestas pendientes")
        void shouldWithdrawOpenPublication() {
            SolicitudAsesoria target = solicitud();
            Propuesta pendiente = Propuesta.builder()
                    .id(7L).solicitud(target)
                    .tutor(Tutor.builder().id(5L).usuario(target.getEstudiante()).build())
                    .mensaje("Propuesta").estado(EstadoPropuesta.PENDIENTE).build();
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(target));
            when(propuestaRepository.findBySolicitudIdAndEstadoOrderByCreatedAtAsc(
                    10L, EstadoPropuesta.PENDIENTE)).thenReturn(List.of(pendiente));
            when(solicitudRepository.save(any(SolicitudAsesoria.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            AdminPublicationResponse result = adminModerationService.withdrawPublication(10L);

            assertThat(result.getEstadoModeracion()).isEqualTo("RETIRADA");
            assertThat(pendiente.getEstado()).isEqualTo(EstadoPropuesta.RECHAZADA);
            verify(solicitudRepository).save(target);
            verify(propuestaRepository).saveAll(List.of(pendiente));
        }

        @Test
        @DisplayName("falla con 409 si la publicacion no esta abierta")
        void shouldThrowWhenNotOpen() {
            SolicitudAsesoria target = solicitud();
            target.setEstado(EstadoSolicitud.EN_PROCESO);
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> adminModerationService.withdrawPublication(10L))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("falla con 409 si ya esta retirada")
        void shouldThrowWhenAlreadyWithdrawn() {
            SolicitudAsesoria target = solicitud();
            target.setEstadoModeracion(EstadoModeracion.RETIRADA);
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> adminModerationService.withdrawPublication(10L))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("falla con 404 si la publicacion no existe")
        void shouldThrowWhenMissing() {
            when(solicitudRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminModerationService.withdrawPublication(10L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("retirar resenas")
    class RetirarResenas {

        @Test
        @DisplayName("marca RETIRADA y persiste")
        void shouldWithdrawReview() {
            Resena target = resena();
            when(resenaRepository.findById(20L)).thenReturn(Optional.of(target));
            when(resenaRepository.save(any(Resena.class))).thenAnswer(inv -> inv.getArgument(0));

            AdminReviewResponse result = adminModerationService.withdrawReview(20L);

            assertThat(result.getEstadoModeracion()).isEqualTo("RETIRADA");
            verify(resenaRepository).save(target);
        }

        @Test
        @DisplayName("falla con 409 si ya esta retirada")
        void shouldThrowWhenAlreadyWithdrawn() {
            Resena target = resena();
            target.setEstadoModeracion(EstadoModeracion.RETIRADA);
            when(resenaRepository.findById(20L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> adminModerationService.withdrawReview(20L))
                    .isInstanceOf(ConflictException.class);
        }
    }
}
