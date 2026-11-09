package co.edu.epi.tutornow.reports.service;

import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.reports.dto.AdminReportDetailResponse;
import co.edu.epi.tutornow.reports.dto.AdminReportDetailResponse.ActorResponse;
import co.edu.epi.tutornow.reports.dto.AdminReportDetailResponse.AdminReportTargetResponse;
import co.edu.epi.tutornow.reports.dto.AdminReportDetailResponse.CatalogItemResponse;
import co.edu.epi.tutornow.reports.dto.AdminReportResponse;
import co.edu.epi.tutornow.reports.dto.CreateReportRequest;
import co.edu.epi.tutornow.reports.dto.ReportResponse;
import co.edu.epi.tutornow.reports.dto.ResolveReportRequest;
import co.edu.epi.tutornow.reports.model.EstadoReporte;
import co.edu.epi.tutornow.reports.model.Reporte;
import co.edu.epi.tutornow.reports.model.TipoReporte;
import co.edu.epi.tutornow.reports.repository.ReporteRepository;
import co.edu.epi.tutornow.tutorial.model.EstadoModeracion;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ReporteRepository reporteRepository;
    private final UsuarioRepository usuarioRepository;
    private final SolicitudAsesoriaRepository solicitudRepository;
    private final ResenaRepository resenaRepository;

    @Transactional
    public ReportResponse create(String correo, CreateReportRequest request) {
        Usuario reportador = findUsuario(correo);
        TipoReporte tipo = parseTipo(request.getTipo());
        Long targetId = request.getTargetId();
        validarTarget(reportador, tipo, targetId);

        String motivo = request.getMotivo() == null ? "" : request.getMotivo().trim();
        if (motivo.isEmpty()) {
            throw new IllegalArgumentException("El motivo es obligatorio");
        }
        String descripcion = request.getDescripcion() == null || request.getDescripcion().isBlank()
                ? null
                : request.getDescripcion().trim();

        Reporte reporte = Reporte.builder()
                .reportador(reportador)
                .tipo(tipo)
                .targetId(targetId)
                .motivo(motivo)
                .descripcion(descripcion)
                .estado(EstadoReporte.PENDIENTE)
                .build();
        reporte = reporteRepository.save(reporte);

        return toResponse(reporte);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReportResponse> list(String estado, String tipo, int page, int size) {
        EstadoReporte estadoFiltro = parseEstado(estado);
        TipoReporte tipoFiltro = parseTipoFiltro(tipo);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Reporte> resultado = reporteRepository.findFiltered(estadoFiltro, tipoFiltro, pageable);

        return PageResponse.<AdminReportResponse>builder()
                .data(resultado.getContent().stream().map(this::toAdminResponse).toList())
                .pagination(info(resultado))
                .build();
    }

    @Transactional(readOnly = true)
    public AdminReportDetailResponse getById(Long id) {
        Reporte reporte = findReporte(id);
        return toDetailResponse(reporte);
    }

    @Transactional
    public AdminReportResponse resolve(Long id, ResolveReportRequest request, String correoAdmin) {
        return cerrar(id, request, EstadoReporte.RESUELTO, correoAdmin);
    }

    @Transactional
    public AdminReportResponse dismiss(Long id, ResolveReportRequest request, String correoAdmin) {
        return cerrar(id, request, EstadoReporte.DESCARTADO, correoAdmin);
    }

    private AdminReportResponse cerrar(
            Long id, ResolveReportRequest request, EstadoReporte nuevoEstado, String correoAdmin) {
        Reporte reporte = findReporte(id);
        if (reporte.getEstado() != EstadoReporte.PENDIENTE) {
            throw new ConflictException("El reporte ya fue gestionado");
        }
        Usuario admin = findUsuario(correoAdmin);
        reporte.setEstado(nuevoEstado);
        reporte.setResolucion(request.getResolucion().trim());
        reporte.setResueltoPor(admin);
        reporte.setResueltoAt(OffsetDateTime.now());
        reporteRepository.save(reporte);
        return toAdminResponse(reporte);
    }

    private void validarTarget(Usuario reportador, TipoReporte tipo, Long targetId) {
        switch (tipo) {
            case PUBLICACION -> {
                SolicitudAsesoria solicitud = solicitudRepository.findById(targetId)
                        .orElseThrow(() -> new ResourceNotFoundException("La publicacion no existe"));
                if (solicitud.getEstadoModeracion() == EstadoModeracion.RETIRADA) {
                    throw new ConflictException("La publicacion fue retirada por moderacion");
                }
            }
            case RESENA -> {
                Resena resena = resenaRepository.findById(targetId)
                        .orElseThrow(() -> new ResourceNotFoundException("La resena no existe"));
                if (resena.getEstadoModeracion() == EstadoModeracion.RETIRADA) {
                    throw new ConflictException("La resena fue retirada por moderacion");
                }
            }
            case USUARIO -> {
                Usuario targetUsuario = usuarioRepository.findById(targetId)
                        .orElseThrow(() -> new ResourceNotFoundException("El usuario no existe"));
                if (targetUsuario.getId().equals(reportador.getId())) {
                    throw new ConflictException("No puedes reportarte a ti mismo");
                }
            }
        }
        if (reporteRepository.existsByReportadorIdAndTipoAndTargetIdAndEstado(
                reportador.getId(), tipo, targetId, EstadoReporte.PENDIENTE)) {
            throw new ConflictException("Ya reportaste este contenido y esta pendiente de revision");
        }
    }

    private ReportResponse toResponse(Reporte reporte) {
        return ReportResponse.builder()
                .id(reporte.getId())
                .tipo(reporte.getTipo().name())
                .targetId(reporte.getTargetId())
                .motivo(reporte.getMotivo())
                .descripcion(reporte.getDescripcion())
                .estado(reporte.getEstado().name())
                .createdAt(reporte.getCreatedAt())
                .build();
    }

    private AdminReportResponse.ReportadorResponse reportadorResponse(Reporte reporte) {
        Usuario reportador = reporte.getReportador();
        return AdminReportResponse.ReportadorResponse.builder()
                .id(reportador.getId())
                .fullName(reportador.getNombreCompleto())
                .email(reportador.getCorreoElectronico())
                .build();
    }

    private AdminReportResponse toAdminResponse(Reporte reporte) {
        return AdminReportResponse.builder()
                .id(reporte.getId())
                .tipo(reporte.getTipo().name())
                .targetId(reporte.getTargetId())
                .motivo(reporte.getMotivo())
                .descripcion(reporte.getDescripcion())
                .estado(reporte.getEstado().name())
                .reportador(reporte.getReportador() == null ? null : reportadorResponse(reporte))
                .resolucion(reporte.getResolucion())
                .resueltoAt(reporte.getResueltoAt())
                .resueltoPor(reporte.getResueltoPor() == null ? null : resueltoPorResponse(reporte))
                .createdAt(reporte.getCreatedAt())
                .build();
    }

    private AdminReportResponse.ReportadorResponse resueltoPorResponse(Reporte reporte) {
        Usuario resueltoPor = reporte.getResueltoPor();
        return AdminReportResponse.ReportadorResponse.builder()
                .id(resueltoPor.getId())
                .fullName(resueltoPor.getNombreCompleto())
                .email(resueltoPor.getCorreoElectronico())
                .build();
    }

    private PageResponse.PaginationInfo info(Page<Reporte> resultado) {
        return PageResponse.PaginationInfo.builder()
                .page(resultado.getNumber())
                .size(resultado.getSize())
                .totalElements(resultado.getTotalElements())
                .totalPages(resultado.getTotalPages())
                .build();
    }

    private AdminReportDetailResponse toDetailResponse(Reporte reporte) {
        return AdminReportDetailResponse.builder()
                .id(reporte.getId())
                .tipo(reporte.getTipo().name())
                .targetId(reporte.getTargetId())
                .motivo(reporte.getMotivo())
                .descripcion(reporte.getDescripcion())
                .estado(reporte.getEstado().name())
                .reportador(reporte.getReportador() == null ? null : reportadorResponse(reporte))
                .resolucion(reporte.getResolucion())
                .resueltoAt(reporte.getResueltoAt())
                .resueltoPor(reporte.getResueltoPor() == null ? null : resueltoPorResponse(reporte))
                .createdAt(reporte.getCreatedAt())
                .target(resolverTarget(reporte))
                .build();
    }

    private AdminReportTargetResponse resolverTarget(Reporte reporte) {
        return switch (reporte.getTipo()) {
            case PUBLICACION -> targetPublicacion(reporte);
            case RESENA -> targetResena(reporte);
            case USUARIO -> targetUsuario(reporte);
        };
    }

    private AdminReportTargetResponse targetPublicacion(Reporte reporte) {
        return solicitudRepository.findById(reporte.getTargetId())
                .<AdminReportTargetResponse>map(solicitud -> AdminReportTargetResponse.builder()
                        .tema(solicitud.getTema())
                        .descripcion(solicitud.getDescripcion())
                        .estado(solicitud.getEstado().name())
                        .estadoModeracion(solicitud.getEstadoModeracion().name())
                        .materia(CatalogItemResponse.builder()
                                .id(solicitud.getMateria().getId())
                                .label(solicitud.getMateria().getNombre())
                                .build())
                        .estudiante(actor(solicitud.getEstudiante()))
                        .build())
                .orElse(null);
    }

    private AdminReportTargetResponse targetResena(Reporte reporte) {
        return resenaRepository.findById(reporte.getTargetId())
                .<AdminReportTargetResponse>map(resena -> AdminReportTargetResponse.builder()
                        .rating(resena.getRating())
                        .comentario(resena.getComentario())
                        .rolAutor(resena.getRolAutor().name())
                        .estadoModeracion(resena.getEstadoModeracion().name())
                        .autor(actor(resena.getAutor()))
                        .build())
                .orElse(null);
    }

    private AdminReportTargetResponse targetUsuario(Reporte reporte) {
        return usuarioRepository.findById(reporte.getTargetId())
                .<AdminReportTargetResponse>map(usuario -> AdminReportTargetResponse.builder()
                        .rol(usuario.getRol().name())
                        .activo(usuario.isActivo())
                        .autor(actor(usuario))
                        .build())
                .orElse(null);
    }

    private ActorResponse actor(Usuario usuario) {
        return ActorResponse.builder()
                .id(usuario.getId())
                .fullName(usuario.getNombreCompleto())
                .email(usuario.getCorreoElectronico())
                .build();
    }

    private Usuario findUsuario(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Reporte findReporte(Long id) {
        return reporteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reporte no encontrado"));
    }

    private TipoReporte parseTipo(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El tipo de reporte es obligatorio");
        }
        try {
            return TipoReporte.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo de reporte no valido: " + valor);
        }
    }

    private TipoReporte parseTipoFiltro(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return TipoReporte.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo de reporte no valido: " + valor);
        }
    }

    private EstadoReporte parseEstado(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return EstadoReporte.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de reporte no valido: " + valor);
        }
    }
}
