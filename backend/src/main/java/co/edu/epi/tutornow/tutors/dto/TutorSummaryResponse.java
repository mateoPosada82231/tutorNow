package co.edu.epi.tutornow.tutors.dto;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Resumen de un tutor para seleccionarlo como audiencia de una publicacion.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorSummaryResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("materias")
    private List<CatalogItemResponse> materias;
}
