package co.edu.epi.tutornow.tutors.dto;

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
public class TutorResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("biografia")
    private String biografia;

    @JsonProperty("materias")
    private List<CatalogItemResponse> materias;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
}
