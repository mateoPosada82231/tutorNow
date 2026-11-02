package co.edu.epi.tutornow.dev;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import co.edu.epi.tutornow.auth.service.EmailService;
import co.edu.epi.tutornow.users.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService captura en SimulatedEmailStore")
class EmailServiceCaptureTest {

    private final SimulatedEmailStore simulatedEmailStore = new SimulatedEmailStore();

    @Mock
    private SimulatedEmailStore failingStore;

    private EmailService emailService;

    private ListAppender<ILoggingEvent> logAppender;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(simulatedEmailStore);
        ReflectionTestUtils.setField(emailService, "verificationBaseUrl",
                "http://localhost:3000/verificar-cuenta");
        ReflectionTestUtils.setField(emailService, "resetBaseUrl",
                "http://localhost:3000/restablecer-contrasena");
        ReflectionTestUtils.setField(emailService, "changeConfirmBaseUrl",
                "http://localhost:3000/confirmar-cambio");

        logAppender = new ListAppender<>();
        logAppender.start();
        Logger logger = (Logger) LoggerFactory.getLogger(EmailService.class);
        logger.addAppender(logAppender);
    }

    private Usuario usuario() {
        return Usuario.builder()
                .correoElectronico("joseph_rojas82231@elpoli.edu.co")
                .verificationToken("verify-token")
                .resetToken("reset-token")
                .cambioToken("change-token")
                .build();
    }

    @Test
    @DisplayName("captura el correo de verificacion")
    void shouldCaptureVerificationEmail() {
        emailService.sendVerificationEmail(usuario());

        assertThat(simulatedEmailStore.findAll().get(0).to()).isEqualTo("joseph_rojas82231@elpoli.edu.co");
        assertThat(simulatedEmailStore.findAll().get(0).subject()).isEqualTo("Confirma tu cuenta tutorNow");
        assertThat(simulatedEmailStore.findAll().get(0).link())
                .isEqualTo("http://localhost:3000/verificar-cuenta?token=verify-token");
        assertThat(simulatedEmailStore.findAll().get(0).kind()).isEqualTo("verification");
    }

    @Test
    @DisplayName("captura el correo de recuperacion de contrasena")
    void shouldCapturePasswordResetEmail() {
        emailService.sendPasswordResetEmail(usuario());

        assertThat(simulatedEmailStore.findAll().get(0).kind()).isEqualTo("password_reset");
        assertThat(simulatedEmailStore.findAll().get(0).link())
                .isEqualTo("http://localhost:3000/restablecer-contrasena?token=reset-token");
    }

    @Test
    @DisplayName("captura la confirmacion de cambio de contrasena")
    void shouldCapturePasswordChangeConfirmation() {
        emailService.sendPasswordChangeConfirmationEmail(usuario());

        assertThat(simulatedEmailStore.findAll().get(0).kind()).isEqualTo("password_change_confirmation");
        assertThat(simulatedEmailStore.findAll().get(0).link())
                .isEqualTo("http://localhost:3000/confirmar-cambio?token=change-token");
    }

    @Test
    @DisplayName("captura la notificacion de nuevo mensaje")
    void shouldCaptureNewMessageNotification() {
        emailService.sendNewMessageNotification(usuario(), "Andres Tutor", "Hola, vemos la asesoria el viernes", 5L);

        assertThat(simulatedEmailStore.findAll().get(0).kind()).isEqualTo("new_message");
        assertThat(simulatedEmailStore.findAll().get(0).link())
                .isEqualTo("http://localhost:3000/tutoring/chats?chat=5");
        assertThat(simulatedEmailStore.findAll().get(0).content())
                .isEqualTo("Nuevo mensaje de Andres Tutor: Hola, vemos la asesoria el viernes");
    }

    @Test
    @DisplayName("mantiene la linea de consola [EMAIL SIMULADO] en el log")
    void shouldKeepEmailSimuladoLogLine() {
        emailService.sendVerificationEmail(usuario());

        ILoggingEvent event = logAppender.list.get(0);
        assertThat(event.getLevel()).isEqualTo(Level.INFO);
        assertThat(event.getFormattedMessage()).isEqualTo(
                "[EMAIL SIMULADO] Para: joseph_rojas82231@elpoli.edu.co"
                        + " | Asunto: Confirma tu cuenta tutorNow"
                        + " | Enlace de verificacion: http://localhost:3000/verificar-cuenta?token=verify-token");
    }

    @Test
    @DisplayName("no interrumpe el envio si la captura falla")
    void shouldNotBreakSendingWhenStoreCaptureFails() {
        doThrow(new IllegalStateException("capture failure")).when(failingStore).add(
                any(), any(), any(), any(), any());

        emailService = new EmailService(failingStore);
        ReflectionTestUtils.setField(emailService, "verificationBaseUrl",
                "http://localhost:3000/verificar-cuenta");
        ReflectionTestUtils.setField(emailService, "resetBaseUrl",
                "http://localhost:3000/restablecer-contrasena");
        ReflectionTestUtils.setField(emailService, "changeConfirmBaseUrl",
                "http://localhost:3000/confirmar-cambio");

        assertThatCode(() -> emailService.sendVerificationEmail(usuario())).doesNotThrowAnyException();
        assertThatCode(() -> emailService.sendPasswordResetEmail(usuario())).doesNotThrowAnyException();
        assertThatCode(() -> emailService.sendPasswordChangeConfirmationEmail(usuario())).doesNotThrowAnyException();
        assertThatCode(() -> emailService.sendNewMessageNotification(usuario(), "Andres", "Hola", 1L))
                .doesNotThrowAnyException();
    }
}
