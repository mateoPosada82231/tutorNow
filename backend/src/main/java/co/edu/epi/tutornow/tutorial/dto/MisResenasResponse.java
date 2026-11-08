package co.edu.epi.tutornow.tutorial.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MisResenasResponse {

    @JsonProperty("promedioRating")
    private Double promedioRating;

    @JsonProperty("totalResenas")
    private long totalResenas;

    @JsonProperty("resenasRecibidas")
    private List<ResenaRecibidaResponse> resenasRecibidas;

    @JsonProperty("pendientes")
    private List<ResenaPendienteResponse> pendientes;
}
