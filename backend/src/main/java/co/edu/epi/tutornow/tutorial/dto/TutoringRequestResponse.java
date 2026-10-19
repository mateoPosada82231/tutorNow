package co.edu.epi.tutornow.tutorial.dto;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutoringRequestResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("tema")
    private String tema;

    @JsonProperty("modalidad")
    private String modalidad;

    @JsonProperty("disponibilidad")
    private String disponibilidad;

    @JsonProperty("descripcion")
    private String descripcion;

    @JsonProperty("estado")
    private String estado;

    @JsonProperty("materia")
    private CatalogItemResponse materia;

    @JsonProperty("estudiante")
    private UserBriefResponse estudiante;

    @JsonProperty("propuestasCount")
    private long propuestasCount;

    @JsonProperty("isOwner")
    private boolean isOwner;

    @JsonProperty("isProfileMatch")
    private Boolean isProfileMatch;

    @JsonProperty("propuestas")
    private List<ProposalResponse> propuestas;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
}
