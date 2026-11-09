package co.edu.epi.tutornow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminReportDetailResponse {

    private Long id;
    private String tipo;
    private Long targetId;
    private String motivo;
    private String descripcion;
    private String estado;
    private AdminReportResponse.ReportadorResponse reportador;
    private String resolucion;
    private OffsetDateTime resueltoAt;
    private AdminReportResponse.ReportadorResponse resueltoPor;
    private OffsetDateTime createdAt;
    private AdminReportTargetResponse target;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AdminReportTargetResponse {
        private String tema;
        private String descripcion;
        private String estado;
        private String estadoModeracion;
        private Integer rating;
        private String comentario;
        private String rolAutor;
        private String rol;
        private Boolean activo;
        private CatalogItemResponse materia;
        private ActorResponse autor;
        private ActorResponse estudiante;
    }

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
