package co.edu.epi.tutornow.tutorial.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTutoringRequest {

    @NotNull(message = "La materia es obligatoria")
    @Min(value = 1, message = "Materia no valida")
    private Long materiaId;

    @NotBlank(message = "El tema es obligatorio")
    @Size(min = 5, max = 120, message = "El tema debe tener entre 5 y 120 caracteres")
    private String tema;

    @NotBlank(message = "La modalidad es obligatoria")
    @Pattern(regexp = "VIRTUAL|PRESENCIAL", message = "La modalidad debe ser VIRTUAL o PRESENCIAL")
    private String modalidad;

    @NotBlank(message = "La disponibilidad es obligatoria")
    @Size(min = 5, max = 300, message = "La disponibilidad debe tener entre 5 y 300 caracteres")
    private String disponibilidad;

    @Size(max = 1000, message = "La descripcion no puede superar 1000 caracteres")
    private String descripcion;
}
