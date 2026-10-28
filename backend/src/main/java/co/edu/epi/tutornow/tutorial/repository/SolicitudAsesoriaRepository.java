package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SolicitudAsesoriaRepository extends JpaRepository<SolicitudAsesoria, Long> {

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE (:estudianteId IS NULL OR s.estudiante.id = :estudianteId)
              AND (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
              AND (:estado IS NULL OR s.estado = :estado)
              AND (:ocultarNoDisponibles = FALSE OR (
                    s.estudiante.id = :viewerId
                    OR (s.estado <> :estadoCancelada
                        AND NOT EXISTS (
                            SELECT a FROM Asesoria a
                            WHERE a.solicitud.id = s.id))))
            ORDER BY s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findFiltered(
            @Param("estudianteId") Long estudianteId,
            @Param("viewerId") Long viewerId,
            @Param("ocultarNoDisponibles") boolean ocultarNoDisponibles,
            @Param("estadoCancelada") EstadoSolicitud estadoCancelada,
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            @Param("estado") EstadoSolicitud estado,
            Pageable pageable);

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
              AND (:estado IS NULL OR s.estado = :estado)
              AND (:ocultarNoDisponibles = FALSE OR (
                    s.estudiante.id = :viewerId
                    OR (s.estado <> :estadoCancelada
                        AND NOT EXISTS (
                            SELECT a FROM Asesoria a
                            WHERE a.solicitud.id = s.id))))
            ORDER BY CASE WHEN s.materia.id IN :materias THEN 0 ELSE 1 END, s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findFilteredPrioritized(
            @Param("viewerId") Long viewerId,
            @Param("ocultarNoDisponibles") boolean ocultarNoDisponibles,
            @Param("estadoCancelada") EstadoSolicitud estadoCancelada,
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            @Param("estado") EstadoSolicitud estado,
            @Param("materias") List<Long> materias,
            Pageable pageable);

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE s.estudiante.id = :estudianteId
              AND s.estado <> :estadoCancelada
              AND NOT EXISTS (
                  SELECT a FROM Asesoria a
                  WHERE a.solicitud.id = s.id)
              AND (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
              AND (:estado IS NULL OR s.estado = :estado)
            ORDER BY s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findOpenForStudent(
            @Param("estudianteId") Long estudianteId,
            @Param("estadoCancelada") EstadoSolicitud estadoCancelada,
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            @Param("estado") EstadoSolicitud estado,
            Pageable pageable);

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE s.estudiante.id = :estudianteId
              AND EXISTS (
                  SELECT a FROM Asesoria a
                  WHERE a.solicitud.id = s.id
                    AND a.estado = :estadoAsesoria)
              AND (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
            ORDER BY s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findInCoordinationForStudent(
            @Param("estudianteId") Long estudianteId,
            @Param("estadoAsesoria") EstadoAsesoria estadoAsesoria,
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            Pageable pageable);

    @Query("""
            SELECT s FROM SolicitudAsesoria s
            WHERE s.estudiante.id = :estudianteId
              AND (s.estado = :estadoCancelada
                   OR EXISTS (
                       SELECT a FROM Asesoria a
                       WHERE a.solicitud.id = s.id
                         AND a.estado IN :estadosAsesoria))
              AND (:materiaId IS NULL OR s.materia.id = :materiaId)
              AND (:modalidad IS NULL OR s.modalidad = :modalidad)
            ORDER BY CASE WHEN s.estado = :estadoCancelada THEN 1 ELSE 0 END, s.createdAt DESC
            """)
    Page<SolicitudAsesoria> findHistoryForStudent(
            @Param("estudianteId") Long estudianteId,
            @Param("estadoCancelada") EstadoSolicitud estadoCancelada,
            @Param("estadosAsesoria") Collection<EstadoAsesoria> estadosAsesoria,
            @Param("materiaId") Long materiaId,
            @Param("modalidad") Modalidad modalidad,
            Pageable pageable);
}
