package co.edu.epi.tutornow.chat.event;

import co.edu.epi.tutornow.chat.dto.MensajeResponse;

public record MensajeEnviadoEvent(
        Long asesoriaId,
        Long estudianteId,
        Long tutorUsuarioId,
        MensajeResponse mensaje) {
}
