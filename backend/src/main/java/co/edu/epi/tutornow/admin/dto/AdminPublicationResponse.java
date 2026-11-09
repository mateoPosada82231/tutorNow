package co.edu.epi.tutornow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminPublicationResponse {

    private Long id;
    private String tema;
    private String descripcion;
    private String estado;
    private String estadoModeracion;
    private OffsetDateTime createdAt;
    private CatalogItemResponse materia;
    private ActorResponse estudiante;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class CatalogItemResponse {
        private Long id;
        private String label;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ActorResponse {
        private Long id;
        private String fullName;
        private String email;
    }
}
