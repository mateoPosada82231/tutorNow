package co.edu.epi.tutornow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ReportResponse {

    private Long id;
    private String tipo;
    private Long targetId;
    private String motivo;
    private String descripcion;
    private String estado;
    private OffsetDateTime createdAt;
}
