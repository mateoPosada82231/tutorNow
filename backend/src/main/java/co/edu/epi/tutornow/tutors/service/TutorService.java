package co.edu.epi.tutornow.tutors.service;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutors.dto.TutorProfileRequest;
import co.edu.epi.tutornow.tutors.dto.TutorResponse;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TutorService {

    private final TutorRepository tutorRepository;
    private final UsuarioRepository usuarioRepository;
    private final MateriaRepository materiaRepository;

    @Transactional
    public TutorResponse becomeTutor(String correo, TutorProfileRequest request) {
        String correoNormalizado = correo.toLowerCase().trim();

        if (tutorRepository.existsByUsuario_CorreoElectronico(correoNormalizado)) {
            throw new ConflictException("Ya tienes un perfil de tutor");
        }

        Usuario usuario = usuarioRepository.findByCorreoElectronico(correoNormalizado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Set<Materia> materias = resolveMaterias(request.getMateriaIds());

        Tutor tutor = Tutor.builder()
                .usuario(usuario)
                .biografia(request.getBiografia())
                .materias(materias)
                .build();

        usuario.setRol(Rol.TUTOR);
        usuarioRepository.save(usuario);
        tutorRepository.save(tutor);

        return toResponse(tutor);
    }

    @Transactional(readOnly = true)
    public TutorResponse getMyTutorProfile(String correo) {
        return toResponse(findTutorOrThrow(correo));
    }

    @Transactional
    public TutorResponse updateMyTutorProfile(String correo, TutorProfileRequest request) {
        Tutor tutor = findTutorOrThrow(correo);

        Set<Materia> materias = resolveMaterias(request.getMateriaIds());

        tutor.setBiografia(request.getBiografia());
        tutor.setMaterias(materias);
        tutorRepository.save(tutor);

        return toResponse(tutor);
    }

    private Tutor findTutorOrThrow(String correo) {
        return tutorRepository.findByUsuario_CorreoElectronico(correo.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("No tienes un perfil de tutor"));
    }

    private Set<Materia> resolveMaterias(List<Long> materiaIds) {
        Set<Materia> materias = new LinkedHashSet<>(materiaRepository.findAllById(
                materiaIds.stream().distinct().toList()));

        boolean invalidas = materias.size() != materiaIds.stream().distinct().count()
                || materias.stream().anyMatch(m -> !m.isActiva());
        if (invalidas) {
            throw new ConflictException("Una o mas materias no existen o no estan activas");
        }

        return materias;
    }

    private TutorResponse toResponse(Tutor tutor) {
        List<CatalogItemResponse> materias = tutor.getMaterias().stream()
                .map(m -> CatalogItemResponse.builder()
                        .id(m.getId())
                        .label(m.getNombre())
                        .build())
                .toList();

        return TutorResponse.builder()
                .id(tutor.getId())
                .biografia(tutor.getBiografia())
                .materias(materias)
                .createdAt(tutor.getCreatedAt())
                .build();
    }
}
