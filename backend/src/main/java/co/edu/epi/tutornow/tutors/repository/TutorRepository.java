package co.edu.epi.tutornow.tutors.repository;

import co.edu.epi.tutornow.tutors.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {

    Optional<Tutor> findByUsuario_CorreoElectronico(String correoElectronico);

    Optional<Tutor> findByUsuario_Id(Long usuarioId);

    List<Tutor> findByUsuario_IdIn(List<Long> usuarioIds);

    boolean existsByUsuario_CorreoElectronico(String correoElectronico);
}
