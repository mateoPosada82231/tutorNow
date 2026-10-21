package co.edu.epi.tutornow.tutors.dto;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
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
public class TutorProfileResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("fullName")
    private String fullName;

    @JsonProperty("biografia")
    private String biografia;

    @JsonProperty("materias")
    private List<CatalogItemResponse> materias;

    @JsonProperty("disponibilidad")
    private List<TutorSlotResponse> disponibilidad;

    @JsonProperty("resenas")
    private List<TutorResenaResponse> resenas;
}
