package co.edu.epi.tutornow.dev;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SimulatedEmailStore")
class SimulatedEmailStoreTest {

    private final SimulatedEmailStore store = new SimulatedEmailStore();

    @Test
    @DisplayName("guarda los correos con el mas reciente primero")
    void shouldKeepNewestFirst() {
        store.add("a@elpoli.edu.co", "Asunto 1", "Contenido 1",
                "http://localhost:3000/verificar-cuenta?token=1", "verification");
        store.add("b@elpoli.edu.co", "Asunto 2", "Contenido 2",
                "http://localhost:3000/restablecer-contrasena?token=2", "password_reset");

        List<SimulatedEmail> emails = store.findAll();

        assertThat(emails.get(0).to()).isEqualTo("b@elpoli.edu.co");
        assertThat(emails.get(1).to()).isEqualTo("a@elpoli.edu.co");
    }

    @Test
    @DisplayName("limita el historial a los 50 correos mas recientes")
    void shouldKeepOnlyLatestFifty() {
        for (int i = 0; i < 60; i++) {
            store.add("u" + i + "@elpoli.edu.co", "Asunto " + i, "Contenido " + i,
                    "http://localhost:3000/verificar-cuenta?token=" + i, "verification");
        }

        List<SimulatedEmail> emails = store.findAll();

        assertThat(emails).hasSize(50);
        assertThat(emails.get(0).to()).isEqualTo("u59@elpoli.edu.co");
        assertThat(emails.get(49).to()).isEqualTo("u10@elpoli.edu.co");
    }

    @Test
    @DisplayName("registra el correo completo con fecha")
    void shouldRecordEveryField() {
        store.add("joseph_rojas82231@elpoli.edu.co", "Confirma tu cuenta tutorNow", "Enlace de verificacion",
                "http://localhost:3000/verificar-cuenta?token=abc", "verification");

        SimulatedEmail email = store.findAll().get(0);

        assertThat(email.to()).isEqualTo("joseph_rojas82231@elpoli.edu.co");
        assertThat(email.subject()).isEqualTo("Confirma tu cuenta tutorNow");
        assertThat(email.content()).isEqualTo("Enlace de verificacion");
        assertThat(email.link()).isEqualTo("http://localhost:3000/verificar-cuenta?token=abc");
        assertThat(email.kind()).isEqualTo("verification");
        assertThat(email.createdAt()).isNotNull();
    }
}
