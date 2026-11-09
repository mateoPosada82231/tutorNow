package co.edu.epi.tutornow.admin.service;

import co.edu.epi.tutornow.admin.dto.AdminUserResponse;
import co.edu.epi.tutornow.admin.dto.AdminUserResponse.RatingSummaryResponse;
import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final int MAX_PAGE_SIZE = 50;

    private final UsuarioRepository usuarioRepository;
    private final TutorRepository tutorRepository;
    private final ResenaRepository resenaRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> list(
            String rol, Boolean activo, String q, int page, int size) {
        Rol rolFiltro = parseRol(rol);
        String texto = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase() + "%";
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Usuario> resultado = usuarioRepository.findAdminFiltered(rolFiltro, activo, texto, pageable);

        Map<Long, Object[]> resumenes = resumenesDeTutores(resultado.getContent());
        Set<Long> usuariosConPerfilTutor = usuariosConPerfilDeTutor(resultado.getContent());
        List<AdminUserResponse> data = resultado.getContent().stream()
                .map(u -> toResponse(u, resumenes.get(u.getId()), usuariosConPerfilTutor.contains(u.getId())))
                .toList();

        return PageResponse.<AdminUserResponse>builder()
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
    public AdminUserResponse revokeTutor(String correoAdmin, Long usuarioId) {
        Usuario usuario = targetDistinctFrom(correoAdmin, usuarioId);
        if (usuario.getRol() != Rol.TUTOR) {
            throw new ConflictException("El usuario no es tutor");
        }
        usuario.setRol(Rol.ESTUDIANTE);
        return toResponse(usuarioRepository.save(usuario), null, tienePerfilDeTutor(usuarioId));
    }

    @Transactional
    public AdminUserResponse restoreTutor(String correoAdmin, Long usuarioId) {
        Usuario usuario = targetDistinctFrom(correoAdmin, usuarioId);
        if (usuario.getRol() == Rol.ADMIN) {
            throw new ConflictException("El usuario es administrador");
        }
        if (usuario.getRol() == Rol.TUTOR) {
            throw new ConflictException("El usuario ya es tutor");
        }
        if (!tutorRepository.findByUsuario_Id(usuarioId).isPresent()) {
            throw new ConflictException(
                    "El usuario no tiene un perfil de tutor previo, no se puede restaurar");
        }
        usuario.setRol(Rol.TUTOR);
        return toResponse(usuarioRepository.save(usuario), null, true);
    }

    @Transactional
    public AdminUserResponse deactivate(String correoAdmin, Long usuarioId) {
        Usuario usuario = targetDistinctFrom(correoAdmin, usuarioId);
        usuario.setActivo(false);
        return toResponse(usuarioRepository.save(usuario), null, tienePerfilDeTutor(usuarioId));
    }

    @Transactional
    public AdminUserResponse activate(String correoAdmin, Long usuarioId) {
        Usuario usuario = targetDistinctFrom(correoAdmin, usuarioId);
        usuario.setActivo(true);
        return toResponse(usuarioRepository.save(usuario), null, tienePerfilDeTutor(usuarioId));
    }

    @Transactional
    public AdminUserResponse promoteAdmin(String correoAdmin, Long usuarioId) {
        Usuario usuario = targetDistinctFrom(correoAdmin, usuarioId);
        usuario.setRol(Rol.ADMIN);
        return toResponse(usuarioRepository.save(usuario), null, tienePerfilDeTutor(usuarioId));
    }

    private Usuario targetDistinctFrom(String correoAdmin, Long usuarioId) {
        Usuario admin = usuarioRepository.findByCorreoElectronico(correoAdmin.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        if (admin.getId().equals(usuarioId)) {
            throw new ConflictException("No puedes modificar tu propia cuenta");
        }
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Map<Long, Object[]> resumenesDeTutores(List<Usuario> usuarios) {
        List<Long> tutorIds = usuarios.stream()
                .filter(u -> u.getRol() == Rol.TUTOR)
                .map(Usuario::getId)
                .toList();
        if (tutorIds.isEmpty()) {
            return Map.of();
        }
        return resenaRepository
                .findResumenPorTutorIds(
                        tutorIds,
                        RolAutorResena.ESTUDIANTE,
                        List.of(EstadoAsesoria.FINALIZADA, EstadoAsesoria.EVALUADA))
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0], row -> new Object[] {row[1], row[2]}));
    }

    private Set<Long> usuariosConPerfilDeTutor(List<Usuario> usuarios) {
        List<Long> usuarioIds = usuarios.stream().map(Usuario::getId).toList();
        if (usuarioIds.isEmpty()) {
            return Set.of();
        }
        return tutorRepository.findByUsuario_IdIn(usuarioIds).stream()
                .map(t -> t.getUsuario().getId())
                .collect(Collectors.toSet());
    }

    private boolean tienePerfilDeTutor(Long usuarioId) {
        return tutorRepository.findByUsuario_Id(usuarioId).isPresent();
    }

    private AdminUserResponse toResponse(Usuario usuario, Object[] resumen, boolean hasTutorProfile) {
        RatingSummaryResponse stats = null;
        if (resumen != null) {
            Double promedio = resumen[0] == null ? null : redondear(((Number) resumen[0]).doubleValue());
            stats = RatingSummaryResponse.builder()
                    .averageRating(promedio)
                    .reviewCount(((Number) resumen[1]).longValue())
                    .build();
        }
        return AdminUserResponse.builder()
                .id(usuario.getId())
                .email(usuario.getCorreoElectronico())
                .fullName(usuario.getNombreCompleto())
                .role(usuario.getRol().name())
                .active(usuario.isActivo())
                .verified(usuario.isVerificado())
                .hasTutorProfile(hasTutorProfile)
                .createdAt(usuario.getCreatedAt())
                .tutorReviews(stats)
                .build();
    }

    private Double redondear(double valor) {
        return BigDecimal.valueOf(valor).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private Rol parseRol(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Rol.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Rol no valido: " + valor);
        }
    }
}
