package co.edu.epi.tutornow.tutorial.port;

import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;

public record ParticipanteAsesoria(
        Long asesoriaId,
        Long estudianteId,
        Long tutorUsuarioId,
        EstadoAsesoria estado) {

    public boolean participa(Long usuarioId) {
        return esEstudiante(usuarioId) || esTutor(usuarioId);
    }

    public boolean esEstudiante(Long usuarioId) {
        return estudianteId.equals(usuarioId);
    }

    public boolean esTutor(Long usuarioId) {
        return tutorUsuarioId.equals(usuarioId);
    }

    public boolean permiteEscritura() {
        return estado == EstadoAsesoria.PENDIENTE;
    }

    public boolean estaCancelada() {
        return estado == EstadoAsesoria.CANCELADA;
    }
}
