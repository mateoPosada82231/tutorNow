package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatPort;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatResumen;
import co.edu.epi.tutornow.tutorial.port.ParticipanteAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AsesoriaChatAdapter implements AsesoriaChatPort {

    private final AsesoriaRepository asesoriaRepository;

    @Override
    @Transactional(readOnly = true)
    public ParticipanteAsesoria requireParticipante(Long asesoriaId, Long usuarioId) {
        Asesoria asesoria = asesoriaRepository.findByIdConParticipantes(asesoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoria no encontrada"));
        Long estudianteId = asesoria.getEstudiante().getId();
        Long tutorUsuarioId = asesoria.getTutor().getUsuario().getId();
        if (!estudianteId.equals(usuarioId) && !tutorUsuarioId.equals(usuarioId)) {
            throw new ForbiddenException("Solo las partes de la asesoria pueden acceder al chat");
        }
        return new ParticipanteAsesoria(
                asesoria.getId(),
                estudianteId,
                tutorUsuarioId,
                asesoria.getEstado());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AsesoriaChatResumen> listarPorUsuario(Long usuarioId) {
        return asesoriaRepository.findByParticipante(usuarioId).stream()
                .map(this::toResumen)
                .toList();
    }

    private AsesoriaChatResumen toResumen(Asesoria asesoria) {
        return new AsesoriaChatResumen(
                asesoria.getId(),
                asesoria.getEstudiante().getId(),
                asesoria.getEstudiante().getNombreCompleto(),
                asesoria.getTutor().getUsuario().getId(),
                asesoria.getTutor().getUsuario().getNombreCompleto(),
                asesoria.getSolicitud().getMateria().getNombre(),
                asesoria.getSolicitud().getTema(),
                asesoria.getEstado());
    }
}
