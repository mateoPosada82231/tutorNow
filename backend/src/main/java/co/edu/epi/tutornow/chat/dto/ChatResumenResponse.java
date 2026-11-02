package co.edu.epi.tutornow.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResumenResponse {

    @JsonProperty("asesoriaId")
    private Long asesoriaId;

    @JsonProperty("contraparte")
    private EmisorBriefResponse contraparte;

    @JsonProperty("materia")
    private String materia;

    @JsonProperty("tema")
    private String tema;

    @JsonProperty("estado")
    private String estado;

    @JsonProperty("permiteEscritura")
    private boolean permiteEscritura;

    @JsonProperty("ultimoMensaje")
    private String ultimoMensaje;

    @JsonProperty("ultimoMensajeAt")
    private OffsetDateTime ultimoMensajeAt;

    @JsonProperty("noLeidos")
    private long noLeidos;
}
