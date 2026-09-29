package co.edu.epi.tutornow.tutors.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorSlotResponse {

    private Long id;

    private String diaSemana;

    private LocalTime horaInicio;
}
