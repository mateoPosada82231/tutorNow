package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Verifier probe: the detail of a publication WITHOUT audience must produce
 * the same normalized output as at baseline 441b436.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class T2VerifierDetailParityTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;
    @Autowired JwtService jwtService;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired TutorRepository tutorRepository;
    @Autowired MateriaRepository materiaRepository;

    private String token(Usuario u) {
        return jwtService.generateAccessToken(u.getCorreoElectronico());
    }

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void detalleSinAudienciaIgualQueBaseline() throws Exception {
        Usuario est = usuarioRepository.save(Usuario.builder()
                .correoElectronico("pp1est@elpoli.edu.co").contrasena("hash")
                .nombreCompleto("Nombre pp1est@elpoli.edu.co").rol(Rol.ESTUDIANTE)
                .verificado(true).activo(true).build());
        Materia m1 = materiaRepository.save(Materia.builder()
                .nombre("PP1 Materia Uno").activa(true).createdAt(OffsetDateTime.now()).build());
        Tutor conMaterias = tutorRepository.save(Tutor.builder()
                .usuario(usuarioRepository.save(Usuario.builder()
                        .correoElectronico("pp1a@elpoli.edu.co").contrasena("hash")
                        .nombreCompleto("Nombre pp1a@elpoli.edu.co").rol(Rol.TUTOR)
                        .verificado(true).activo(true).build()))
                .biografia("Bio").materias(Set.of(m1)).build());
        Tutor sinMaterias = tutorRepository.save(Tutor.builder()
                .usuario(usuarioRepository.save(Usuario.builder()
                        .correoElectronico("pp1b@elpoli.edu.co").contrasena("hash")
                        .nombreCompleto("Nombre pp1b@elpoli.edu.co").rol(Rol.TUTOR)
                        .verificado(true).activo(true).build()))
                .biografia("Bio").materias(Set.of()).build());

        String body = "{\"materiaId\":" + m1.getId()
                + ",\"tema\":\"PAR probe " + UUID.randomUUID().toString().substring(0, 8) + "\""
                + ",\"modalidad\":\"VIRTUAL\""
                + ",\"disponibilidad\":\"Lunes y miercoles 2-4pm\"}";
        MvcResult post = mockMvc.perform(post("/api/v1/tutoring-requests")
                .header("Authorization", "Bearer " + token(est))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)).andReturn();
        assertThat(post.getResponse().getStatus()).isEqualTo(201);
        long id = json(post).path("id").asLong();

        MvcResult rDentro = mockMvc.perform(get("/api/v1/tutoring-requests/" + id)
                .header("Authorization", "Bearer " + token(conMaterias.getUsuario()))).andReturn();
        assertThat(rDentro.getResponse().getStatus()).isEqualTo(200);
        JsonNode d1 = json(rDentro);
        System.out.println("CHG detail tutorConMaterias estado=" + d1.path("estado").asText()
                + " propuestasCount=" + d1.path("propuestasCount").asInt()
                + " isProfileMatch=" + d1.path("isProfileMatch")
                + " isOwner=" + d1.path("isOwner").asBoolean()
                + " modalidad=" + d1.path("modalidad").asText()
                + " materia=" + d1.path("materia").path("label").asText());

        MvcResult rSin = mockMvc.perform(get("/api/v1/tutoring-requests/" + id)
                .header("Authorization", "Bearer " + token(sinMaterias.getUsuario()))).andReturn();
        assertThat(rSin.getResponse().getStatus()).isEqualTo(200);
        JsonNode d2 = json(rSin);
        System.out.println("CHG detail tutorSinMaterias estado=" + d2.path("estado").asText()
                + " propuestasCount=" + d2.path("propuestasCount").asInt()
                + " isProfileMatch=" + d2.path("isProfileMatch")
                + " isOwner=" + d2.path("isOwner").asBoolean()
                + " modalidad=" + d2.path("modalidad").asText()
                + " materia=" + d2.path("materia").path("label").asText());
    }
}