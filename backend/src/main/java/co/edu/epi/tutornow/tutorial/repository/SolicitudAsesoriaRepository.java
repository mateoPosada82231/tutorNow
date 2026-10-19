package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitudAsesoriaRepository extends JpaRepository<SolicitudAsesoria, Long> {

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE (:estudianteId IS NULL OR s.estudiante.id = :estudianteId)
              AND (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
              AND (:estado IS NULL OR s.estado = :estado)
            ORDER BY s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findFiltered(
            @Param("estudianteId") Long estudianteId,
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            @Param("estado") EstadoSolicitud estado,
            Pageable pageable);

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
              AND (:estado IS NULL OR s.estado = :estado)
            ORDER BY CASE WHEN s.materia.id IN :materias THEN 0 ELSE 1 END, s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findFilteredPrioritized(
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            @Param("estado") EstadoSolicitud estado,
            @Param("materias") List<Long> materias,
            Pageable pageable);
}
