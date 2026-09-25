package co.edu.epi.tutornow.tutors.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorProfileRequest {

    @NotBlank(message = "La biografia es obligatoria")
    @Size(min = 10, max = 1000, message = "La biografia debe tener entre 10 y 1000 caracteres")
    private String biografia;

    @NotEmpty(message = "Debes seleccionar al menos una materia")
    private List<@NotNull(message = "Materia no valida") @Min(value = 1, message = "Materia no valida") Long> materiaIds;
}
