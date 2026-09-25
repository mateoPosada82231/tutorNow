package co.edu.epi.tutornow.catalog.repository;

import co.edu.epi.tutornow.catalog.model.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    List<Materia> findByActivaTrueOrderByNombre();
}
