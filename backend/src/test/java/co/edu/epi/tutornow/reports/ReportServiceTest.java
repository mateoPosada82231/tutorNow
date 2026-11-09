package co.edu.epi.tutornow.reports;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.reports.dto.AdminReportResponse;
import co.edu.epi.tutornow.reports.dto.CreateReportRequest;
import co.edu.epi.tutornow.reports.dto.ReportResponse;
import co.edu.epi.tutornow.reports.dto.ResolveReportRequest;
import co.edu.epi.tutornow.reports.model.EstadoReporte;
import co.edu.epi.tutornow.reports.model.Reporte;
import co.edu.epi.tutornow.reports.repository.ReporteRepository;
import co.edu.epi.tutornow.reports.service.ReportService;
import co.edu.epi.tutornow.tutorial.model.EstadoModeracion;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
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
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService")
class ReportServiceTest {

    @Mock
    private ReporteRepository reporteRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private SolicitudAsesoriaRepository solicitudRepository;
    @Mock
    private ResenaRepository resenaRepository;
    @InjectMocks
    private ReportService reportService;

    private final String CORREO = "reportador@elpoli.edu.co";
    private final String CORREO_ADMIN = "admin@elpoli.edu.co";

    private Usuario usuario(Long id, String correo) {
        return Usuario.builder().id(id)
                .correoElectronico(correo)
                .nombreCompleto("Usuario " + id).rol(Rol.ESTUDIANTE).activo(true).build();
    }

    private SolicitudAsesoria solicitud() {
        return SolicitudAsesoria.builder()
                .id(10L)
                .estudiante(usuario(2L, "estudiante@elpoli.edu.co"))
                .materia(Materia.builder().id(1L).nombre("Calculo").activa(true).build())
                .tema("Derivadas")
                .estado(EstadoSolicitud.PUBLICADA)
                .estadoModeracion(EstadoModeracion.VISIBLE)
                .build();
    }

    @Nested
    @DisplayName("crear reporte")
    class Crear {

        @Test
        @DisplayName("crea un reporte PENDIENTE contra una publicacion")
        void shouldCreatePendingReport() {
            Usuario reportador = usuario(1L, CORREO);
            when(usuarioRepository.findByCorreoElectronico(CORREO)).thenReturn(Optional.of(reportador));
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(solicitud()));
            when(reporteRepository.existsByReportadorIdAndTipoAndTargetIdAndEstado(
                    any(), any(), any(), any())).thenReturn(false);
            when(reporteRepository.save(any(Reporte.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ReportResponse result = reportService.create(CORREO, CreateReportRequest.builder()
                    .tipo("PUBLICACION").targetId(10L)
                    .motivo("Contenido inapropiado")
                    .descripcion("El tema no corresponde a la materia")
                    .build());

            assertThat(result.getEstado()).isEqualTo("PENDIENTE");
            assertThat(result.getTipo()).isEqualTo("PUBLICACION");
            assertThat(result.getTargetId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("falla con 409 si ya existe un reporte pendiente del mismo usuario")
        void shouldThrowWhenDuplicatePending() {
            when(usuarioRepository.findByCorreoElectronico(CORREO)).thenReturn(Optional.of(usuario(1L, CORREO)));
            when(solicitudRepository.findById(10L)).thenReturn(Optional.of(solicitud()));
            when(reporteRepository.existsByReportadorIdAndTipoAndTargetIdAndEstado(
                    any(), any(), any(), any())).thenReturn(true);

            assertThatThrownBy(() -> reportService.create(CORREO, CreateReportRequest.builder()
                    .tipo("PUBLICACION").targetId(10L).motivo("Contenido inapropiado").build()))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("falla con 409 si el usuario se reporta a si mismo")
        void shouldThrowWhenReportingSelf() {
            when(usuarioRepository.findByCorreoElectronico(CORREO)).thenReturn(Optional.of(usuario(1L, CORREO)));
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario(1L, CORREO)));

            assertThatThrownBy(() -> reportService.create(CORREO, CreateReportRequest.builder()
                    .tipo("USUARIO").targetId(1L).motivo("Contenido inapropiado").build()))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("falla con 404 si el target no existe")
        void shouldThrowWhenTargetMissing() {
            when(usuarioRepository.findByCorreoElectronico(CORREO)).thenReturn(Optional.of(usuario(1L, CORREO)));
            when(solicitudRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reportService.create(CORREO, CreateReportRequest.builder()
                    .tipo("PUBLICACION").targetId(10L).motivo("Contenido inapropiado").build()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("falla con tipo invalido")
        void shouldThrowWhenInvalidTipo() {
            when(usuarioRepository.findByCorreoElectronico(CORREO)).thenReturn(Optional.of(usuario(1L, CORREO)));

            assertThatThrownBy(() -> reportService.create(CORREO, CreateReportRequest.builder()
                    .tipo("CHAT").targetId(10L).motivo("Contenido inapropiado").build()))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("listar reportes")
    class Listar {

        @Test
        @DisplayName("lista sin filtros cuando no se envian estado ni tipo")
        void shouldListWithoutFilters() {
            when(reporteRepository.findFiltered(any(), any(), any()))
                    .thenReturn(new org.springframework.data.domain.PageImpl<Reporte>(
                            java.util.List.<Reporte>of(),
                            org.springframework.data.domain.PageRequest.of(0, 10),
                            0));

            var result = reportService.list(null, null, 0, 10);

            assertThat(result.getData()).isEmpty();
            assertThat(result.getPagination().getTotalElements()).isZero();
        }
    }

    @Nested
    @DisplayName("gestionar reportes")
    class Gestionar {

        private Reporte reporte() {
            return Reporte.builder()
                    .id(30L)
                    .reportador(usuario(1L, CORREO))
                    .tipo(co.edu.epi.tutornow.reports.model.TipoReporte.PUBLICACION)
                    .targetId(10L)
                    .motivo("Contenido inapropiado")
                    .estado(EstadoReporte.PENDIENTE)
                    .build();
        }

        @Test
        @DisplayName("resolve marca RESUELTO con resolucion y admin responsable")
        void shouldResolveReport() {
            Reporte target = reporte();
            when(reporteRepository.findById(30L)).thenReturn(Optional.of(target));
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN))
                    .thenReturn(Optional.of(usuario(9L, CORREO_ADMIN)));

            Reporte saved = reporte();
            saved.setResueltoPor(usuario(9L, CORREO_ADMIN));
            when(reporteRepository.save(any(Reporte.class))).thenReturn(saved);

            AdminReportResponse result = reportService.resolve(30L, ResolveReportRequest.builder()
                    .resolucion("Publicacion retirada porque incumple las condiciones").build(),
                    CORREO_ADMIN);

            ArgumentCaptor<Reporte> captor = ArgumentCaptor.forClass(Reporte.class);
            verify(reporteRepository).save(captor.capture());
            assertThat(captor.getValue().getEstado()).isEqualTo(EstadoReporte.RESUELTO);
            assertThat(captor.getValue().getResueltoPor().getId()).isEqualTo(9L);
            assertThat(result.getEstado()).isEqualTo("RESUELTO");
        }

        @Test
        @DisplayName("falla con 409 si el reporte ya fue gestionado")
        void shouldThrowWhenAlreadyClosed() {
            Reporte target = reporte();
            target.setEstado(EstadoReporte.RESUELTO);
            when(reporteRepository.findById(30L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> reportService.dismiss(30L, ResolveReportRequest.builder()
                    .resolucion("Sin violacion de condiciones").build(), CORREO_ADMIN))
                    .isInstanceOf(ConflictException.class);
        }
    }
}
