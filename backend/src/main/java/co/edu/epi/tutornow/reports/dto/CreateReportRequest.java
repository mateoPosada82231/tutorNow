package co.edu.epi.tutornow.reports.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {

    private String tipo;

    @NotNull
    private Long targetId;

    @Size(min = 3, max = 120, message = "El motivo debe tener entre 3 y 120 caracteres")
    private String motivo;

    @Size(min = 5, max = 1000, message = "La descripcion debe tener entre 5 y 1000 caracteres")
    private String descripcion;
}
