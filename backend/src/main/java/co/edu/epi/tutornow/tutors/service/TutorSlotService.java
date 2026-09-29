package co.edu.epi.tutornow.tutors.service;

import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutors.dto.TutorSlotRequest;
import co.edu.epi.tutornow.tutors.dto.TutorSlotResponse;
import co.edu.epi.tutornow.tutors.dto.TutorSlotsRequest;
import co.edu.epi.tutornow.tutors.model.DiaSemana;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.model.TutorSlot;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.tutors.repository.TutorSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TutorSlotService {

    private static final LocalTime HORA_INICIO_MINIMA = LocalTime.of(8, 0);
    private static final LocalTime HORA_INICIO_MAXIMA = LocalTime.of(17, 0);

    private final TutorRepository tutorRepository;
    private final TutorSlotRepository tutorSlotRepository;

    @Transactional(readOnly = true)
    public List<TutorSlotResponse> getMySlots(String correo) {
        Tutor tutor = findTutorOrThrow(correo);

        return tutorSlotRepository.findByTutorId(tutor.getId()).stream()
                .sorted(Comparator
                        .comparingInt((TutorSlot slot) -> slot.getDiaSemana().ordinal())
                        .thenComparing(TutorSlot::getHoraInicio))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<TutorSlotResponse> saveMySlots(String correo, TutorSlotsRequest request) {
        Tutor tutor = findTutorOrThrow(correo);

        List<TutorSlotRequest> bloques = request.getSlots() == null ? List.of() : request.getSlots();
        Set<TutorSlot> slots = resolveSlots(tutor, bloques);

        tutorSlotRepository.deleteByTutorId(tutor.getId());
        tutorSlotRepository.saveAll(slots);

        return slots.stream()
                .sorted(Comparator
                        .comparingInt((TutorSlot slot) -> slot.getDiaSemana().ordinal())
                        .thenComparing(TutorSlot::getHoraInicio))
                .map(this::toResponse)
                .toList();
    }

    private Set<TutorSlot> resolveSlots(Tutor tutor, List<TutorSlotRequest> bloques) {
        Set<TutorSlot> slots = new LinkedHashSet<>();
        Set<String> claves = new HashSet<>();

        for (TutorSlotRequest bloque : bloques) {
            DiaSemana dia = parseDiaSemana(bloque.getDiaSemana());
            LocalTime hora = validarHoraInicio(bloque.getHoraInicio());

            boolean nuevo = claves.add(dia.name() + "#" + hora);
            if (!nuevo) {
                throw new ConflictException("El bloque " + dia + " a las " + hora + " esta duplicado");
            }

            slots.add(TutorSlot.builder()
                    .tutor(tutor)
                    .diaSemana(dia)
                    .horaInicio(hora)
                    .build());
        }

        return slots;
    }

    private DiaSemana parseDiaSemana(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new ConflictException("El dia de la semana es obligatorio");
        }

        return Arrays.stream(DiaSemana.values())
                .filter(d -> d.name().equalsIgnoreCase(valor.trim()))
                .findFirst()
                .orElseThrow(() -> new ConflictException("El dia de la semana no es valido"));
    }

    private LocalTime validarHoraInicio(LocalTime hora) {
        if (hora == null) {
            throw new ConflictException("La hora de inicio es obligatoria");
        }

        if (hora.isBefore(HORA_INICIO_MINIMA) || hora.isAfter(HORA_INICIO_MAXIMA)) {
            throw new ConflictException("La hora de inicio debe estar entre las 08:00 y las 17:00");
        }

        return hora;
    }

    private Tutor findTutorOrThrow(String correo) {
        return tutorRepository.findByUsuario_CorreoElectronico(correo.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("No tienes un perfil de tutor"));
    }

    private TutorSlotResponse toResponse(TutorSlot slot) {
        return TutorSlotResponse.builder()
                .id(slot.getId())
                .diaSemana(slot.getDiaSemana().name())
                .horaInicio(slot.getHoraInicio())
                .build();
    }
}
