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
public class ResenaRecibidaResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("rating")
    private Integer rating;

    @JsonProperty("comentario")
    private String comentario;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
}
