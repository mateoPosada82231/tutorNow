package co.edu.epi.tutornow.tutorial.port;

import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;

public record AsesoriaChatResumen(
        Long asesoriaId,
        Long estudianteId,
        String estudianteNombre,
        Long tutorUsuarioId,
        String tutorNombre,
        String materia,
        String tema,
        EstadoAsesoria estado) {
}
