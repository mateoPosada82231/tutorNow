package co.edu.epi.tutornow.auth.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "El correo electronico es obligatorio")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@elpoli\\.edu\\.co$", message = "Solo se permiten correos institucionales @elpoli.edu.co")
    private String email;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 8, max = 72, message = "La contrasena debe tener entre 8 y 72 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", message = "La contrasena debe contener al menos una mayuscula, una minuscula y un numero")
    private String password;

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
