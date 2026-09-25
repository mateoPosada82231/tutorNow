package co.edu.epi.tutornow.users.service;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import co.edu.epi.tutornow.catalog.model.Carrera;
import co.edu.epi.tutornow.catalog.model.Semestre;
import co.edu.epi.tutornow.catalog.repository.CarreraRepository;
import co.edu.epi.tutornow.catalog.repository.SemestreRepository;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.users.dto.UpdateProfileRequest;
import co.edu.epi.tutornow.users.dto.UserResponse;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final SemestreRepository semestreRepository;

    @Transactional(readOnly = true)
    public UserResponse getProfile(String correo) {
        Usuario usuario = findByCorreoOrThrow(correo);
        return toResponse(usuario);
    }

    @Transactional
    public UserResponse updateProfile(String correo, UpdateProfileRequest request) {
        Usuario usuario = findByCorreoOrThrow(correo);

        Carrera carrera = carreraRepository.findById(request.getCarreraId())
                .orElseThrow(() -> new ConflictException("Carrera no valida"));
        Semestre semestre = semestreRepository.findById(request.getSemestreId())
                .orElseThrow(() -> new ConflictException("Semestre no valido"));

        usuario.setNombreCompleto(request.getFullName());
        usuario.setCarrera(carrera);
        usuario.setSemestreRef(semestre);
        usuarioRepository.save(usuario);

        return toResponse(usuario);
    }

    private Usuario findByCorreoOrThrow(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private UserResponse toResponse(Usuario usuario) {
        return UserResponse.builder()
                .id(usuario.getId())
                .email(usuario.getCorreoElectronico())
                .fullName(usuario.getNombreCompleto())
                .role(usuario.getRol().name())
                .carrera(toCarreraItem(usuario.getCarrera()))
                .semestre(toSemestreItem(usuario.getSemestreRef()))
                .isTutor(usuario.getRol() == Rol.TUTOR)
                .build();
    }

    private CatalogItemResponse toCarreraItem(Carrera carrera) {
        if (carrera == null) {
            return null;
        }
        return CatalogItemResponse.builder()
                .id(carrera.getId())
                .label(carrera.getNombre())
                .build();
    }

    private CatalogItemResponse toSemestreItem(Semestre semestre) {
        if (semestre == null) {
            return null;
        }
        return CatalogItemResponse.builder()
                .id(semestre.getId())
                .label("Semestre " + semestre.getNumero())
                .build();
    }
}
