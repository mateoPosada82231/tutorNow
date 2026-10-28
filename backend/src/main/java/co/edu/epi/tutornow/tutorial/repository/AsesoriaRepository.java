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
            ORDER BY CASE WHEN a.estado = :estadoCancelada THEN 1 ELSE 0 END, a.createdAt DESC
            """)
    Page<Asesoria> findByTutorCorreo(
            @Param("correo") String correo,
            @Param("estadoCancelada") EstadoAsesoria estadoCancelada,
            Pageable pageable);
}
