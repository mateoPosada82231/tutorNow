package co.edu.epi.tutornow.catalog.repository;

import co.edu.epi.tutornow.catalog.model.Carrera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarreraRepository extends JpaRepository<Carrera, Long> {

    List<Carrera> findByActivaTrueOrderByNombre();
}
