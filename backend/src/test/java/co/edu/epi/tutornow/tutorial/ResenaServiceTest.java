package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.dto.MisResenasResponse;
import co.edu.epi.tutornow.tutorial.dto.ResenaRequest;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoModeracion;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutorial.service.ResenaService;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ResenaService")
class ResenaServiceTest {

    @Mock
    private ResenaRepository resenaRepository;
    @Mock
    private AsesoriaRepository asesoriaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Spy
    private TutorialMapper mapper = new TutorialMapper();
    @InjectMocks
    private ResenaService resenaService;

    private final Materia materia = Materia.builder()
            .id(1L).nombre("Calculo Diferencial").activa(true).build();
    private final Usuario estudiante = Usuario.builder().id(1L)
            .correoElectronico("estudiante@elpoli.edu.co")
            .nombreCompleto("Estudiante Uno").rol(Rol.ESTUDIANTE).build();
    private Usuario tutorUsuario;
    private Tutor tutor;
    private Asesoria asesoria;

    @BeforeEach
    void setUp() {
        tutorUsuario = Usuario.builder().id(2L)
                .correoElectronico("tutor@elpoli.edu.co")
                .nombreCompleto("Tutor Uno").rol(Rol.TUTOR).build();
        tutor = Tutor.builder().id(5L).usuario(tutorUsuario).materias(Set.of(materia)).build();
        SolicitudAsesoria solicitud = SolicitudAsesoria.builder()
                .id(1L).estudiante(estudiante).materia(materia).tema("Derivadas")
                .estado(EstadoSolicitud.CONFIRMADA).createdAt(OffsetDateTime.now()).build();
        Propuesta propuesta = Propuesta.builder()
                .id(7L).solicitud(solicitud).tutor(tutor).mensaje("Propuesta")
                .estado(EstadoPropuesta.ACEPTADA).createdAt(OffsetDateTime.now()).build();
        asesoria = Asesoria.builder()
                .id(20L).solicitud(solicitud).propuesta(propuesta)
                .estudiante(estudiante).tutor(tutor)
                .estado(EstadoAsesoria.FINALIZADA)
                .finalizadaAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now()).build();
    }

    @Nested
    @DisplayName("Crear resena")
    class CrearResena {

        @Test
        @DisplayName("El estudiante califica primero y queda esperando a la contraparte")
        void estudianteCalificaPrimero() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findByIdConParticipantesForUpdate(20L)).thenReturn(Optional.of(asesoria));
            when(resenaRepository.existsByAsesoriaIdAndAutorId(20L, 1L)).thenReturn(false);
            when(resenaRepository.save(any(Resena.class))).thenAnswer(inv -> {
                Resena r = inv.getArgument(0);
                r.setId(100L);
                r.setCreatedAt(OffsetDateTime.now());
                return r;
            });

            AsesoriaResponse response = resenaService.crear(estudiante.getCorreoElectronico(), 20L,
                    ResenaRequest.builder().rating(5).comentario("Excelente asesoria").build());

            assertThat(asesoria.getEstado()).isEqualTo(EstadoAsesoria.FINALIZADA);
            assertThat(response.getEstadoEvaluacion()).isEqualTo("ESPERANDO_CONTRAPARTE");
            assertThat(response.getMiResena()).isNotNull();
            assertThat(response.getMiResena().getRolAutor()).isEqualTo("ESTUDIANTE");
            assertThat(response.getResenaContraparte()).isNull();
        }

        @Test
        @DisplayName("Cuando ambas partes califican la asesoria pasa a EVALUADA")
        void ambasPartesCalifican() {
            Resena resenaEstudiante = Resena.builder()
                    .id(100L).asesoria(asesoria).autor(estudiante)
                    .rolAutor(RolAutorResena.ESTUDIANTE).rating(5)
                    .comentario("Excelente asesoria").createdAt(OffsetDateTime.now()).build();
            asesoria.getResenas().add(resenaEstudiante);

            when(usuarioRepository.findByCorreoElectronico(tutorUsuario.getCorreoElectronico()))
                    .thenReturn(Optional.of(tutorUsuario));
            when(asesoriaRepository.findByIdConParticipantesForUpdate(20L)).thenReturn(Optional.of(asesoria));
            when(resenaRepository.existsByAsesoriaIdAndAutorId(20L, 2L)).thenReturn(false);
            when(resenaRepository.countByAsesoriaIdAndEstadoModeracion(20L, EstadoModeracion.VISIBLE))
                    .thenReturn(2L);
            when(resenaRepository.save(any(Resena.class))).thenAnswer(inv -> {
                Resena r = inv.getArgument(0);
                r.setId(101L);
                r.setCreatedAt(OffsetDateTime.now());
                return r;
            });
            when(asesoriaRepository.save(any(Asesoria.class))).thenAnswer(inv -> inv.getArgument(0));

            AsesoriaResponse response = resenaService.crear(tutorUsuario.getCorreoElectronico(), 20L,
                    ResenaRequest.builder().rating(4).comentario("Buen estudiante").build());

            assertThat(asesoria.getEstado()).isEqualTo(EstadoAsesoria.EVALUADA);
            assertThat(response.getEstado()).isEqualTo("EVALUADA");
            assertThat(response.getEstadoEvaluacion()).isEqualTo("COMPLETA");
            assertThat(response.getMiResena()).isNotNull();
            assertThat(response.getMiResena().getRolAutor()).isEqualTo("TUTOR");
            assertThat(response.getResenaContraparte()).isNotNull();
            assertThat(response.getResenaContraparte().getRolAutor()).isEqualTo("ESTUDIANTE");
        }

        @Test
        @DisplayName("No permite calificar dos veces la misma asesoria")
        void noPermiteDuplicado() {
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findByIdConParticipantesForUpdate(20L)).thenReturn(Optional.of(asesoria));
            when(resenaRepository.existsByAsesoriaIdAndAutorId(20L, 1L)).thenReturn(true);

            assertThatThrownBy(() -> resenaService.crear(estudiante.getCorreoElectronico(), 20L,
                    ResenaRequest.builder().rating(5).comentario("Excelente asesoria").build()))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Ya enviaste");
        }

        @Test
        @DisplayName("Una persona ajena no puede calificar")
        void terceroNoCalifica() {
            Usuario otro = Usuario.builder().id(9L)
                    .correoElectronico("otro@elpoli.edu.co").rol(Rol.ESTUDIANTE).build();
            when(usuarioRepository.findByCorreoElectronico(otro.getCorreoElectronico()))
                    .thenReturn(Optional.of(otro));
            when(asesoriaRepository.findByIdConParticipantesForUpdate(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> resenaService.crear(otro.getCorreoElectronico(), 20L,
                    ResenaRequest.builder().rating(5).comentario("Excelente asesoria").build()))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("partes de la asesoria");
        }

        @Test
        @DisplayName("No permite calificar una asesoria que aun no finaliza")
        void noFinalizada() {
            asesoria.setEstado(EstadoAsesoria.PENDIENTE);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findByIdConParticipantesForUpdate(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> resenaService.crear(estudiante.getCorreoElectronico(), 20L,
                    ResenaRequest.builder().rating(5).comentario("Excelente asesoria").build()))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("no ha finalizado");
        }

        @Test
        @DisplayName("No permite calificar una asesoria cancelada")
        void cancelada() {
            asesoria.setEstado(EstadoAsesoria.CANCELADA);
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(asesoriaRepository.findByIdConParticipantesForUpdate(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> resenaService.crear(estudiante.getCorreoElectronico(), 20L,
                    ResenaRequest.builder().rating(5).comentario("Excelente asesoria").build()))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("cancelada");
        }
    }

    @Nested
    @DisplayName("Mis resenas")
    class MisResenas {

        @Test
        @DisplayName("Devuelve promedio privado, resenas recibidas y pendientes")
        void devuelveResumen() {
            Resena recibida1 = Resena.builder()
                    .id(100L).asesoria(asesoria).autor(tutorUsuario)
                    .rolAutor(RolAutorResena.TUTOR).rating(5)
                    .comentario("Buen estudiante").createdAt(OffsetDateTime.now()).build();
            Resena recibida2 = Resena.builder()
                    .id(101L).asesoria(asesoria).autor(tutorUsuario)
                    .rolAutor(RolAutorResena.TUTOR).rating(4)
                    .comentario("Bien").createdAt(OffsetDateTime.now()).build();
            Resena recibida3 = Resena.builder()
                    .id(102L).asesoria(asesoria).autor(tutorUsuario)
                    .rolAutor(RolAutorResena.TUTOR).rating(5)
                    .comentario("Muy bien").createdAt(OffsetDateTime.now()).build();
            when(usuarioRepository.findByCorreoElectronico(estudiante.getCorreoElectronico()))
                    .thenReturn(Optional.of(estudiante));
            when(resenaRepository.findRecibidasPorEstudiante(1L, RolAutorResena.TUTOR, EstadoAsesoria.EVALUADA))
                    .thenReturn(List.of(recibida1, recibida2, recibida3));
            when(asesoriaRepository.findPendientesDeResena(1L, EstadoAsesoria.FINALIZADA))
                    .thenReturn(List.of(asesoria));

            MisResenasResponse response = resenaService.obtenerMisResenas(estudiante.getCorreoElectronico());

            assertThat(response.getPromedioRating()).isEqualTo(4.7);
            assertThat(response.getTotalResenas()).isEqualTo(3L);
            assertThat(response.getResenasRecibidas()).hasSize(3);
            assertThat(response.getResenasRecibidas().get(0).getComentario()).isEqualTo("Buen estudiante");
            assertThat(response.getPendientes()).hasSize(1);
            assertThat(response.getPendientes().get(0).getAsesoriaId()).isEqualTo(20L);
            assertThat(response.getPendientes().get(0).getContraparte()).isEqualTo("Tutor Uno");
        }
    }
}
