package co.edu.epi.tutornow.auth.service;

import co.edu.epi.tutornow.dev.SimulatedEmailStore;
import co.edu.epi.tutornow.users.model.Usuario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final SimulatedEmailStore simulatedEmailStore;

    @Value("${app.verification.base-url}")
    private String verificationBaseUrl;

    @Value("${app.reset.base-url}")
    private String resetBaseUrl;

    @Value("${app.change-confirm.base-url}")
    private String changeConfirmBaseUrl;

    public EmailService(SimulatedEmailStore simulatedEmailStore) {
        this.simulatedEmailStore = simulatedEmailStore;
    }

    public void sendVerificationEmail(Usuario usuario) {
        String link = verificationBaseUrl + "?token=" + usuario.getVerificationToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cuenta tutorNow | Enlace de verificacion: {}",
                usuario.getCorreoElectronico(), link);
        captureEmail(usuario.getCorreoElectronico(), "Confirma tu cuenta tutorNow",
                "Enlace de verificacion", link, "verification");
    }

    public void sendPasswordResetEmail(Usuario usuario) {
        String link = resetBaseUrl + "?token=" + usuario.getResetToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Recupera tu contrasena tutorNow (expira en 15 minutos) | Enlace de recuperacion: {}",
                usuario.getCorreoElectronico(), link);
        captureEmail(usuario.getCorreoElectronico(), "Recupera tu contrasena tutorNow (expira en 15 minutos)",
                "Enlace de recuperacion", link, "password_reset");
    }

    public void sendPasswordChangeConfirmationEmail(Usuario usuario) {
        String link = changeConfirmBaseUrl + "?token=" + usuario.getCambioToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cambio de contrasena tutorNow (expira en 15 minutos) | Enlace de confirmacion: {}",
                usuario.getCorreoElectronico(), link);
        captureEmail(usuario.getCorreoElectronico(), "Confirma tu cambio de contrasena tutorNow (expira en 15 minutos)",
                "Enlace de confirmacion", link, "password_change_confirmation");
    }

    public void sendNewMessageNotification(Usuario destinatario, String remitenteNombre, String contenido, Long asesoriaId) {
        String link = String.format("http://localhost:3000/tutoring/chats?chat=%d", asesoriaId);
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Nuevo mensaje en tutorNow de {} | Vista previa: {} | Enlace: {}",
                destinatario.getCorreoElectronico(), remitenteNombre, contenido.length() > 50 ? contenido.substring(0, 50) + "..." : contenido, link);
        String vistaPrevia = contenido.length() > 50 ? contenido.substring(0, 50) + "..." : contenido;
        captureEmail(destinatario.getCorreoElectronico(), "Nuevo mensaje en tutorNow de " + remitenteNombre,
                "Nuevo mensaje de " + remitenteNombre + ": " + vistaPrevia, link, "new_message");
    }

    private void captureEmail(String to, String subject, String content, String link, String kind) {
        try {
            simulatedEmailStore.add(to, subject, content, link, kind);
        } catch (RuntimeException ignored) {
        }
    }
}
