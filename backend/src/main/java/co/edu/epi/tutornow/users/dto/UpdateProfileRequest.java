package co.edu.epi.tutornow.users.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 200, message = "El nombre completo no puede superar 200 caracteres")
    private String fullName;

    @NotNull(message = "La carrera es obligatoria")
    @Min(value = 1, message = "Carrera no valida")
    private Long carreraId;

    @NotNull(message = "El semestre es obligatorio")
    @Min(value = 1, message = "Semestre no valido")
    private Long semestreId;
}
