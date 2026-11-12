package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Audiencia de tutores en las publicaciones")
class SolicitudAudienciaIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;
    @Autowired JwtService jwtService;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired TutorRepository tutorRepository;
    @Autowired MateriaRepository materiaRepository;
    @Autowired SolicitudAsesoriaRepository solicitudRepository;

    private String token(Usuario u) {
        return jwtService.generateAccessToken(u.getCorreoElectronico());
    }

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    private List<Long> idsEnFeed(Usuario u) throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/tutoring-requests")
                        .header("Authorization", "Bearer " + token(u)))
                .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        List<Long> ids = new ArrayList<>();
        json(r).path("data").forEach(n -> ids.add(n.path("id").asLong()));
        return ids;
    }

    private Usuario crearUsuario(String correo, Rol rol) {
        return usuarioRepository.save(Usuario.builder()
                .correoElectronico(correo).contrasena("hash").nombreCompleto("Nombre " + correo)
                .rol(rol).verificado(true).activo(true).build());
    }

    private Materia crearMateria(String nombre) {
        return materiaRepository.save(Materia.builder()
                .nombre(nombre).activa(true).createdAt(OffsetDateTime.now()).build());
    }

    private Tutor crearTutor(Usuario u, Set<Materia> materias) {
        return tutorRepository.save(Tutor.builder()
                .usuario(u).biografia("Bio de prueba").materias(materias).build());
    }

    private Long publicar(Usuario estudiante, Materia materia, List<Long> tutorIds) throws Exception {
        String body = om.writeValueAsString(java.util.Map.of(
                "materiaId", materia.getId(),
                "tema", "Ecuaciones diferenciales",
                "modalidad", "VIRTUAL",
                "disponibilidad", "Lunes y miercoles 2-4pm",
                "tutorIds", tutorIds));
        MvcResult r = mockMvc.perform(post("/api/v1/tutoring-requests")
                        .header("Authorization", "Bearer " + token(estudiante))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(201);
        return json(r).path("id").asLong();
    }

    @Test
    @DisplayName("Solo los tutores elegidos ven la publicacion en su feed (ambos query plans)")
    void soloLosTutoresDeLaAudienciaLaVenEnElFeed() throws Exception {
        Usuario estudiante = crearUsuario("est.aud1@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia materia = crearMateria("Calculo Diferencial");
        // tutorA con materias usa findFilteredPrioritized; tutorB sin materias usa findFiltered
        Tutor tutorA = crearTutor(crearUsuario("tut.a1@elpoli.edu.co", Rol.TUTOR), Set.of(materia));
        Tutor tutorB = crearTutor(crearUsuario("tut.b1@elpoli.edu.co", Rol.TUTOR), Set.of());

        Long solicitudId = publicar(estudiante, materia, List.of(tutorA.getId()));

        assertThat(idsEnFeed(tutorA.getUsuario())).contains(solicitudId);
        assertThat(idsEnFeed(tutorB.getUsuario())).doesNotContain(solicitudId);
    }

    @Test
    @DisplayName("Sin tutorIds la publicacion la ven todos los tutores")
    void sinAudienciaLaVeenTodos() throws Exception {
        Usuario estudiante = crearUsuario("est.aud2@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia materia = crearMateria("Fisica Mecanica");
        Tutor tutorA = crearTutor(crearUsuario("tut.a2@elpoli.edu.co", Rol.TUTOR), Set.of(materia));
        Tutor tutorB = crearTutor(crearUsuario("tut.b2@elpoli.edu.co", Rol.TUTOR), Set.of());

        Long solicitudId = publicar(estudiante, materia, List.of());

        assertThat(idsEnFeed(tutorA.getUsuario())).contains(solicitudId);
        assertThat(idsEnFeed(tutorB.getUsuario())).contains(solicitudId);
    }

    @Test
    @DisplayName("El detalle devuelve 403 para un tutor fuera de la audiencia y 200 para el elegido")
    void detalleBloqueadoFueraDeLaAudiencia() throws Exception {
        Usuario estudiante = crearUsuario("est.aud3@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia materia = crearMateria("Programacion");
        Tutor tutorA = crearTutor(crearUsuario("tut.a3@elpoli.edu.co", Rol.TUTOR), Set.of(materia));
        Tutor tutorB = crearTutor(crearUsuario("tut.b3@elpoli.edu.co", Rol.TUTOR), Set.of(materia));
        Long solicitudId = publicar(estudiante, materia, List.of(tutorA.getId()));

        MvcResult comoElegido = mockMvc.perform(get("/api/v1/tutoring-requests/" + solicitudId)
                        .header("Authorization", "Bearer " + token(tutorA.getUsuario())))
                .andReturn();
        assertThat(comoElegido.getResponse().getStatus()).isEqualTo(200);

        MvcResult comoNoElegido = mockMvc.perform(get("/api/v1/tutoring-requests/" + solicitudId)
                        .header("Authorization", "Bearer " + token(tutorB.getUsuario())))
                .andReturn();
        assertThat(comoNoElegido.getResponse().getStatus()).isEqualTo(403);
    }

    @Test
    @DisplayName("GET /tutors devuelve los tutores con sus materias para la seleccion")
    void listaTutoresParaSeleccion() throws Exception {
        Usuario estudiante = crearUsuario("est.aud4@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia materia = crearMateria("Algebra Lineal");
        Tutor tutor = crearTutor(crearUsuario("tut.a4@elpoli.edu.co", Rol.TUTOR), Set.of(materia));

        MvcResult r = mockMvc.perform(get("/api/v1/tutors")
                        .header("Authorization", "Bearer " + token(estudiante)))
                .andReturn();

        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        JsonNode data = json(r);
        assertThat(data.isArray()).isTrue();
        boolean encontrado = false;
        for (JsonNode n : data) {
            if (n.path("id").asLong() == tutor.getId()) {
                encontrado = true;
                assertThat(n.path("nombre").asText()).isNotBlank();
                assertThat(n.path("materias").get(0).path("label").asText())
                        .isEqualTo("Algebra Lineal");
            }
        }
        assertThat(encontrado).isTrue();
    }
}
