package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AsesoriaService {

    private final AsesoriaRepository asesoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TutorialMapper mapper;

    @Transactional
    public AsesoriaResponse confirmarFinalizacion(String correo, Long asesoriaId) {
        Usuario usuario = usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        Asesoria asesoria = asesoriaRepository.findById(asesoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoria no encontrada"));
        boolean esEstudiante = asesoria.getEstudiante().getId().equals(usuario.getId());
        boolean esTutor = asesoria.getTutor().getUsuario().getId().equals(usuario.getId());
        if (!esEstudiante && !esTutor) {
            throw new ForbiddenException("Solo las partes de la asesoria pueden confirmar su finalizacion");
        }
        if (asesoria.getEstado() == EstadoAsesoria.CANCELADA) {
            throw new ConflictException("La asesoria fue cancelada");
        }
        if (asesoria.getEstado() != EstadoAsesoria.PENDIENTE) {
            throw new ConflictException("La asesoria ya fue finalizada");
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (esEstudiante && asesoria.getConfirmacionEstudianteAt() == null) {
            asesoria.setConfirmacionEstudianteAt(now);
        }
        if (esTutor && asesoria.getConfirmacionTutorAt() == null) {
            asesoria.setConfirmacionTutorAt(now);
        }
        if (asesoria.getConfirmacionEstudianteAt() != null && asesoria.getConfirmacionTutorAt() != null) {
            asesoria.setEstado(EstadoAsesoria.FINALIZADA);
            asesoria.setFinalizadaAt(now);
        }
        asesoriaRepository.save(asesoria);
        return mapper.toAsesoriaResponse(asesoria);
    }
}
