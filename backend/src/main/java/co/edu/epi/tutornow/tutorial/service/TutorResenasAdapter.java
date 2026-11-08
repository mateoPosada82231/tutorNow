package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutors.dto.TutorResenaResponse;
import co.edu.epi.tutornow.tutors.port.TutorResenasPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TutorResenasAdapter implements TutorResenasPort {

    private final ResenaRepository resenaRepository;

    @Override
    @Transactional(readOnly = true)
    public TutorResenasResumen obtenerResenas(Long tutorId) {
        List<TutorResenaResponse> resenas = resenaRepository
                .findPublicasPorTutor(tutorId, RolAutorResena.ESTUDIANTE, EstadoAsesoria.EVALUADA)
                .stream()
                .map(this::toResponse)
                .toList();

        Double promedio = null;
        long total = resenas.size();
        if (!resenas.isEmpty()) {
            double suma = resenas.stream()
                    .mapToDouble(TutorResenaResponse::getRating)
                    .sum();
            promedio = redondear(suma / resenas.size());
        }

        return new TutorResenasResumen(promedio, total, resenas);
    }

    private TutorResenaResponse toResponse(Resena resena) {
        return TutorResenaResponse.builder()
                .id(resena.getId())
                .rating(resena.getRating())
                .comentario(resena.getComentario())
                .createdAt(resena.getCreatedAt())
                .build();
    }

    static double redondear(double valor) {
        return BigDecimal.valueOf(valor)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
