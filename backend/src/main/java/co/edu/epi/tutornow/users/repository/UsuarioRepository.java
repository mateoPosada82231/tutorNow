package co.edu.epi.tutornow.users.repository;

import co.edu.epi.tutornow.users.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoElectronico(String correoElectronico);

    Optional<Usuario> findByVerificationToken(String verificationToken);

    Optional<Usuario> findByResetToken(String resetToken);

    Optional<Usuario> findByCambioToken(String cambioToken);

    boolean existsByCorreoElectronico(String correoElectronico);
}
