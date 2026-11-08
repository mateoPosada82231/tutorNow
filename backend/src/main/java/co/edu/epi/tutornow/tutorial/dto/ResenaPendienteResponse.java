package co.edu.epi.tutornow.tutorial.dto;

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
public class ResenaPendienteResponse {

    @JsonProperty("asesoriaId")
    private Long asesoriaId;

    @JsonProperty("solicitudId")
    private Long solicitudId;

    @JsonProperty("tema")
    private String tema;

    @JsonProperty("contraparte")
    private String contraparte;

    @JsonProperty("finalizadaAt")
    private OffsetDateTime finalizadaAt;
}
