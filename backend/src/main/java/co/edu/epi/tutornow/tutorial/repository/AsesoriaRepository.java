package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.Asesoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AsesoriaRepository extends JpaRepository<Asesoria, Long> {

    boolean existsBySolicitudId(Long solicitudId);

    boolean existsByPropuestaId(Long propuestaId);
}
