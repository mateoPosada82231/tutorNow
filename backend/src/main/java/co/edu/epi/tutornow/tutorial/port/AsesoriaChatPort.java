package co.edu.epi.tutornow.tutorial.port;

import java.util.List;

public interface AsesoriaChatPort {

    /**
     * Resolves the Asesoria a user is allowed to chat about.
     * Throws ResourceNotFoundException when it does not exist and ForbiddenException
     * when the user is not one of its two parties.
     */
    ParticipanteAsesoria requireParticipante(Long asesoriaId, Long usuarioId);

    List<AsesoriaChatResumen> listarPorUsuario(Long usuarioId);
}
