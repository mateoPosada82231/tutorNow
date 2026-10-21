package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.tutorial.dto.CreateTutoringRequest;
import co.edu.epi.tutornow.tutorial.dto.ProposalResponse;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SolicitudService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SolicitudAsesoriaRepository solicitudRepository;
    private final PropuestaRepository propuestaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TutorRepository tutorRepository;
    private final MateriaRepository materiaRepository;
    private final TutorialMapper mapper;

    @Transactional
    public TutoringRequestResponse create(String correo, CreateTutoringRequest request) {
        Usuario usuario = findUsuario(correo);
        if (usuario.getRol() == Rol.ADMIN) {
            throw new ForbiddenException("Los administradores no pueden publicar asesorias");
        }
        Materia materia = materiaRepository.findById(request.getMateriaId())
                .filter(Materia::isActiva)
                .orElseThrow(() -> new ConflictException("La materia no existe o no esta activa"));
        String descripcion = request.getDescripcion() == null || request.getDescripcion().isBlank()
                ? null
                : request.getDescripcion().trim();
        SolicitudAsesoria solicitud = SolicitudAsesoria.builder()
                .estudiante(usuario)
                .materia(materia)
                .tema(request.getTema().trim())
                .modalidad(Modalidad.valueOf(request.getModalidad()))
                .disponibilidad(request.getDisponibilidad().trim())
                .descripcion(descripcion)
                .estado(EstadoSolicitud.PUBLICADA)
                .build();
        solicitud = solicitudRepository.save(solicitud);
        return mapper.toSolicitudResponse(usuario, solicitud, 0L, List.of(), null, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<TutoringRequestResponse> list(
            String correo,
            Long materiaId,
            String modalidad,
            String estado,
            int page,
            int size) {
        Usuario usuario = findUsuario(correo);
        Modalidad modalidadFiltro = parseModalidad(modalidad);
        EstadoSolicitud estadoFiltro = parseEstado(estado);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));

        Set<Long> materiasTutor = Set.of();
        Page<SolicitudAsesoria> resultado;
        if (usuario.getRol() == Rol.TUTOR) {
            materiasTutor = tutorRepository.findByUsuario_CorreoElectronico(correo)
                    .map(t -> t.getMaterias().stream().map(Materia::getId).collect(Collectors.toSet()))
                    .orElse(Set.of());
            resultado = materiasTutor.isEmpty()
                    ? solicitudRepository.findFiltered(null, materiaId, modalidadFiltro, estadoFiltro, pageable)
                    : solicitudRepository.findFilteredPrioritized(materiaId, modalidadFiltro, estadoFiltro,
                            List.copyOf(materiasTutor), pageable);
        } else {
            resultado = solicitudRepository.findFiltered(usuario.getId(), materiaId, modalidadFiltro, estadoFiltro,
                    pageable);
        }
        final Set<Long> materiasTutorFinal = materiasTutor;

        List<Long> ids = resultado.getContent().stream().map(SolicitudAsesoria::getId).toList();
        Map<Long, Long> conteos = ids.isEmpty()
                ? Map.of()
                : propuestaRepository.countGroupedBySolicitudId(ids).stream()
                        .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        List<TutoringRequestResponse> data = resultado.getContent().stream()
                .map(s -> mapper.toSolicitudResponse(
                        usuario,
                        s,
                        conteos.getOrDefault(s.getId(), 0L),
                        List.of(),
                        usuario.getRol() == Rol.TUTOR ? materiasTutorFinal.contains(s.getMateria().getId()) : null,
                        null))
                .toList();

        return PageResponse.<TutoringRequestResponse>builder()
                .data(data)
                .pagination(PageResponse.PaginationInfo.builder()
                        .page(resultado.getNumber())
                        .size(resultado.getSize())
                        .totalElements(resultado.getTotalElements())
                        .totalPages(resultado.getTotalPages())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public TutoringRequestResponse getById(String correo, Long id) {
        Usuario usuario = findUsuario(correo);
        SolicitudAsesoria solicitud = findSolicitud(id);
        checkAccess(usuario, solicitud);
        List<ProposalResponse> propuestas = loadPropuestas(usuario, solicitud);
        return mapper.toSolicitudResponse(usuario, solicitud, propuestas.size(), propuestas,
                profileMatch(usuario, solicitud), null);
    }

    @Transactional(readOnly = true)
    public List<ProposalResponse> listProposals(String correo, Long solicitudId) {
        Usuario usuario = findUsuario(correo);
        SolicitudAsesoria solicitud = findSolicitud(solicitudId);
        checkAccess(usuario, solicitud);
        return loadPropuestas(usuario, solicitud);
    }

    @Transactional
    public TutoringRequestResponse cancel(String correo, Long id) {
        Usuario usuario = findUsuario(correo);
        SolicitudAsesoria solicitud = findSolicitud(id);
        if (!solicitud.getEstudiante().getId().equals(usuario.getId())) {
            throw new ForbiddenException("Solo el estudiante que publico la asesoria puede cancelarla");
        }
        if (solicitud.getEstado() == EstadoSolicitud.CONFIRMADA) {
            throw new ConflictException("La asesoria ya fue confirmada y no se puede cancelar");
        }
        if (solicitud.getEstado() == EstadoSolicitud.CANCELADA) {
            throw new ConflictException("La asesoria ya fue cancelada");
        }
        solicitud.setEstado(EstadoSolicitud.CANCELADA);
        solicitudRepository.save(solicitud);
        List<Propuesta> pendientes = propuestaRepository.findBySolicitudIdAndEstadoOrderByCreatedAtAsc(
                solicitud.getId(), EstadoPropuesta.PENDIENTE);
        pendientes.forEach(p -> p.setEstado(EstadoPropuesta.RECHAZADA));
        propuestaRepository.saveAll(pendientes);

        List<ProposalResponse> propuestas = loadPropuestas(usuario, solicitud);
        return mapper.toSolicitudResponse(usuario, solicitud, propuestas.size(), propuestas, null, null);
    }

    private List<ProposalResponse> loadPropuestas(Usuario viewer, SolicitudAsesoria solicitud) {
        Long tutorIdViewer = viewer.getRol() == Rol.TUTOR
                ? tutorRepository.findByUsuario_CorreoElectronico(viewer.getCorreoElectronico())
                        .map(Tutor::getId)
                        .orElse(null)
                : null;
        return propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(solicitud.getId()).stream()
                .map(p -> mapper.toProposalResponse(p, p.getTutor().getId().equals(tutorIdViewer)))
                .toList();
    }

    private Boolean profileMatch(Usuario viewer, SolicitudAsesoria solicitud) {
        if (viewer.getRol() != Rol.TUTOR) {
            return null;
        }
        return tutorRepository.findByUsuario_CorreoElectronico(viewer.getCorreoElectronico())
                .map(t -> t.getMaterias().stream().anyMatch(m -> m.getId().equals(solicitud.getMateria().getId())))
                .orElse(false);
    }

    private void checkAccess(Usuario usuario, SolicitudAsesoria solicitud) {
        boolean owner = solicitud.getEstudiante().getId().equals(usuario.getId());
        if (!owner && usuario.getRol() != Rol.TUTOR) {
            throw new ForbiddenException("No tienes acceso a esta asesoria");
        }
    }

    private Usuario findUsuario(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private SolicitudAsesoria findSolicitud(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoria no encontrada"));
    }

    private Modalidad parseModalidad(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Modalidad.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Modalidad no valida: " + valor);
        }
    }

    private EstadoSolicitud parseEstado(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return EstadoSolicitud.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado no valido: " + valor);
        }
    }
}
