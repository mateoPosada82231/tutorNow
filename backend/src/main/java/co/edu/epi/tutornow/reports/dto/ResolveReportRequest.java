package co.edu.epi.tutornow.reports.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveReportRequest {

    @NotBlank
    @Size(min = 5, max = 500, message = "La resolucion debe tener entre 5 y 500 caracteres")
    private String resolucion;
}
