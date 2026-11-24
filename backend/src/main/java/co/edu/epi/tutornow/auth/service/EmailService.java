package co.edu.epi.tutornow.auth.service;

import co.edu.epi.tutornow.dev.SimulatedEmailStore;
import co.edu.epi.tutornow.users.model.Usuario;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Envio de correos transaccionales.
 *
 * <p>Si la variable {@code RESEND_API_KEY} esta definida, el correo se envia por la API
 * HTTPS de Resend (Render bloquea SMTP saliente en el plan gratuito). Si no esta definida,
 * o si el envio falla, el correo se conserva en la bandeja simulada ({@code /dev/inbox})
 * para que el flujo nunca se rompa en desarrollo.</p>
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String RESEND_ENDPOINT = "https://api.resend.com/emails";
    private static final String DEFAULT_FRONTEND_BASE_URL = "http://localhost:3000";

    private final SimulatedEmailStore simulatedEmailStore;

    @Value("${app.verification.base-url}")
    private String verificationBaseUrl;

    @Value("${app.reset.base-url}")
    private String resetBaseUrl;

    @Value("${app.change-confirm.base-url}")
    private String changeConfirmBaseUrl;

    @Value("${app.frontend.base-url:" + DEFAULT_FRONTEND_BASE_URL + "}")
    private String frontendBaseUrl;

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from:TutorNow <no-reply@tutornow.site>}")
    private String fromAddress;

    private RestClient restClient;

    public EmailService(SimulatedEmailStore simulatedEmailStore) {
        this.simulatedEmailStore = simulatedEmailStore;
    }

    /**
     * Deja constancia en los logs del arranque de si el envio real esta activo.
     * Facilita diagnosticar despliegues donde falta la variable RESEND_API_KEY.
     */
    @PostConstruct
    void logMailConfiguration() {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("[MAIL] RESEND_API_KEY vacia: los correos solo se guardaran en la bandeja simulada (/dev/inbox).");
        } else {
            log.info("[MAIL] Resend configurado: se enviaran correos reales desde '{}'.", fromAddress);
        }
    }

    public void sendVerificationEmail(Usuario usuario) {
        String link = verificationBaseUrl + "?token=" + usuario.getVerificationToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cuenta tutorNow | Enlace de verificacion: {}",
                usuario.getCorreoElectronico(), link);
        captureEmail(usuario.getCorreoElectronico(), "Confirma tu cuenta tutorNow",
                "Enlace de verificacion", link, "verification");
        send("Confirma tu cuenta tutorNow", usuario.getCorreoElectronico(), buildActionEmail(
                "Confirma tu cuenta",
                "Hola, gracias por registrarte en tutorNow. Confirma tu correo institucional para activar tu cuenta.",
                "Confirmar mi cuenta",
                link,
                "Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje."));
    }

    public void sendPasswordResetEmail(Usuario usuario) {
        String link = resetBaseUrl + "?token=" + usuario.getResetToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Recupera tu contrasena tutorNow (expira en 15 minutos) | Enlace de recuperacion: {}",
                usuario.getCorreoElectronico(), link);
        captureEmail(usuario.getCorreoElectronico(), "Recupera tu contrasena tutorNow (expira en 15 minutos)",
                "Enlace de recuperacion", link, "password_reset");
        send("Recupera tu contrasena tutorNow", usuario.getCorreoElectronico(), buildActionEmail(
                "Recupera tu contrasena",
                "Recibimos una solicitud para restablecer tu contrasena de tutorNow.",
                "Restablecer contrasena",
                link,
                "Este enlace expira en 15 minutos. Si no solicitaste el cambio, ignora este mensaje."));
    }

    public void sendPasswordChangeConfirmationEmail(Usuario usuario) {
        String link = changeConfirmBaseUrl + "?token=" + usuario.getCambioToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cambio de contrasena tutorNow (expira en 15 minutos) | Enlace de confirmacion: {}",
                usuario.getCorreoElectronico(), link);
        captureEmail(usuario.getCorreoElectronico(), "Confirma tu cambio de contrasena tutorNow (expira en 15 minutos)",
                "Enlace de confirmacion", link, "password_change_confirmation");
        send("Confirma tu cambio de contrasena tutorNow", usuario.getCorreoElectronico(), buildActionEmail(
                "Confirma el cambio de contrasena",
                "Confirma que deseas cambiar la contrasena de tu cuenta tutorNow.",
                "Confirmar cambio",
                link,
                "Este enlace expira en 15 minutos. Si no solicitaste el cambio, ignora este mensaje."));
    }

    public void sendNewMessageNotification(Usuario destinatario, String remitenteNombre, String contenido, Long asesoriaId) {
        String link = String.format("%s/tutoring/chats?chat=%d", frontendBase(), asesoriaId);
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Nuevo mensaje en tutorNow de {} | Vista previa: {} | Enlace: {}",
                destinatario.getCorreoElectronico(), remitenteNombre, contenido.length() > 50 ? contenido.substring(0, 50) + "..." : contenido, link);
        String vistaPrevia = contenido.length() > 50 ? contenido.substring(0, 50) + "..." : contenido;
        captureEmail(destinatario.getCorreoElectronico(), "Nuevo mensaje en tutorNow de " + remitenteNombre,
                "Nuevo mensaje de " + remitenteNombre + ": " + vistaPrevia, link, "new_message");
        send("Nuevo mensaje en tutorNow de " + remitenteNombre, destinatario.getCorreoElectronico(), buildActionEmail(
                "Tienes un mensaje nuevo",
                remitenteNombre + " te escribio: \"" + vistaPrevia + "\"",
                "Abrir el chat",
                link,
                "Recibes este correo porque tienes una asesoria activa en tutorNow."));
    }

    private void captureEmail(String to, String subject, String content, String link, String kind) {
        try {
            simulatedEmailStore.add(to, subject, content, link, kind);
        } catch (RuntimeException ignored) {
        }
    }

    /**
     * Envia el correo por Resend. Nunca lanza excepciones: si no hay API key o el envio
     * falla, el correo queda solo en la bandeja simulada.
     */
    private void send(String subject, String to, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            return;
        }
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", fromAddress == null || fromAddress.isBlank()
                    ? "TutorNow <onboarding@resend.dev>"
                    : fromAddress);
            payload.put("to", List.of(to));
            payload.put("subject", subject);
            payload.put("html", html);

            restClient().post()
                    .uri(RESEND_ENDPOINT)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Correo '{}' enviado a {} via Resend", subject, to);
        } catch (Exception exception) {
            log.error("No se pudo enviar el correo '{}' a {} via Resend: {}. Se conserva en la bandeja simulada.",
                    subject, to, exception.getMessage());
        }
    }

    private RestClient restClient() {
        if (restClient == null) {
            restClient = RestClient.builder().build();
        }
        return restClient;
    }

    private String frontendBase() {
        if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
            return DEFAULT_FRONTEND_BASE_URL;
        }
        String base = frontendBaseUrl.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private String buildActionEmail(String title, String message, String actionLabel, String link, String footer) {
        return """
                <!DOCTYPE html>
                <html lang="es">
                <body style="margin:0;padding:24px;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
                    <tr><td style="font-size:22px;font-weight:700;color:#0f7b4f;padding-bottom:8px;">tutorNow</td></tr>
                    <tr><td style="font-size:18px;font-weight:600;padding-bottom:12px;">%s</td></tr>
                    <tr><td style="font-size:15px;line-height:1.6;padding-bottom:24px;">%s</td></tr>
                    <tr><td style="padding-bottom:24px;">
                      <a href="%s" style="display:inline-block;background:#0f7b4f;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">%s</a>
                    </td></tr>
                    <tr><td style="font-size:13px;line-height:1.6;color:#6b7280;padding-bottom:8px;">%s</td></tr>
                    <tr><td style="font-size:12px;color:#9ca3af;padding-top:16px;border-top:1px solid #e5e7eb;">Asesorias academicas entre pares — tutornow.site</td></tr>
                  </table>
                </body>
                </html>
                """.formatted(title, message, link, actionLabel, footer);
    }
}
