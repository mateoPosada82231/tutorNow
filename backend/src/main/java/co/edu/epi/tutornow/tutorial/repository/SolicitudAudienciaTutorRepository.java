package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.SolicitudAudienciaTutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitudAudienciaTutorRepository extends JpaRepository<SolicitudAudienciaTutor, Long> {

    boolean existsBySolicitudId(Long solicitudId);

    boolean existsBySolicitudIdAndTutorId(Long solicitudId, Long tutorId);
}
