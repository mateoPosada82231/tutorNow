package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropuestaRepository extends JpaRepository<Propuesta, Long> {

    List<Propuesta> findBySolicitudIdOrderByCreatedAtAsc(Long solicitudId);

    List<Propuesta> findBySolicitudIdAndEstadoOrderByCreatedAtAsc(Long solicitudId, EstadoPropuesta estado);

    Optional<Propuesta> findBySolicitudIdAndTutorId(Long solicitudId, Long tutorId);

    boolean existsBySolicitudIdAndTutorId(Long solicitudId, Long tutorId);

    @Query("""
            SELECT p.solicitud.id, COUNT(p) FROM Propuesta p
            WHERE p.solicitud.id IN :solicitudIds
            GROUP BY p.solicitud.id
            """)
    List<Object[]> countGroupedBySolicitudId(@Param("solicitudIds") Collection<Long> solicitudIds);
}
