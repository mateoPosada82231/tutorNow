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

    public void sendVerificationEmail(Usuario usuario) {
        String link = verificationBaseUrl + "?token=" + usuario.getVerificationToken();
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: Confirma tu cuenta tutorNow | Enlace de verificacion: {}",
                usuario.getCorreoElectronico(), link);
    }
}
