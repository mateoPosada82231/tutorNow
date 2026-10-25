package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.Asesoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AsesoriaRepository extends JpaRepository<Asesoria, Long> {

    boolean existsBySolicitudId(Long solicitudId);

    boolean existsByPropuestaId(Long propuestaId);

    @Query("""
            SELECT a FROM Asesoria a
            WHERE a.tutor.usuario.correoElectronico = :correo
            ORDER BY a.createdAt DESC
            """)
    Page<Asesoria> findByTutorCorreo(@Param("correo") String correo, Pageable pageable);
}
