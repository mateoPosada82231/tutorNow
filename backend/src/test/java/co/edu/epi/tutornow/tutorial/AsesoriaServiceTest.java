package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.service.AsesoriaService;
import co.edu.epi.tutornow.tutorial.service.TutorialMapper;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AsesoriaService")
class AsesoriaServiceTest {

    @Mock
    private AsesoriaRepository asesoriaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Spy
    private TutorialMapper mapper = new TutorialMapper();
    @InjectMocks
    private AsesoriaService asesoriaService;

    private final Materia materia = Materia.builder().id(1L).nombre("Calculo Diferencial").activa(true).build();
    private final Usuario estudiante = Usuario.builder().id(1L)
            .correoElectronico("joseph_rojas82231@elpoli.edu.co")
            .nombreCompleto("Joseph Rojas").rol(Rol.ESTUDIANTE).build();
    private Usuario tutorUsuario;
    private Tutor tutor;
    private Asesoria asesoria;

    @BeforeEach
    void setUp() {
        tutorUsuario = Usuario.builder().id(2L)
                .correoElectronico("andres_tutor1@elpoli.edu.co")
                .nombreCompleto("Andres Tutor").rol(Rol.TUTOR).build();
        tutor = Tutor.builder().id(5L).usuario(tutorUsuario).materias(Set.of(materia)).build();
        SolicitudAsesoria solicitud = SolicitudAsesoria.builder()
                .id(1L).estudiante(estudiante).materia(materia).tema("Derivadas")
                .estado(co.edu.epi.tutornow.tutorial.model.EstadoSolicitud.CONFIRMADA)
                .createdAt(OffsetDateTime.now()).build();
        Propuesta propuesta = Propuesta.builder()
                .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Propuesta")
                .estado(co.edu.epi.tutornow.tutorial.model.EstadoPropuesta.ACEPTADA)
                .createdAt(OffsetDateTime.now()).build();
        asesoria = Asesoria.builder()
                .id(20L).solicitud(solicitud).propuesta(propuesta)
                .estudiante(estudiante).tutor(tutor)
                .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
    }

    @Nested
    @DisplayName("Confirmar finalizacion")
    class ConfirmarFinalizacion {

        @Test
        @DisplayName("El estudiante confirma y la asesoria sigue pendiente de la otra parte")
        void estudianteConfirma() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findById(20L)).thenReturn(Optional.of(asesoria));
            when(asesoriaRepository.save(any(Asesoria.class))).thenAnswer(inv -> inv.getArgument(0));

            AsesoriaResponse response = asesoriaService
                    .confirmarFinalizacion(estudiante.getCorreoElectronico(), 20L);

            assertThat(response.isConfirmadaEstudiante()).isTrue();
            assertThat(response.isConfirmadaTutor()).isFalse();
            assertThat(response.getEstado()).isEqualTo("PENDIENTE");
            assertThat(response.getFinalizadaAt()).isNull();
        }

        @Test
        @DisplayName("Cuando ambas partes confirman pasa a FINALIZADA")
        void ambasPartesConfirman() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(asesoriaRepository.findById(20L)).thenReturn(Optional.of(asesoria));
            when(asesoriaRepository.save(any(Asesoria.class))).thenAnswer(inv -> inv.getArgument(0));

            asesoriaService.confirmarFinalizacion(estudiante.getCorreoElectronico(), 20L);
            AsesoriaResponse response = asesoriaService
                    .confirmarFinalizacion(tutorUsuario.getCorreoElectronico(), 20L);

            assertThat(response.isConfirmadaEstudiante()).isTrue();
            assertThat(response.isConfirmadaTutor()).isTrue();
            assertThat(response.getEstado()).isEqualTo("FINALIZADA");
            assertThat(response.getFinalizadaAt()).isNotNull();
            assertThat(asesoria.getEstado()).isEqualTo(EstadoAsesoria.FINALIZADA);
        }

        @Test
        @DisplayName("Confirmar dos veces es idempotente")
        void idempotente() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findById(20L)).thenReturn(Optional.of(asesoria));
            when(asesoriaRepository.save(any(Asesoria.class))).thenAnswer(inv -> inv.getArgument(0));

            asesoriaService.confirmarFinalizacion(estudiante.getCorreoElectronico(), 20L);
            AsesoriaResponse response = asesoriaService
                    .confirmarFinalizacion(estudiante.getCorreoElectronico(), 20L);

            assertThat(response.isConfirmadaEstudiante()).isTrue();
            assertThat(response.getEstado()).isEqualTo("PENDIENTE");
        }

        @Test
        @DisplayName("Una persona ajena no puede confirmar (403)")
        void terceroNoConfirma() {
            Usuario otro = Usuario.builder().id(9L)
                    .correoElectronico("otro@elpoli.edu.co").rol(Rol.ESTUDIANTE).build();
            when(usuarioRepository.findByCorreoElectronico(otro.getCorreoElectronico()))
                    .thenReturn(Optional.of(otro));
            when(asesoriaRepository.findById(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> asesoriaService.confirmarFinalizacion(otro.getCorreoElectronico(), 20L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("partes de la asesoria");
        }

        @Test
        @DisplayName("No se puede confirmar una asesoria cancelada")
        void canceladaNoConfirma() {
            asesoria.setEstado(EstadoAsesoria.CANCELADA);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findById(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> asesoriaService
                    .confirmarFinalizacion(estudiante.getCorreoElectronico(), 20L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("cancelada");
        }

        @Test
        @DisplayName("No se puede confirmar una asesoria ya finalizada")
        void finalizadaNoConfirma() {
            asesoria.setEstado(EstadoAsesoria.FINALIZADA);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findById(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> asesoriaService
                    .confirmarFinalizacion(estudiante.getCorreoElectronico(), 20L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("finalizada");
        }

        @Test
        @DisplayName("Lanza 404 si la asesoria no existe")
        void noExiste() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> asesoriaService
                    .confirmarFinalizacion(estudiante.getCorreoElectronico(), 404L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asesoria no encontrada");
        }
    }
}
