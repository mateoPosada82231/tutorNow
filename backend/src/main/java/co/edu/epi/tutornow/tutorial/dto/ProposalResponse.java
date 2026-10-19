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
public class ProposalResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("solicitudId")
    private Long solicitudId;

    @JsonProperty("mensaje")
    private String mensaje;

    @JsonProperty("estado")
    private String estado;

    @JsonProperty("tutor")
    private TutorBriefResponse tutor;

    @JsonProperty("isMine")
    private boolean isMine;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
}
