package co.edu.epi.tutornow.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EnviarMensajeRequest {

    @NotBlank(message = "El mensaje no puede estar vacio")
    private String contenido;

    @NotBlank(message = "El identificador del mensaje es obligatorio")
    @Size(max = 64, message = "El identificador del mensaje no puede superar los 64 caracteres")
    private String clientMessageId;
}
