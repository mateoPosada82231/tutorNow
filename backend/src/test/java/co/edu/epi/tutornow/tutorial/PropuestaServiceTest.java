package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.dto.CreateProposalRequest;
import co.edu.epi.tutornow.tutorial.dto.ProposalResponse;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.tutorial.service.PropuestaService;
import co.edu.epi.tutornow.tutorial.service.TutorialMapper;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PropuestaService")
class PropuestaServiceTest {

    @Mock
    private PropuestaRepository propuestaRepository;
    @Mock
    private SolicitudAsesoriaRepository solicitudRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Spy
    private TutorialMapper mapper = new TutorialMapper();
    @InjectMocks
    private PropuestaService propuestaService;

    private final Usuario estudiante = Usuario.builder()
            .id(1L)
            .correoElectronico("joseph_rojas82231@elpoli.edu.co")
            .nombreCompleto("Joseph Rojas")
            .rol(Rol.ESTUDIANTE)
            .build();

    private final Usuario tutorUsuario = Usuario.builder()
            .id(2L)
            .correoElectronico("tutor@elpoli.edu.co")
            .nombreCompleto("Tutor Uno")
            .rol(Rol.TUTOR)
            .build();

    private final Tutor tutor = Tutor.builder()
            .id(5L)
            .usuario(tutorUsuario)
            .biografia("Tutor de calculo")
            .materias(Set.of(Materia.builder().id(1L).nombre("Calculo Diferencial").activa(true).build()))
            .build();

    private final SolicitudAsesoria solicitud = SolicitudAsesoria.builder()
            .id(10L)
            .estudiante(estudiante)
            .materia(Materia.builder().id(1L).nombre("Calculo Diferencial").activa(true).build())
            .tema("Derivadas parciales")
            .modalidad(Modalidad.VIRTUAL)
            .disponibilidad("Lunes y miercoles 2-4pm")
            .estado(EstadoSolicitud.PUBLICADA)
            .createdAt(OffsetDateTime.now())
            .build();

    private final CreateProposalRequest requestValido = CreateProposalRequest.builder()
            .mensaje("Puedo asesorarte los lunes por la manana")
            .build();

    @Nested
    @DisplayName("Enviar propuesta")
    class CrearPropuesta {

        @Test
        @DisplayName("El tutor envia propuesta PENDIENTE y la solicitud pasa a EN_PROCESO")
        void tutorEnviaPropuesta() {
            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(tutorRepository.findByUsuario_CorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutor));
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(solicitud));
            when(propuestaRepository.existsBySolicitudIdAndTutorId(10L, 5L)).thenReturn(false);
            when(propuestaRepository.save(any(Propuesta.class)))
                    .thenAnswer(inv -> {
                        Propuesta p = inv.getArgument(0);
                        p.setId(7L);
                        return p;
                    });
            when(solicitudRepository.save(any(SolicitudAsesoria.class))).thenAnswer(inv -> inv.getArgument(0));

            ProposalResponse response = propuestaService.create(
                    tutorUsuario.getCorreoElectronico(), 10L, requestValido);

            ArgumentCaptor<Propuesta> captor = ArgumentCaptor.forClass(Propuesta.class);
            verify(propuestaRepository).save(captor.capture());
            assertThat(captor.getValue().getEstado()).isEqualTo(EstadoPropuesta.PENDIENTE);
            assertThat(captor.getValue().getMensaje()).isEqualTo("Puedo asesorarte los lunes por la manana");
            assertThat(solicitud.getEstado()).isEqualTo(EstadoSolicitud.EN_PROCESO);
            assertThat(response.getEstado()).isEqualTo("PENDIENTE");
            assertThat(response.isMine()).isTrue();
            assertThat(response.getTutor().getFullName()).isEqualTo("Tutor Uno");
        }

        @Test
        @DisplayName("Un estudiante no puede enviar propuestas")
        void estudianteNoPropone() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));

            assertThatThrownBy(() -> propuestaService.create(
                    estudiante.getCorreoElectronico(), 10L, requestValido))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Solo los tutores");
            verify(propuestaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Falla si el tutor ya propuso en la misma solicitud")
        void duplicada() {
            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(tutorRepository.findByUsuario_CorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutor));
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(solicitud));
            when(propuestaRepository.existsBySolicitudIdAndTutorId(10L, 5L)).thenReturn(true);

            assertThatThrownBy(() -> propuestaService.create(
                    tutorUsuario.getCorreoElectronico(), 10L, requestValido))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Ya enviaste una propuesta");
        }

        @Test
        @DisplayName("Falla si la solicitud ya fue confirmada")
        void solicitudConfirmada() {
            solicitud.setEstado(EstadoSolicitud.CONFIRMADA);
            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(tutorRepository.findByUsuario_CorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutor));
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> propuestaService.create(
                    tutorUsuario.getCorreoElectronico(), 10L, requestValido))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("confirmada");
            solicitud.setEstado(EstadoSolicitud.PUBLICADA);
        }

        @Test
        @DisplayName("Falla con solicitud inexistente")
        void solicitudInexistente() {
            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(tutorRepository.findByUsuario_CorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutor));
            when(solicitudRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> propuestaService.create(
                    tutorUsuario.getCorreoElectronico(), 99L, requestValido))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asesoria no encontrada");
        }
    }

    @Nested
    @DisplayName("Aceptar propuesta")
    class AceptarPropuesta {

        @Test
        @DisplayName("El owner acepta: propuesta ACEPTADA, demas PENDIENTES a RECHAZADA y solicitud CONFIRMADA")
        void aceptaPropuesta() {
            solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
            Propuesta propia = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Mensaje de propuesta")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            Tutor otroTutor = Tutor.builder().id(6L)
                    .usuario(Usuario.builder().id(3L).nombreCompleto("Tutor Dos").rol(Rol.TUTOR).build())
                    .biografia("Otro tutor")
                    .materias(Set.of()).build();
            Propuesta otra = Propuesta.builder()
                    .id(8L).solicitud(solicitud).tutor(otroTutor).mensaje("Otra propuesta")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(propuestaRepository.findById(7L)).thenReturn(Optional.of(propia));
            when(solicitudRepository.save(any(SolicitudAsesoria.class))).thenAnswer(inv -> inv.getArgument(0));
            when(propuestaRepository.findBySolicitudIdAndEstadoOrderByCreatedAtAsc(10L, EstadoPropuesta.PENDIENTE))
                    .thenReturn(List.of(otra));
            when(propuestaRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(propia, otra));

            TutoringRequestResponse response = propuestaService.accept(estudiante.getCorreoElectronico(), 7L);

            assertThat(propia.getEstado()).isEqualTo(EstadoPropuesta.ACEPTADA);
            assertThat(otra.getEstado()).isEqualTo(EstadoPropuesta.RECHAZADA);
            assertThat(solicitud.getEstado()).isEqualTo(EstadoSolicitud.CONFIRMADA);
            assertThat(response.getEstado()).isEqualTo("CONFIRMADA");
        }

        @Test
        @DisplayName("Solo el estudiante que publico puede aceptar")
        void soloElOwner() {
            Propuesta propuesta = propuestaDe(tutor);
            when(propuestaRepository.findById(7L)).thenReturn(Optional.of(propuesta));

            assertThatThrownBy(() -> propuestaService.accept("otro@elpoli.edu.co", 7L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Solo el estudiante que publico");
        }

        @Test
        @DisplayName("Falla al aceptar una propuesta ya procesada")
        void yaProcesada() {
            Propuesta propuesta = propuestaDe(tutor);
            propuesta.setEstado(EstadoPropuesta.ACEPTADA);
            when(propuestaRepository.findById(7L)).thenReturn(Optional.of(propuesta));

            assertThatThrownBy(() -> propuestaService.accept(estudiante.getCorreoElectronico(), 7L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("ya fue procesada");
        }
    }

    @Nested
    @DisplayName("Rechazar propuesta")
    class RechazarPropuesta {

        @Test
        @DisplayName("El owner rechaza una propuesta pendiente")
        void ownerRechaza() {
            solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
            Propuesta propuesta = propuestaDe(tutor);
            when(propuestaRepository.findById(7L)).thenReturn(Optional.of(propuesta));
            when(propuestaRepository.save(any(Propuesta.class))).thenAnswer(inv -> inv.getArgument(0));

            ProposalResponse response = propuestaService.reject(estudiante.getCorreoElectronico(), 7L);

            assertThat(propuesta.getEstado()).isEqualTo(EstadoPropuesta.RECHAZADA);
            assertThat(response.getEstado()).isEqualTo("RECHAZADA");
            assertThat(response.isMine()).isFalse();
        }

        @Test
        @DisplayName("El tutor puede rechazar su propia propuesta y se marca como suya")
        void tutorRechazaLaSuya() {
            solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
            Propuesta propuesta = propuestaDe(tutor);
            when(propuestaRepository.findById(7L)).thenReturn(Optional.of(propuesta));
            when(propuestaRepository.save(any(Propuesta.class))).thenAnswer(inv -> inv.getArgument(0));

            ProposalResponse response = propuestaService.reject(tutorUsuario.getCorreoElectronico(), 7L);

            assertThat(propuesta.getEstado()).isEqualTo(EstadoPropuesta.RECHAZADA);
            assertThat(response.isMine()).isTrue();
        }

        @Test
        @DisplayName("Un tercero no puede rechazar")
        void terceroNoPuede() {
            Propuesta propuesta = propuestaDe(tutor);
            when(propuestaRepository.findById(7L)).thenReturn(Optional.of(propuesta));

            assertThatThrownBy(() -> propuestaService.reject("otro@elpoli.edu.co", 7L))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    private Propuesta propuestaDe(Tutor t) {
        return Propuesta.builder()
                .id(7L)
                .solicitud(solicitud)
                .tutor(t)
                .mensaje("Mensaje de propuesta")
                .estado(EstadoPropuesta.PENDIENTE)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
