package co.edu.epi.tutornow.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CatalogItemResponse {

    private Long id;
    private String label;
}
