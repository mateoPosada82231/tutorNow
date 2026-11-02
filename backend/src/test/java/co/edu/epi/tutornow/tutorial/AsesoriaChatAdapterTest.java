package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatResumen;
import co.edu.epi.tutornow.tutorial.port.ParticipanteAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.service.AsesoriaChatAdapter;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AsesoriaChatAdapter")
class AsesoriaChatAdapterTest {

    @Mock
    private AsesoriaRepository asesoriaRepository;

    @InjectMocks
    private AsesoriaChatAdapter adapter;

    private final Usuario estudiante = Usuario.builder().id(1L)
            .correoElectronico("joseph_rojas82231@elpoli.edu.co")
            .nombreCompleto("Joseph Rojas").rol(Rol.ESTUDIANTE).build();
    private final Usuario tutorUsuario = Usuario.builder().id(2L)
            .correoElectronico("andres_tutor1@elpoli.edu.co")
            .nombreCompleto("Andres Tutor").rol(Rol.TUTOR).build();
    private final Materia materia = Materia.builder().id(3L).nombre("Calculo Diferencial").activa(true).build();

    private Asesoria asesoria;

    @BeforeEach
    void setUp() {
        Tutor tutor = Tutor.builder().id(5L).usuario(tutorUsuario).materias(Set.of(materia)).build();
        SolicitudAsesoria solicitud = SolicitudAsesoria.builder()
                .id(1L).estudiante(estudiante).materia(materia).tema("Derivadas")
                .createdAt(OffsetDateTime.now()).build();
        asesoria = Asesoria.builder()
                .id(20L).solicitud(solicitud).estudiante(estudiante).tutor(tutor)
                .estado(EstadoAsesoria.PENDIENTE).createdAt(OffsetDateTime.now()).build();
    }

    @Nested
    @DisplayName("Acceso al chat")
    class Acceso {

        @Test
        @DisplayName("El estudiante de la asesoria participa")
        void estudianteParticipa() {
            when(asesoriaRepository.findByIdConParticipantes(20L)).thenReturn(Optional.of(asesoria));

            ParticipanteAsesoria participante = adapter.requireParticipante(20L, 1L);

            assertThat(participante.participa(1L)).isTrue();
            assertThat(participante.esEstudiante(1L)).isTrue();
            assertThat(participante.permiteEscritura()).isTrue();
        }

        @Test
        @DisplayName("El tutor participa por su usuario, no por el id de tutor")
        void tutorParticipa() {
            when(asesoriaRepository.findByIdConParticipantes(20L)).thenReturn(Optional.of(asesoria));

            ParticipanteAsesoria participante = adapter.requireParticipante(20L, 2L);

            assertThat(participante.esTutor(2L)).isTrue();
            assertThat(participante.participa(5L)).isFalse();
        }

        @Test
        @DisplayName("Un tercero recibe 403")
        void terceroProhibido() {
            when(asesoriaRepository.findByIdConParticipantes(20L)).thenReturn(Optional.of(asesoria));

            assertThatThrownBy(() -> adapter.requireParticipante(20L, 9L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("partes de la asesoria");
        }

        @Test
        @DisplayName("Una asesoria inexistente recibe 404")
        void inexistente() {
            when(asesoriaRepository.findByIdConParticipantes(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adapter.requireParticipante(404L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asesoria no encontrada");
        }

        @Test
        @DisplayName("Una asesoria finalizada no permite escritura")
        void finalizadaSinEscritura() {
            asesoria.setEstado(EstadoAsesoria.FINALIZADA);
            when(asesoriaRepository.findByIdConParticipantes(20L)).thenReturn(Optional.of(asesoria));

            assertThat(adapter.requireParticipante(20L, 1L).permiteEscritura()).isFalse();
        }
    }

    @Nested
    @DisplayName("Listado de hilos")
    class Listado {

        @Test
        @DisplayName("Mapea contrapartes, materia y estado")
        void mapeaResumen() {
            when(asesoriaRepository.findByParticipante(1L)).thenReturn(List.of(asesoria));

            List<AsesoriaChatResumen> resumenes = adapter.listarPorUsuario(1L);

            assertThat(resumenes).hasSize(1);
            AsesoriaChatResumen resumen = resumenes.get(0);
            assertThat(resumen.asesoriaId()).isEqualTo(20L);
            assertThat(resumen.estudianteNombre()).isEqualTo("Joseph Rojas");
            assertThat(resumen.tutorUsuarioId()).isEqualTo(2L);
            assertThat(resumen.tutorNombre()).isEqualTo("Andres Tutor");
            assertThat(resumen.materia()).isEqualTo("Calculo Diferencial");
            assertThat(resumen.tema()).isEqualTo("Derivadas");
            assertThat(resumen.estado()).isEqualTo(EstadoAsesoria.PENDIENTE);
        }
    }
}
