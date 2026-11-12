package co.edu.epi.tutornow.tutors.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorSlotsRequest {

    private List<TutorSlotRequest> slots;

    /** Monday of the replaced week; defaults to the current week when missing. */
    private LocalDate semanaInicio;
}
