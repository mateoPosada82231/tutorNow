package co.edu.epi.tutornow.users.repository;

import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoElectronico(String correoElectronico);

    Optional<Usuario> findByVerificationToken(String verificationToken);

    Optional<Usuario> findByResetToken(String resetToken);

    Optional<Usuario> findByCambioToken(String cambioToken);

    boolean existsByCorreoElectronico(String correoElectronico);

    @Query("""
            SELECT u FROM Usuario u
            WHERE (:rol IS NULL OR u.rol = :rol)
              AND (:activo IS NULL OR u.activo = :activo)
              AND (:q IS NULL OR LOWER(u.nombreCompleto) LIKE :q
                   OR LOWER(u.correoElectronico) LIKE :q)
            ORDER BY u.createdAt DESC
            """)
    Page<Usuario> findAdminFiltered(
            @Param("rol") Rol rol,
            @Param("activo") Boolean activo,
            @Param("q") String q,
            Pageable pageable);
}
