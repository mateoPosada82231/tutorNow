package co.edu.epi.tutornow.dev;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("DevInboxController")
class DevInboxControllerTest {

    private SimulatedEmailStore store;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        store = new SimulatedEmailStore();
        mockMvc = MockMvcBuilders.standaloneSetup(new DevInboxController(store)).build();
    }

    @Test
    @DisplayName("devuelve los correos simulados guardados")
    void shouldReturnStoredEmails() throws Exception {
        store.add("joseph_rojas82231@elpoli.edu.co", "Confirma tu cuenta tutorNow", "Enlace de verificacion",
                "http://localhost:3000/verificar-cuenta?token=abc", "verification");
        store.add("andres_tutor@elpoli.edu.co", "Recupera tu contrasena tutorNow (expira en 15 minutos)",
                "Enlace de recuperacion",
                "http://localhost:3000/restablecer-contrasena?token=def", "password_reset");

        mockMvc.perform(get("/api/v1/dev/inbox"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].to").value("andres_tutor@elpoli.edu.co"))
                .andExpect(jsonPath("$[0].subject").value("Recupera tu contrasena tutorNow (expira en 15 minutos)"))
                .andExpect(jsonPath("$[0].content").value("Enlace de recuperacion"))
                .andExpect(jsonPath("$[0].link").value("http://localhost:3000/restablecer-contrasena?token=def"))
                .andExpect(jsonPath("$[0].kind").value("password_reset"))
                .andExpect(jsonPath("$[0].createdAt").exists())
                .andExpect(jsonPath("$[1].kind").value("verification"));
    }

    @Test
    @DisplayName("devuelve una lista vacia cuando no hay correos")
    void shouldReturnEmptyListWhenNoEmails() throws Exception {
        mockMvc.perform(get("/api/v1/dev/inbox"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
