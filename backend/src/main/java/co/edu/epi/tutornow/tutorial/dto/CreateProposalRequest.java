package co.edu.epi.tutornow.tutorial.dto;

import jakarta.validation.constraints.NotBlank;
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
public class CreateProposalRequest {

    @NotBlank(message = "El mensaje es obligatorio")
    @Size(min = 10, max = 500, message = "El mensaje debe tener entre 10 y 500 caracteres")
    private String mensaje;
}
