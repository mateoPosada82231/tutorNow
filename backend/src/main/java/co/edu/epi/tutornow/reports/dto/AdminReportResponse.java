package co.edu.epi.tutornow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminReportResponse {

    private Long id;
    private String tipo;
    private Long targetId;
    private String motivo;
    private String descripcion;
    private String estado;
    private ReportadorResponse reportador;
    private String resolucion;
    private OffsetDateTime resueltoAt;
    private ReportadorResponse resueltoPor;
    private OffsetDateTime createdAt;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ReportadorResponse {
        private Long id;
        private String fullName;
        private String email;
    }
}
