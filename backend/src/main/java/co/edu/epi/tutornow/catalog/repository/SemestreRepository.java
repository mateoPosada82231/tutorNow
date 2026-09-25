package co.edu.epi.tutornow.catalog.repository;

import co.edu.epi.tutornow.catalog.model.Semestre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SemestreRepository extends JpaRepository<Semestre, Long> {

    List<Semestre> findByActivoTrueOrderByNumero();
}
