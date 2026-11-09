package co.edu.epi.tutornow.admin.service;

import co.edu.epi.tutornow.admin.dto.AdminPublicationResponse;
import co.edu.epi.tutornow.admin.dto.AdminReviewResponse;
import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.model.EstadoModeracion;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.users.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminModerationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SolicitudAsesoriaRepository solicitudRepository;
    private final ResenaRepository resenaRepository;
    private final PropuestaRepository propuestaRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminPublicationResponse> listPublications(
            String estado, String moderacion, String q, int page, int size) {
        EstadoSolicitud estadoFiltro = parseEstadoSolicitud(estado);
        EstadoModeracion moderacionFiltro = parseModeracion(moderacion);
        String texto = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase() + "%";
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<SolicitudAsesoria> resultado = solicitudRepository.findAdminFiltered(
                estadoFiltro, moderacionFiltro, texto, pageable);

        List<AdminPublicationResponse> data = resultado.getContent().stream()
                .map(this::toPublicationResponse)
                .toList();

        return PageResponse.<AdminPublicationResponse>builder()
                .data(data)
                .pagination(PageResponse.PaginationInfo.builder()
                        .page(resultado.getNumber())
                        .size(resultado.getSize())
                        .totalElements(resultado.getTotalElements())
                        .totalPages(resultado.getTotalPages())
                        .build())
                .build();
    }

    @Transactional
    public AdminPublicationResponse withdrawPublication(Long id) {
        SolicitudAsesoria solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publicacion no encontrada"));
        if (solicitud.getEstadoModeracion() == EstadoModeracion.RETIRADA) {
            throw new ConflictException("La publicacion ya esta retirada");
        }
        if (solicitud.getEstado() != EstadoSolicitud.PUBLICADA) {
            throw new ConflictException(
                    "Solo se pueden retirar publicaciones abiertas; cancela la asesoria activa primero");
        }

        List<Propuesta> pendientes = propuestaRepository.findBySolicitudIdAndEstadoOrderByCreatedAtAsc(
                id, EstadoPropuesta.PENDIENTE);
        pendientes.forEach(p -> p.setEstado(EstadoPropuesta.RECHAZADA));
        propuestaRepository.saveAll(pendientes);

        solicitud.setEstadoModeracion(EstadoModeracion.RETIRADA);
        return toPublicationResponse(solicitudRepository.save(solicitud));
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReviewResponse> listReviews(
            String moderacion, String q, int page, int size) {
        EstadoModeracion moderacionFiltro = parseModeracion(moderacion);
        String texto = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase() + "%";
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Resena> resultado = resenaRepository.findAdminFiltered(moderacionFiltro, texto, pageable);

        List<AdminReviewResponse> data = resultado.getContent().stream()
                .map(this::toReviewResponse)
                .toList();

        return PageResponse.<AdminReviewResponse>builder()
                .data(data)
                .pagination(PageResponse.PaginationInfo.builder()
                        .page(resultado.getNumber())
                        .size(resultado.getSize())
                        .totalElements(resultado.getTotalElements())
                        .totalPages(resultado.getTotalPages())
                        .build())
                .build();
    }

    @Transactional
    public AdminReviewResponse withdrawReview(Long id) {
        Resena resena = resenaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resena no encontrada"));
        if (resena.getEstadoModeracion() == EstadoModeracion.RETIRADA) {
            throw new ConflictException("La resena ya esta retirada");
        }
        resena.setEstadoModeracion(EstadoModeracion.RETIRADA);
        return toReviewResponse(resenaRepository.save(resena));
    }

    private AdminPublicationResponse toPublicationResponse(SolicitudAsesoria solicitud) {
        return AdminPublicationResponse.builder()
                .id(solicitud.getId())
                .tema(solicitud.getTema())
                .descripcion(solicitud.getDescripcion())
                .estado(solicitud.getEstado().name())
                .estadoModeracion(solicitud.getEstadoModeracion().name())
                .createdAt(solicitud.getCreatedAt())
                .materia(AdminPublicationResponse.CatalogItemResponse.builder()
                        .id(solicitud.getMateria().getId())
                        .label(solicitud.getMateria().getNombre())
                        .build())
                .estudiante(publicationActor(solicitud.getEstudiante()))
                .build();
    }

    private AdminReviewResponse toReviewResponse(Resena resena) {
        return AdminReviewResponse.builder()
                .id(resena.getId())
                .asesoriaId(resena.getAsesoria().getId())
                .rolAutor(resena.getRolAutor().name())
                .rating(resena.getRating())
                .comentario(resena.getComentario())
                .estadoModeracion(resena.getEstadoModeracion().name())
                .createdAt(resena.getCreatedAt())
                .autor(reviewActor(resena.getAutor()))
                .build();
    }

    private AdminPublicationResponse.ActorResponse publicationActor(Usuario usuario) {
        return AdminPublicationResponse.ActorResponse.builder()
                .id(usuario.getId())
                .fullName(usuario.getNombreCompleto())
                .email(usuario.getCorreoElectronico())
                .build();
    }

    private AdminReviewResponse.ActorResponse reviewActor(Usuario usuario) {
        return AdminReviewResponse.ActorResponse.builder()
                .id(usuario.getId())
                .fullName(usuario.getNombreCompleto())
                .email(usuario.getCorreoElectronico())
                .build();
    }

    private EstadoSolicitud parseEstadoSolicitud(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return EstadoSolicitud.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de solicitud no valido: " + valor);
        }
    }

    private EstadoModeracion parseModeracion(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return EstadoModeracion.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de moderacion no valido: " + valor);
        }
    }
}
