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
public class AsesoriaResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("solicitudId")
    private Long solicitudId;

    @JsonProperty("propuestaId")
    private Long propuestaId;

    @JsonProperty("estado")
    private String estado;

    @JsonProperty("tutor")
    private TutorBriefResponse tutor;

    @JsonProperty("confirmadaEstudiante")
    private boolean confirmadaEstudiante;

    @JsonProperty("confirmadaTutor")
    private boolean confirmadaTutor;

    @JsonProperty("finalizadaAt")
    private OffsetDateTime finalizadaAt;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
}
