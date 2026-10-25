package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.dto.CreateTutoringRequest;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.tutorial.service.SolicitudService;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SolicitudService")
class SolicitudServiceTest {

    @Mock
    private SolicitudAsesoriaRepository solicitudRepository;
    @Mock
    private PropuestaRepository propuestaRepository;
    @Mock
    private AsesoriaRepository asesoriaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private MateriaRepository materiaRepository;
    @Spy
    private TutorialMapper mapper = new TutorialMapper();
    @InjectMocks
    private SolicitudService solicitudService;

    private final Usuario estudiante = Usuario.builder()
            .id(1L)
            .correoElectronico("joseph_rojas82231@elpoli.edu.co")
            .nombreCompleto("Joseph Rojas")
            .rol(Rol.ESTUDIANTE)
            .build();

    private final Materia materiaCalculo = Materia.builder()
            .id(1L)
            .nombre("Calculo Diferencial")
            .activa(true)
            .build();

    @Nested
    @DisplayName("Publicar asesoria")
    class CrearSolicitud {

        @Test
        @DisplayName("Publica correctamente y guarda estado PUBLICADA con campos normalizados")
        void publicaCorrectamente() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(materiaRepository.findById(1L)).thenReturn(Optional.of(materiaCalculo));
            when(solicitudRepository.save(any(SolicitudAsesoria.class)))
                    .thenAnswer(inv -> {
                        SolicitudAsesoria s = inv.getArgument(0);
                        s.setId(10L);
                        return s;
                    });
            CreateTutoringRequest request = CreateTutoringRequest.builder()
                    .materiaId(1L)
                    .tema("  Derivadas parciales  ")
                    .modalidad("VIRTUAL")
                    .disponibilidad("Lunes y miercoles 2-4pm")
                    .descripcion("   ")
                    .build();

            TutoringRequestResponse response = solicitudService.create(estudiante.getCorreoElectronico(), request);

            ArgumentCaptor<SolicitudAsesoria> captor = ArgumentCaptor.forClass(SolicitudAsesoria.class);
            verify(solicitudRepository).save(captor.capture());
            SolicitudAsesoria guardada = captor.getValue();
            assertThat(guardada.getTema()).isEqualTo("Derivadas parciales");
            assertThat(guardada.getModalidad()).isEqualTo(Modalidad.VIRTUAL);
            assertThat(guardada.getEstado()).isEqualTo(EstadoSolicitud.PUBLICADA);
            assertThat(guardada.getDescripcion()).isNull();
            assertThat(guardada.getEstudiante()).isSameAs(estudiante);
            assertThat(guardada.getMateria()).isSameAs(materiaCalculo);
            assertThat(response.getId()).isEqualTo(10L);
            assertThat(response.getEstado()).isEqualTo("PUBLICADA");
            assertThat(response.getPropuestasCount()).isZero();
            assertThat(response.isOwner()).isTrue();
            assertThat(response.getPropuestas()).isEmpty();
        }

        @Test
        @DisplayName("Un tutor tambien puede publicar una demanda, incluso de materias que no asesora")
        void tutorPublica() {
            Usuario tutor = Usuario.builder().id(2L)
                    .correoElectronico("tutor@elpoli.edu.co")
                    .nombreCompleto("Tutor Uno")
                    .rol(Rol.TUTOR).build();
            when(usuarioRepository.findByCorreoElectronico("tutor@elpoli.edu.co"))
                    .thenReturn(Optional.of(tutor));
            when(materiaRepository.findById(1L)).thenReturn(Optional.of(materiaCalculo));
            when(solicitudRepository.save(any(SolicitudAsesoria.class)))
                    .thenAnswer(inv -> {
                        SolicitudAsesoria s = inv.getArgument(0);
                        s.setId(10L);
                        return s;
                    });

            TutoringRequestResponse response = solicitudService.create("tutor@elpoli.edu.co",
                    CreateTutoringRequest.builder().materiaId(1L).tema("Derivadas parciales")
                            .modalidad("VIRTUAL").disponibilidad("Sabados manana").build());

            ArgumentCaptor<SolicitudAsesoria> captor = ArgumentCaptor.forClass(SolicitudAsesoria.class);
            verify(solicitudRepository).save(captor.capture());
            assertThat(captor.getValue().getEstado()).isEqualTo(EstadoSolicitud.PUBLICADA);
            assertThat(captor.getValue().getEstudiante()).isSameAs(tutor);
            assertThat(response.isOwner()).isTrue();
        }

        @Test
        @DisplayName("Un administrador no puede publicar")
        void rechazaAdmin() {
            Usuario admin = Usuario.builder().id(3L).rol(Rol.ADMIN).build();
            when(usuarioRepository.findByCorreoElectronico("admin@elpoli.edu.co"))
                    .thenReturn(Optional.of(admin));

            assertThatThrownBy(() -> solicitudService.create("admin@elpoli.edu.co",
                    CreateTutoringRequest.builder().materiaId(1L).tema("Tema valido aqui")
                            .modalidad("VIRTUAL").disponibilidad("Sabados manana").build()))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Los administradores");
            verify(solicitudRepository, never()).save(any());
        }

        @Test
        @DisplayName("Falla si la materia no existe o esta inactiva")
        void materiaInactiva() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(materiaRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> solicitudService.create(estudiante.getCorreoElectronico(),
                    CreateTutoringRequest.builder().materiaId(99L).tema("Tema valido aqui")
                            .modalidad("PRESENCIAL").disponibilidad("Jueves 8-10am").build()))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("materia");
        }
    }

    @Nested
    @DisplayName("Listar asesorias")
    class ListarSolicitudes {

        @Test
        @DisplayName("Estudiante lista solo las suyas (con su id) y con isProfileMatch nulo")
        void estudianteListaSoloLasSuyas() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.PUBLICADA);
            when(solicitudRepository.findFiltered(any(), any(), anyBoolean(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(solicitud), PageRequest.of(0, 10), 1));
            when(propuestaRepository.countGroupedBySolicitudId(List.of(1L)))
                    .thenReturn(List.<Object[]>of(new Object[]{1L, 3L}));

            PageResponse<TutoringRequestResponse> page = solicitudService.list(
                    estudiante.getCorreoElectronico(), null, null, null, 0, 10);

            verify(solicitudRepository).findFiltered(eq(1L), eq(1L), eq(false),
                    eq(EstadoSolicitud.CANCELADA), isNull(), isNull(), isNull(), any());
            verify(solicitudRepository, never()).findFilteredPrioritized(
                    any(), anyBoolean(), any(), any(), any(), any(), any(), any());
            assertThat(page.getData()).hasSize(1);
            assertThat(page.getData().get(0).getPropuestasCount()).isEqualTo(3L);
            assertThat(page.getData().get(0).getIsProfileMatch()).isNull();
            assertThat(page.getData().get(0).isOwner()).isTrue();
            assertThat(page.getPagination().getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Tutor recibe las solicitudes priorizadas por su perfil")
        void tutorListaPriorizado() {
            Usuario tutorUsuario = Usuario.builder().id(2L).rol(Rol.TUTOR).build();
            Tutor tutor = Tutor.builder().id(5L).usuario(tutorUsuario).materias(Set.of(materiaCalculo)).build();
            when(usuarioRepository.findByCorreoElectronico("tutor@elpoli.edu.co")).thenReturn(Optional.of(tutorUsuario));
            when(tutorRepository.findByUsuario_CorreoElectronico("tutor@elpoli.edu.co")).thenReturn(Optional.of(tutor));
            SolicitudAsesoria match = solicitudDeEstudiante(1L, EstadoSolicitud.PUBLICADA);
            SolicitudAsesoria otro = SolicitudAsesoria.builder()
                    .id(2L).estudiante(estudiante)
                    .materia(Materia.builder().id(2L).nombre("Fisica").activa(true).build())
                    .tema("Tiro parabolico").modalidad(Modalidad.VIRTUAL)
                    .disponibilidad("Viernes 10-12am").estado(EstadoSolicitud.PUBLICADA)
                    .createdAt(OffsetDateTime.now()).build();
            when(solicitudRepository.findFilteredPrioritized(any(), anyBoolean(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(match, otro), PageRequest.of(0, 10), 2));

            PageResponse<TutoringRequestResponse> page = solicitudService.list(
                    "tutor@elpoli.edu.co", null, null, null, 0, 10);

            verify(solicitudRepository).findFilteredPrioritized(eq(2L), eq(true),
                    eq(EstadoSolicitud.CANCELADA), isNull(), isNull(), isNull(), any(), any());
            assertThat(page.getData()).hasSize(2);
            assertThat(page.getData().get(0).getIsProfileMatch()).isTrue();
            assertThat(page.getData().get(1).getIsProfileMatch()).isFalse();
            assertThat(page.getData().get(0).isOwner()).isFalse();
        }

        @Test
        @DisplayName("El estudiante ve el estado de su asesoria en el listado")
        void estudianteListaConAsesoria() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Propuesta aceptada = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Gane la propuesta")
                    .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).propuesta(aceptada)
                    .estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(solicitudRepository.findFiltered(any(), any(), anyBoolean(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(solicitud), PageRequest.of(0, 10), 1));
            when(asesoriaRepository.findBySolicitudIdIn(List.of(1L))).thenReturn(List.of(asesoria));

            PageResponse<TutoringRequestResponse> page = solicitudService.list(
                    estudiante.getCorreoElectronico(), null, null, null, 0, 10);

            assertThat(page.getData().get(0).getAsesoria()).isNotNull();
            assertThat(page.getData().get(0).getAsesoria().getId()).isEqualTo(20L);
            assertThat(page.getData().get(0).getAsesoria().getEstado()).isEqualTo("PENDIENTE");
        }

        @Test
        @DisplayName("Falla ante un filtro de estado invalido")
        void estadoInvalido() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));

            assertThatThrownBy(() -> solicitudService.list(
                    estudiante.getCorreoElectronico(), null, null, "CUALQUIERA", 0, 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Estado no valido");
        }
    }

    @Nested
    @DisplayName("Asesorias aceptadas por el tutor")
    class AsesoriasAceptadas {

        @Test
        @DisplayName("Devuelve las asesorias aceptadas con los datos de la solicitud")
        void listaAceptadas() {
            Usuario tutorUsuario = Usuario.builder().id(2L)
                    .correoElectronico("tutor@elpoli.edu.co")
                    .nombreCompleto("Tutor Uno")
                    .rol(Rol.TUTOR).build();
            Tutor tutor = Tutor.builder().id(5L).usuario(tutorUsuario).materias(Set.of(materiaCalculo)).build();
            when(usuarioRepository.findByCorreoElectronico("tutor@elpoli.edu.co"))
                    .thenReturn(Optional.of(tutorUsuario));
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Propuesta propuesta = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Puedo ayudarte con eso")
                    .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).propuesta(propuesta)
                    .estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(asesoriaRepository.findByTutorCorreo(eq("tutor@elpoli.edu.co"),
                    eq(EstadoAsesoria.CANCELADA), any()))
                    .thenReturn(new PageImpl<>(List.of(asesoria), PageRequest.of(0, 20), 1));
            when(propuestaRepository.countGroupedBySolicitudId(List.of(1L)))
                    .thenReturn(List.<Object[]>of(new Object[]{1L, 1L}));

            PageResponse<TutoringRequestResponse> page = solicitudService
                    .listAcceptedForTutor("tutor@elpoli.edu.co", 0, 20);

            assertThat(page.getData()).hasSize(1);
            TutoringRequestResponse item = page.getData().get(0);
            assertThat(item.getId()).isEqualTo(1L);
            assertThat(item.getEstado()).isEqualTo("CONFIRMADA");
            assertThat(item.getAsesoria()).isNotNull();
            assertThat(item.getAsesoria().getId()).isEqualTo(20L);
            assertThat(item.getAsesoria().getTutor().getFullName()).isEqualTo("Tutor Uno");
            assertThat(item.getIsProfileMatch()).isNull();
            assertThat(page.getPagination().getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Un estudiante no puede consultar asesorias aceptadas (403)")
        void estudianteNoTieneAceptadas() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));

            assertThatThrownBy(() -> solicitudService
                    .listAcceptedForTutor(estudiante.getCorreoElectronico(), 0, 20))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Solo los tutores");
            verify(asesoriaRepository, never()).findByTutorCorreo(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Detalle y cancelacion")
    class DetalleYCancelacion {

        @Test
        @DisplayName("El estudiante ve su detalle con propuestas y el tutor ve isProfileMatch")
        void detalle() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.EN_PROCESO);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Propuesta propuesta = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Puedo ayudarte con eso")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(propuesta));

            TutoringRequestResponse response = solicitudService.getById(estudiante.getCorreoElectronico(), 1L);

            assertThat(response.getEstado()).isEqualTo("EN_PROCESO");
            assertThat(response.getPropuestasCount()).isEqualTo(1);
            assertThat(response.getPropuestas().get(0).isMine()).isFalse();
            assertThat(response.getPropuestas().get(0).getTutor().getFullName()).isEqualTo("Tutor Uno");
        }

        @Test
        @DisplayName("Un estudiante ajeno NO puede ver el detalle (403)")
        void sinAcceso() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.PUBLICADA);
            Usuario otro = Usuario.builder().id(9L).rol(Rol.ESTUDIANTE).build();
            when(usuarioRepository.findByCorreoElectronico("otro@elpoli.edu.co")).thenReturn(Optional.of(otro));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> solicitudService.getById("otro@elpoli.edu.co", 1L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("No tienes acceso");
            assertThatThrownBy(() -> solicitudService.listProposals("otro@elpoli.edu.co", 1L))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("El owner cancela: estado CANCELADA y propuestas pendientes a RECHAZADA")
        void cancelarPropiasPendientes() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.EN_PROCESO);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(solicitudRepository.save(any(SolicitudAsesoria.class))).thenAnswer(inv -> inv.getArgument(0));
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Propuesta pendiente = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Mensaje de propuesta")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(propuestaRepository.findBySolicitudIdAndEstadoOrderByCreatedAtAsc(1L, EstadoPropuesta.PENDIENTE))
                    .thenReturn(List.of(pendiente));
            when(propuestaRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(pendiente));

            TutoringRequestResponse response = solicitudService.cancel(estudiante.getCorreoElectronico(), 1L);

            assertThat(solicitud.getEstado()).isEqualTo(EstadoSolicitud.CANCELADA);
            assertThat(pendiente.getEstado()).isEqualTo(EstadoPropuesta.RECHAZADA);
            assertThat(response.getEstado()).isEqualTo("CANCELADA");
        }

        @Test
        @DisplayName("No se puede cancelar una asesoria confirmada")
        void noCancelaConfirmada() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> solicitudService.cancel(estudiante.getCorreoElectronico(), 1L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("confirmada");
        }

        @Test
        @DisplayName("El dueno cancela una asesoria en coordinacion y la asesoria pasa a CANCELADA")
        void duenoCancelaEnCoordinacion() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Propuesta aceptada = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Gane la propuesta")
                    .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).propuesta(aceptada)
                    .estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(aceptada));

            TutoringRequestResponse response = solicitudService.cancel(estudiante.getCorreoElectronico(), 1L);

            assertThat(solicitud.getEstado()).isEqualTo(EstadoSolicitud.CANCELADA);
            assertThat(asesoria.getEstado()).isEqualTo(EstadoAsesoria.CANCELADA);
            assertThat(response.getAsesoria().getEstado()).isEqualTo("CANCELADA");
        }

        @Test
        @DisplayName("El tutor asignado cancela una asesoria en coordinacion")
        void tutorAsignadoCancelaEnCoordinacion() {
            Usuario tutorUsuario = Usuario.builder().id(2L)
                    .correoElectronico("andres_tutor1@elpoli.edu.co")
                    .nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build();
            Tutor tutor = Tutor.builder().id(5L).usuario(tutorUsuario)
                    .materias(Set.of(materiaCalculo)).build();
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Propuesta aceptada = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Gane la propuesta")
                    .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).propuesta(aceptada)
                    .estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));
            when(tutorRepository.findByUsuario_CorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutor));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(aceptada));

            TutoringRequestResponse response = solicitudService.cancel(tutorUsuario.getCorreoElectronico(), 1L);

            assertThat(solicitud.getEstado()).isEqualTo(EstadoSolicitud.CANCELADA);
            assertThat(asesoria.getEstado()).isEqualTo(EstadoAsesoria.CANCELADA);
            assertThat(response.getEstado()).isEqualTo("CANCELADA");
        }

        @Test
        @DisplayName("Un tutor no asignado no puede cancelar (403)")
        void tutorAjenoNoCancela() {
            Usuario otroTutor = Usuario.builder().id(3L)
                    .correoElectronico("juana_tutor2@elpoli.edu.co")
                    .nombreCompleto("Juana Gomez").rol(Rol.TUTOR).build();
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(otroTutor.getCorreoElectronico()))
                    .thenReturn(Optional.of(otroTutor));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> solicitudService.cancel(otroTutor.getCorreoElectronico(), 1L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Solo el estudiante o el tutor");
            assertThat(asesoria.getEstado()).isEqualTo(EstadoAsesoria.PENDIENTE);
        }

        @Test
        @DisplayName("No se puede cancelar una asesoria ya finalizada")
        void noCancelaFinalizada() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.FINALIZADA).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> solicitudService.cancel(estudiante.getCorreoElectronico(), 1L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("finalizada");
        }

        @Test
        @DisplayName("Lanza 404 ante una asesoria inexistente")
        void noExiste() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> solicitudService.getById(estudiante.getCorreoElectronico(), 404L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asesoria no encontrada");
        }
    }

    @Nested
    @DisplayName("Visibilidad de propuestas y asesoria")
    class VisibilidadPropuestas {

        @Test
        @DisplayName("Un tutor no aceptado solo ve su propia propuesta")
        void tutorNoAceptadoSoloVeSuPropuesta() {
            Usuario viewer = Usuario.builder().id(3L)
                    .correoElectronico("juana_tutor2@elpoli.edu.co")
                    .nombreCompleto("Juana Gomez").rol(Rol.TUTOR).build();
            Tutor otro = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Tutor tutorViewer = Tutor.builder().id(6L).usuario(viewer)
                    .materias(Set.of(materiaCalculo)).build();
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.EN_PROCESO);
            Propuesta ajena = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(otro).mensaje("Otra propuesta")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            Propuesta propia = Propuesta.builder()
                    .id(8L).solicitud(solicitud).tutor(tutorViewer).mensaje("Mi propuesta")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(viewer.getCorreoElectronico()))
                    .thenReturn(Optional.of(viewer));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(ajena, propia));
            when(tutorRepository.findByUsuario_CorreoElectronico(viewer.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorViewer));

            TutoringRequestResponse response = solicitudService.getById(viewer.getCorreoElectronico(), 1L);

            assertThat(response.getPropuestas()).hasSize(1);
            assertThat(response.getPropuestas().get(0).isMine()).isTrue();
            assertThat(response.getPropuestas().get(0).getTutor().getFullName()).isEqualTo("Juana Gomez");
            assertThat(response.getAsesoria()).isNull();
            verify(asesoriaRepository).findBySolicitudId(1L);
        }

        @Test
        @DisplayName("Un tutor ajeno no puede abrir una asesoria ya aceptada por otro tutor (403)")
        void tutorAjenoNoVeAsesoriaAceptada() {
            Usuario viewer = Usuario.builder().id(3L)
                    .correoElectronico("juana_tutor2@elpoli.edu.co")
                    .nombreCompleto("Juana Gomez").rol(Rol.TUTOR).build();
            Tutor tutorAceptado = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).estudiante(estudiante).tutor(tutorAceptado)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(viewer.getCorreoElectronico()))
                    .thenReturn(Optional.of(viewer));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> solicitudService.getById(viewer.getCorreoElectronico(), 1L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("No tienes acceso");
        }

        @Test
        @DisplayName("El tutor aceptado ve todas las propuestas y su asesoria")
        void tutorAceptadoVeTodasYSuAsesoria() {
            Usuario viewer = Usuario.builder().id(2L)
                    .correoElectronico("andres_tutor1@elpoli.edu.co")
                    .nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build();
            Tutor aceptado = Tutor.builder().id(5L).usuario(viewer)
                    .materias(Set.of(materiaCalculo)).build();
            Tutor otro = Tutor.builder().id(6L)
                    .usuario(Usuario.builder().id(3L).nombreCompleto("Tutor Dos").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Propuesta aceptada = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(aceptado).mensaje("Gane la propuesta")
                    .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
            Propuesta rechazada = Propuesta.builder()
                    .id(8L).solicitud(solicitud).tutor(otro).mensaje("Otra propuesta")
                    .estado(EstadoPropuesta.RECHAZADA).createdAt(OffsetDateTime.now()).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).propuesta(aceptada)
                    .estudiante(estudiante).tutor(aceptado)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(viewer.getCorreoElectronico()))
                    .thenReturn(Optional.of(viewer));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(aceptada, rechazada));
            when(tutorRepository.findByUsuario_CorreoElectronico(viewer.getCorreoElectronico()))
                    .thenReturn(Optional.of(aceptado));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));

            TutoringRequestResponse response = solicitudService.getById(viewer.getCorreoElectronico(), 1L);

            assertThat(response.getPropuestas()).hasSize(2);
            assertThat(response.getPropuestas())
                    .anyMatch(p -> p.isMine() && "ACEPTADA".equals(p.getEstado()));
            assertThat(response.getAsesoria()).isNotNull();
            assertThat(response.getAsesoria().getTutor().getFullName()).isEqualTo("Tutor Uno");
        }

        @Test
        @DisplayName("Un tutor que publico la demanda (dueno) ve todas las propuestas")
        void tutorDuenoVeTodas() {
            Usuario tutorDueno = Usuario.builder().id(3L)
                    .correoElectronico("tutor_dueno@elpoli.edu.co")
                    .nombreCompleto("Tutor Dueno").rol(Rol.TUTOR).build();
            Tutor otro = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            SolicitudAsesoria solicitud = SolicitudAsesoria.builder()
                    .id(1L).estudiante(tutorDueno).materia(materiaCalculo)
                    .tema("Derivadas parciales").modalidad(Modalidad.VIRTUAL)
                    .disponibilidad("Lunes y miercoles 2-4pm")
                    .estado(EstadoSolicitud.EN_PROCESO).createdAt(OffsetDateTime.now()).build();
            Propuesta propuesta = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(otro).mensaje("Puedo ayudarte")
                    .estado(EstadoPropuesta.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(tutorDueno.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorDueno));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(propuesta));

            TutoringRequestResponse response = solicitudService
                    .getById(tutorDueno.getCorreoElectronico(), 1L);

            assertThat(response.getPropuestas()).hasSize(1);
            assertThat(response.getPropuestas().get(0).isMine()).isFalse();
            assertThat(response.getPropuestas().get(0).getTutor().getFullName()).isEqualTo("Tutor Uno");
        }

        @Test
        @DisplayName("El estudiante dueño ve todas las propuestas y la asesoria")
        void duenoVeTodasYSuAsesoria() {
            SolicitudAsesoria solicitud = solicitudDeEstudiante(1L, EstadoSolicitud.CONFIRMADA);
            Tutor tutor = Tutor.builder().id(5L)
                    .usuario(Usuario.builder().id(2L).nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build())
                    .materias(Set.of(materiaCalculo)).build();
            Propuesta aceptada = Propuesta.builder()
                    .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Gane la propuesta")
                    .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
            Propuesta rechazada = Propuesta.builder()
                    .id(8L).solicitud(solicitud).tutor(tutor).mensaje("Otra propuesta")
                    .estado(EstadoPropuesta.RECHAZADA).createdAt(OffsetDateTime.now()).build();
            Asesoria asesoria = Asesoria.builder()
                    .id(20L).solicitud(solicitud).propuesta(aceptada)
                    .estudiante(estudiante).tutor(tutor)
                    .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(solicitudRepository.findById(1L)).thenReturn(Optional.of(solicitud));
            when(propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(aceptada, rechazada));
            when(asesoriaRepository.findBySolicitudId(1L)).thenReturn(Optional.of(asesoria));

            TutoringRequestResponse response = solicitudService
                    .getById(estudiante.getCorreoElectronico(), 1L);

            assertThat(response.getPropuestas()).hasSize(2);
            assertThat(response.getPropuestas()).allMatch(p -> !p.isMine());
            assertThat(response.getAsesoria()).isNotNull();
            assertThat(response.getAsesoria().getId()).isEqualTo(20L);
        }
    }

    private SolicitudAsesoria solicitudDeEstudiante(Long id, EstadoSolicitud estado) {
        return SolicitudAsesoria.builder()
                .id(id)
                .estudiante(estudiante)
                .materia(materiaCalculo)
                .tema("Derivadas parciales")
                .modalidad(Modalidad.VIRTUAL)
                .disponibilidad("Lunes y miercoles 2-4pm")
                .estado(estado)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
