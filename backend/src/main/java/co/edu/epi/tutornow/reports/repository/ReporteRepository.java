package co.edu.epi.tutornow.reports.repository;

import co.edu.epi.tutornow.reports.model.EstadoReporte;
import co.edu.epi.tutornow.reports.model.Reporte;
import co.edu.epi.tutornow.reports.model.TipoReporte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    boolean existsByReportadorIdAndTipoAndTargetIdAndEstado(
            Long reportadorId, TipoReporte tipo, Long targetId, EstadoReporte estado);

    @Query("""
            SELECT r FROM Reporte r
            WHERE (:estado IS NULL OR r.estado = :estado)
              AND (:tipo IS NULL OR r.tipo = :tipo)
            ORDER BY CASE WHEN r.estado = 'PENDIENTE' THEN 0 ELSE 1 END, r.createdAt DESC
            """)
    Page<Reporte> findFiltered(
            @Param("estado") EstadoReporte estado,
            @Param("tipo") TipoReporte tipo,
            Pageable pageable);
}
