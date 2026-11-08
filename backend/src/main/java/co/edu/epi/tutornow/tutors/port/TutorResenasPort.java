package co.edu.epi.tutornow.tutors.port;

import co.edu.epi.tutornow.tutors.dto.TutorResenaResponse;

import java.util.List;

public interface TutorResenasPort {

    TutorResenasResumen obtenerResenas(Long tutorId);

    record TutorResenasResumen(
            Double promedioRating,
            long totalResenas,
            List<TutorResenaResponse> resenas) {
    }
}
