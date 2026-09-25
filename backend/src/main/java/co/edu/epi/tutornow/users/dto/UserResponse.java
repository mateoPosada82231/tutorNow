package co.edu.epi.tutornow.users.dto;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("email")
    private String email;

    @JsonProperty("fullName")
    private String fullName;

    @JsonProperty("role")
    private String role;

    @JsonProperty("carrera")
    private CatalogItemResponse carrera;

    @JsonProperty("semestre")
    private CatalogItemResponse semestre;

    @JsonProperty("isTutor")
    private boolean isTutor;
}
