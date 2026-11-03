package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AsesoriaRepository extends JpaRepository<Asesoria, Long> {

    boolean existsBySolicitudId(Long solicitudId);

    boolean existsByPropuestaId(Long propuestaId);

    Optional<Asesoria> findBySolicitudId(Long solicitudId);

    List<Asesoria> findBySolicitudIdIn(Collection<Long> solicitudIds);

    @Query("""
            SELECT a FROM Asesoria a
            WHERE a.tutor.usuario.correoElectronico = :correo
              AND (:estadoFiltro IS NULL OR a.estado = :estadoFiltro)
              AND (:materiaId IS NULL OR a.solicitud.materia.id = :materiaId)
            ORDER BY CASE WHEN a.estado = :estadoCancelada THEN 1 ELSE 0 END, a.createdAt DESC
            """)
    Page<Asesoria> findByTutorCorreo(
            @Param("correo") String correo,
            @Param("estadoCancelada") EstadoAsesoria estadoCancelada,
            @Param("estadoFiltro") EstadoAsesoria estadoFiltro,
            @Param("materiaId") Long materiaId,
            Pageable pageable);

    @Query("""
            SELECT a FROM Asesoria a
            JOIN FETCH a.estudiante
            JOIN FETCH a.tutor t
            JOIN FETCH t.usuario
            JOIN FETCH a.solicitud s
            JOIN FETCH s.materia
            WHERE a.id = :id
            """)
    Optional<Asesoria> findByIdConParticipantes(@Param("id") Long id);

    @Query("""
            SELECT a FROM Asesoria a
            JOIN FETCH a.estudiante
            JOIN FETCH a.tutor t
            JOIN FETCH t.usuario
            JOIN FETCH a.solicitud s
            JOIN FETCH s.materia
            WHERE a.estudiante.id = :usuarioId OR t.usuario.id = :usuarioId
            ORDER BY a.createdAt DESC
            """)
    List<Asesoria> findByParticipante(@Param("usuarioId") Long usuarioId);
}
