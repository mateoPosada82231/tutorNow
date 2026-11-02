package co.edu.epi.tutornow.chat.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MarcarLeidoRequest {

    @NotNull(message = "El ultimo mensaje leido es obligatorio")
    @Positive(message = "El ultimo mensaje leido debe ser un identificador valido")
    private Long ultimoMensajeId;
}
