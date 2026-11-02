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
public class MensajeResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("asesoriaId")
    private Long asesoriaId;

    @JsonProperty("emisor")
    private EmisorBriefResponse emisor;

    @JsonProperty("contenido")
    private String contenido;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
}
