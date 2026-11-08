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
        Object[] stats = resenaRepository.calcularPromedioTutor(
                tutorId, RolAutorResena.ESTUDIANTE, EstadoAsesoria.EVALUADA);

        Double promedio = null;
        long total = 0;
        if (stats != null && stats.length >= 2) {
            if (stats[0] != null) {
                promedio = redondear(((Number) stats[0]).doubleValue());
            }
            if (stats[1] != null) {
                total = ((Number) stats[1]).longValue();
            }
        }

        List<TutorResenaResponse> resenas = resenaRepository
                .findPublicasPorTutor(tutorId, RolAutorResena.ESTUDIANTE, EstadoAsesoria.EVALUADA)
                .stream()
                .map(this::toResponse)
                .toList();

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
