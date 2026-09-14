package co.edu.epi.tutornow.auth.service;

import co.edu.epi.tutornow.users.model.Usuario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.verification.base-url}")
    private String verificationBaseUrl;

    @Value("${app.reset.base-url}")
    private String resetBaseUrl;

    @Value("${app.change-confirm.base-url}")
    private String changeConfirmBaseUrl;

    public void sendVerificationEmail(Usuario usuario) {
        String link = verificationBaseUrl + "?token=" + usuario.getVerificationToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cuenta tutorNow | Enlace de verificacion: {}",
                usuario.getCorreoElectronico(), link);
    }

    public void sendPasswordResetEmail(Usuario usuario) {
        String link = resetBaseUrl + "?token=" + usuario.getResetToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Recupera tu contrasena tutorNow (expira en 15 minutos) | Enlace de recuperacion: {}",
                usuario.getCorreoElectronico(), link);
    }

    public void sendPasswordChangeConfirmationEmail(Usuario usuario) {
        String link = changeConfirmBaseUrl + "?token=" + usuario.getCambioToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cambio de contrasena tutorNow (expira en 15 minutos) | Enlace de confirmacion: {}",
                usuario.getCorreoElectronico(), link);
    }
}
