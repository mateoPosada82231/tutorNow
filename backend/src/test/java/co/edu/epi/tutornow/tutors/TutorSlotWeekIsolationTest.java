package co.edu.epi.tutornow.tutors;

import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S5: weeks are independent. Saving one week must never touch the others,
 * and every slot is served with its semanaInicio (own slots and public profile).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("S5: horarios distintos por semana")
class TutorSlotWeekIsolationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;
    @Autowired JwtService jwtService;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired TutorRepository tutorRepository;

    private String token;
    private Tutor tutor;
    private LocalDate semanaActual;
    private LocalDate semanaSiguiente;
    private LocalDate semanaMasSiguiente;

    @BeforeEach
    void seed() {
        semanaActual = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        semanaSiguiente = semanaActual.plusWeeks(1);
        semanaMasSiguiente = semanaActual.plusWeeks(2);

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .correoElectronico("tutor.semanas@elpoli.edu.co").contrasena("hash")
                .nombreCompleto("Tutor Semanas").rol(Rol.TUTOR)
                .verificado(true).activo(true).build());
        tutor = tutorRepository.save(Tutor.builder()
                .usuario(usuario).biografia("Bio de prueba")
                .materias(new java.util.HashSet<>()).build());
        token = jwtService.generateAccessToken(usuario.getCorreoElectronico());
    }

    private String iso(LocalDate date) {
        return date.toString();
    }

    private void guardarSemana(LocalDate semana, String... slots) throws Exception {
        StringBuilder bloques = new StringBuilder();
        for (String slot : slots) {
            if (bloques.length() > 0) {
                bloques.append(',');
            }
            String[] partes = slot.split("/");
            bloques.append("{\"diaSemana\":\"").append(partes[0])
                    .append("\",\"horaInicio\":\"").append(partes[1]).append(":00\"}");
        }
        String body = "{\"semanaInicio\":\"" + iso(semana) + "\",\"slots\":[" + bloques + "]}";

        mockMvc.perform(put("/api/v1/tutors/me/slots")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    private List<JsonNode> misSlots() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/tutors/me/slots")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode array = om.readTree(result.getResponse().getContentAsString());
        assertThat(array.isArray()).isTrue();
        List<JsonNode> nodes = new java.util.ArrayList<>();
        array.forEach(nodes::add);
        return nodes;
    }

    @Test
    @DisplayName("Guardar una semana no toca las demas y el mismo dia/hora cabe en dos semanas")
    void savingOneWeekDoesNotTouchTheOthers() throws Exception {
        guardarSemana(semanaActual, "LUNES/08:00");
        guardarSemana(semanaSiguiente, "LUNES/08:00", "MARTES/09:00");

        List<JsonNode> slots = misSlots();
        assertThat(slots).hasSize(3);

        // Replace the current week with an empty week: next week must survive.
        guardarSemana(semanaActual);

        List<JsonNode> restantes = misSlots();
        assertThat(restantes).hasSize(2);
        assertThat(restantes)
                .allMatch(n -> n.path("semanaInicio").asText().equals(iso(semanaSiguiente)));
        assertThat(restantes)
                .extracting(n -> n.path("diaSemana").asText())
                .containsExactlyInAnyOrder("LUNES", "MARTES");
    }

    @Test
    @DisplayName("Cada slot responde con su semanaInicio (tutor y perfil publico)")
    void everySlotCarriesItsWeek() throws Exception {
        guardarSemana(semanaActual, "LUNES/08:00");
        guardarSemana(semanaMasSiguiente, "VIERNES/10:00");

        List<JsonNode> slots = misSlots();
        assertThat(slots).hasSize(2);
        assertThat(slots)
                .extracting(n -> n.path("semanaInicio").asText())
                .containsExactlyInAnyOrder(iso(semanaActual), iso(semanaMasSiguiente));

        MvcResult perfil = mockMvc.perform(get("/api/v1/tutors/" + tutor.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode disponibilidad = om.readTree(perfil.getResponse().getContentAsString())
                .path("disponibilidad");
        assertThat(disponibilidad.size()).isEqualTo(2);
        List<String> semanas = new java.util.ArrayList<>();
        disponibilidad.forEach(n -> semanas.add(n.path("semanaInicio").asText()));
        assertThat(semanas).containsExactlyInAnyOrder(iso(semanaActual), iso(semanaMasSiguiente));
    }

    @Test
    @DisplayName("Sin semanaInicio el guardado usa la semana actual")
    void defaultsToCurrentWeekWhenMissing() throws Exception {
        String body = "{\"slots\":[{\"diaSemana\":\"LUNES\",\"horaInicio\":\"08:00\"}]}";
        mockMvc.perform(put("/api/v1/tutors/me/slots")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        List<JsonNode> slots = misSlots();
        assertThat(slots).hasSize(1);
        assertThat(slots.get(0).path("semanaInicio").asText()).isEqualTo(iso(semanaActual));
    }
}
