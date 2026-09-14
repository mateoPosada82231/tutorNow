package co.edu.epi.tutornow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    @NotBlank(message = "El correo electronico es obligatorio")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@elpoli\\.edu\\.co$", message = "Solo se permiten correos institucionales @elpoli.edu.co")
    private String email;
}
