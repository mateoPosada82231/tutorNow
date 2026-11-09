package co.edu.epi.tutornow.admin;

import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Modalidad;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
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

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminPanelIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;
    @Autowired JwtService jwtService;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired TutorRepository tutorRepository;
    @Autowired MateriaRepository materiaRepository;
    @Autowired SolicitudAsesoriaRepository solicitudRepository;
    @Autowired PropuestaRepository propuestaRepository;
    @Autowired AsesoriaRepository asesoriaRepository;
    @Autowired ResenaRepository resenaRepository;
    @Autowired jakarta.persistence.EntityManager em;

    private void refrescar() {
        em.flush();
        em.clear();
    }

    private String token(Usuario u) {
        return jwtService.generateAccessToken(u.getCorreoElectronico());
    }

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    private List<Long> idsData(MvcResult r) throws Exception {
        List<Long> ids = new ArrayList<>();
        json(r).path("data").forEach(n -> ids.add(n.path("id").asLong()));
        return ids;
    }

    private Usuario crearUsuario(String correo, Rol rol, boolean activo) {
        return usuarioRepository.save(Usuario.builder()
                .correoElectronico(correo).contrasena("hash").nombreCompleto(correo)
                .rol(rol).verificado(true).activo(activo).build());
    }

    private Materia crearMateria(String nombre) {
        return materiaRepository.save(Materia.builder().nombre(nombre).activa(true).createdAt(java.time.OffsetDateTime.now()).build());
    }

    private Tutor crearTutor(Usuario u, Materia m) {
        Set<Materia> ms = new LinkedHashSet<>();
        ms.add(m);
        return tutorRepository.save(Tutor.builder().usuario(u).biografia("Bio de prueba").materias(ms).build());
    }

    private SolicitudAsesoria crearSolicitud(Usuario e, Materia m, EstadoSolicitud estado) {
        return solicitudRepository.save(SolicitudAsesoria.builder()
                .estudiante(e).materia(m).tema("Tema de prueba").modalidad(Modalidad.VIRTUAL)
                .disponibilidad("Lunes").descripcion("Descripcion de prueba").estado(estado).build());
    }

    private Resena crearResena(Asesoria a, Usuario autor, RolAutorResena rol, int rating, String comentario) {
        return resenaRepository.save(Resena.builder()
                .asesoria(a).autor(autor).rolAutor(rol).rating(rating).comentario(comentario).build());
    }

    // ================= A. Authorization boundary =================

    @Test
    @DisplayName("A1 listados admin: 403 para ESTUDIANTE/TUTOR, 200 para ADMIN")
    void adminListEndpointsRequireAdminRole() throws Exception {
        Usuario admin = crearUsuario("admin.a1@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.a1@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutor = crearUsuario("tut.a1@elpoli.edu.co", Rol.TUTOR, true);

        for (String p : new String[]{"/api/v1/admin/users", "/api/v1/admin/publications",
                "/api/v1/admin/reviews", "/api/v1/admin/reports"}) {
            assertThat(mockMvc.perform(get(p).header("Authorization", "Bearer " + token(estudiante)))
                    .andReturn().getResponse().getStatus())
                    .as("GET %s como ESTUDIANTE", p).isEqualTo(403);
            assertThat(mockMvc.perform(get(p).header("Authorization", "Bearer " + token(tutor)))
                    .andReturn().getResponse().getStatus())
                    .as("GET %s como TUTOR", p).isEqualTo(403);
            assertThat(mockMvc.perform(get(p).header("Authorization", "Bearer " + token(admin)))
                    .andReturn().getResponse().getStatus())
                    .as("GET %s como ADMIN", p).isEqualTo(200);
        }
    }

    @Test
    @DisplayName("A2 detalle admin: 403 para no ADMIN, 404 para ADMIN sin recurso")
    void adminDetailEndpointsRequireAdminRole() throws Exception {
        Usuario admin = crearUsuario("admin.a2@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.a2@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutor = crearUsuario("tut.a2@elpoli.edu.co", Rol.TUTOR, true);
        assertThat(mockMvc.perform(get("/api/v1/admin/reports/999999")
                .header("Authorization", "Bearer " + token(estudiante)))
                .andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mockMvc.perform(get("/api/v1/admin/reports/999999")
                .header("Authorization", "Bearer " + token(tutor)))
                .andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mockMvc.perform(get("/api/v1/admin/reports/999999")
                .header("Authorization", "Bearer " + token(admin)))
                .andReturn().getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    @DisplayName("A3 escrituras admin: 403 para no ADMIN")
    void adminWriteEndpointsRequireAdminRole() throws Exception {
        Usuario admin = crearUsuario("admin.a3@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.a3@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutor = crearUsuario("tut.a3@elpoli.edu.co", Rol.TUTOR, true);

        for (String p : new String[]{"/api/v1/admin/users/999999/revoke-tutor",
                "/api/v1/admin/users/999999/restore-tutor", "/api/v1/admin/users/999999/deactivate",
                "/api/v1/admin/users/999999/activate", "/api/v1/admin/users/999999/promote-admin",
                "/api/v1/admin/publications/999999/withdraw", "/api/v1/admin/reviews/999999/withdraw"}) {
            assertThat(mockMvc.perform(put(p).header("Authorization", "Bearer " + token(estudiante)))
                    .andReturn().getResponse().getStatus())
                    .as("PUT %s como ESTUDIANTE", p).isEqualTo(403);
            assertThat(mockMvc.perform(put(p).header("Authorization", "Bearer " + token(tutor)))
                    .andReturn().getResponse().getStatus())
                    .as("PUT %s como TUTOR", p).isEqualTo(403);
            assertThat(mockMvc.perform(put(p).header("Authorization", "Bearer " + token(admin)))
                    .andReturn().getResponse().getStatus())
                    .as("PUT %s como ADMIN", p).isEqualTo(404);
        }
        for (String p : new String[]{"/api/v1/admin/reports/999999/resolve", "/api/v1/admin/reports/999999/dismiss"}) {
            assertThat(mockMvc.perform(put(p).header("Authorization", "Bearer " + token(estudiante))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"resolucion\":\"motivo valido\"}"))
                    .andReturn().getResponse().getStatus())
                    .as("PUT %s como ESTUDIANTE", p).isEqualTo(403);
            assertThat(mockMvc.perform(put(p).header("Authorization", "Bearer " + token(tutor))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"resolucion\":\"motivo valido\"}"))
                    .andReturn().getResponse().getStatus())
                    .as("PUT %s como TUTOR", p).isEqualTo(403);
            assertThat(mockMvc.perform(put(p).header("Authorization", "Bearer " + token(admin))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"resolucion\":\"motivo valido\"}"))
                    .andReturn().getResponse().getStatus())
                    .as("PUT %s como ADMIN", p).isEqualTo(404);
        }
    }

    @Test
    @DisplayName("A4 token de usuario desactivado se rechaza con 401")
    void deactivatedUserTokenIsRejected() throws Exception {
        Usuario desactivado = crearUsuario("off.a4@elpoli.edu.co", Rol.ADMIN, false);
        Usuario activo = crearUsuario("on.a4@elpoli.edu.co", Rol.ESTUDIANTE, true);
        assertThat(mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + token(desactivado)))
                .andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token(desactivado)))
                .andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token(activo)))
                .andReturn().getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("A5 POST /api/v1/reports exige sesion pero NO rol ADMIN")
    void reportCreationIsUserSide() throws Exception {
        Usuario reportador = crearUsuario("rep.a5@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario objetivo = crearUsuario("obj.a5@elpoli.edu.co", Rol.ESTUDIANTE, true);
        String cuerpo = "{\"tipo\":\"USUARIO\",\"targetId\":" + objetivo.getId() + ",\"motivo\":\"contenido inappropriate\"}";
        assertThat(mockMvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(mockMvc.perform(post("/api/v1/reports").header("Authorization", "Bearer " + token(reportador))
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andReturn().getResponse().getStatus()).isEqualTo(201);
    }

    // ================= B. Moderation =================

    @Test
    @DisplayName("B1 publicacion retirada desaparece del listado y el detalle da 404")
    void withdrawnPublicationIsHiddenFromPublicReads() throws Exception {
        Usuario admin = crearUsuario("admin.b1@elpoli.edu.co", Rol.ADMIN, true);
        Usuario dueno = crearUsuario("dueno.b1@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutor = crearUsuario("tut.b1@elpoli.edu.co", Rol.TUTOR, true);
        Materia materia = crearMateria("Materia B1");
        crearTutor(tutor, materia);
        SolicitudAsesoria s = crearSolicitud(dueno, materia, EstadoSolicitud.PUBLICADA);

        MvcResult antes = mockMvc.perform(get("/api/v1/tutoring-requests")
                .header("Authorization", "Bearer " + token(tutor))).andReturn();
        assertThat(antes.getResponse().getStatus()).isEqualTo(200);
        assertThat(idsData(antes)).as("listado publico antes de retirar").contains(s.getId());

        MvcResult retiro = mockMvc.perform(put("/api/v1/admin/publications/" + s.getId() + "/withdraw")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(retiro.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(retiro).path("estadoModeracion").asText()).isEqualTo("RETIRADA");

        MvcResult despues = mockMvc.perform(get("/api/v1/tutoring-requests")
                .header("Authorization", "Bearer " + token(tutor))).andReturn();
        assertThat(idsData(despues)).as("listado publico despues de retirar").doesNotContain(s.getId());

        assertThat(mockMvc.perform(get("/api/v1/tutoring-requests/" + s.getId())
                .header("Authorization", "Bearer " + token(dueno)))
                .andReturn().getResponse().getStatus()).as("detalle del dueno").isEqualTo(404);
        assertThat(mockMvc.perform(get("/api/v1/tutoring-requests/" + s.getId())
                .header("Authorization", "Bearer " + token(tutor)))
                .andReturn().getResponse().getStatus()).as("detalle del tutor").isEqualTo(404);
    }

    @Test
    @DisplayName("B2 resena retirada se excluye del perfil publico del tutor (lista, promedio y conteo)")
    void withdrawnReviewIsExcludedFromPublicAggregates() throws Exception {
        Usuario admin = crearUsuario("admin.b2@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.b2@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutorUsuario = crearUsuario("tut.b2@elpoli.edu.co", Rol.TUTOR, true);
        Materia materia = crearMateria("Materia B2");
        Tutor tutor = crearTutor(tutorUsuario, materia);

        SolicitudAsesoria s = crearSolicitud(estudiante, materia, EstadoSolicitud.CONFIRMADA);
        Propuesta p = propuestaRepository.save(Propuesta.builder()
                .solicitud(s).tutor(tutor).mensaje("propuesta").estado(EstadoPropuesta.ACEPTADA).build());
        Asesoria a = asesoriaRepository.save(Asesoria.builder()
                .solicitud(s).propuesta(p).estudiante(estudiante).tutor(tutor)
                .estado(EstadoAsesoria.EVALUADA).build());
        Resena rEstudiante = crearResena(a, estudiante, RolAutorResena.ESTUDIANTE, 1, "Resena de la estudiante");
        crearResena(a, tutorUsuario, RolAutorResena.TUTOR, 5, "Resena del tutor");

        refrescar();
        MvcResult antes = mockMvc.perform(get("/api/v1/tutors/" + tutor.getId()).header("Authorization", "Bearer " + token(estudiante))).andReturn();
        assertThat(antes.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(antes).path("totalResenas").asLong()).as("total antes").isEqualTo(1L);
        assertThat(json(antes).path("promedioRating").asDouble()).as("promedio antes").isEqualTo(1.0d);
        assertThat(json(antes).path("resenas")).as("lista antes").hasSize(1);

        MvcResult retiro = mockMvc.perform(put("/api/v1/admin/reviews/" + rEstudiante.getId() + "/withdraw")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(retiro.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(retiro).path("estadoModeracion").asText()).isEqualTo("RETIRADA");

        refrescar();
        MvcResult despues = mockMvc.perform(get("/api/v1/tutors/" + tutor.getId()).header("Authorization", "Bearer " + token(estudiante))).andReturn();
        assertThat(despues.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(despues).path("resenas")).as("lista publica despues de retirar").isEmpty();
        assertThat(json(despues).path("totalResenas").asLong()).as("total despues").isEqualTo(0L);
        assertThat(json(despues).path("promedioRating").isNull()).as("promedio despues (null)").isTrue();

        MvcResult listaAdmin = mockMvc.perform(get("/api/v1/admin/users").param("rol", "TUTOR")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        JsonNode fila = null;
        for (JsonNode n : json(listaAdmin).path("data")) {
            if (n.path("id").asLong() == tutorUsuario.getId()) {
                fila = n;
            }
        }
        assertThat(fila).as("fila del tutor en el panel admin").isNotNull();
        assertThat(fila.path("tutorReviews").isNull() || fila.path("tutorReviews").path("reviewCount").asLong() == 0L)
                .as("resumen de resenas del tutor en el panel admin (sin resenas visibles)").isTrue();
    }

    @Test
    @DisplayName("B3 resena retirada NO debe filtrarse en el detalle de la asesoria")
    void withdrawnReviewMustNotLeakThroughAsesoriaDetail() throws Exception {
        Usuario admin = crearUsuario("admin.b3@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.b3@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutorUsuario = crearUsuario("tut.b3@elpoli.edu.co", Rol.TUTOR, true);
        Materia materia = crearMateria("Materia B3");
        Tutor tutor = crearTutor(tutorUsuario, materia);

        SolicitudAsesoria s = crearSolicitud(estudiante, materia, EstadoSolicitud.CONFIRMADA);
        Propuesta p = propuestaRepository.save(Propuesta.builder()
                .solicitud(s).tutor(tutor).mensaje("propuesta").estado(EstadoPropuesta.ACEPTADA).build());
        Asesoria a = asesoriaRepository.save(Asesoria.builder()
                .solicitud(s).propuesta(p).estudiante(estudiante).tutor(tutor)
                .estado(EstadoAsesoria.EVALUADA).build());
        Resena rEstudiante = crearResena(a, estudiante, RolAutorResena.ESTUDIANTE, 1, "COMENTARIO_INADECUADO");
        crearResena(a, tutorUsuario, RolAutorResena.TUTOR, 5, "Comentario del tutor");

        assertThat(mockMvc.perform(put("/api/v1/admin/reviews/" + rEstudiante.getId() + "/withdraw")
                .header("Authorization", "Bearer " + token(admin)))
                .andReturn().getResponse().getStatus()).isEqualTo(200);

        refrescar();
        MvcResult detalle = mockMvc.perform(get("/api/v1/tutoring-requests/" + s.getId())
                .header("Authorization", "Bearer " + token(tutorUsuario))).andReturn();
        assertThat(detalle.getResponse().getStatus()).isEqualTo(200);
        String cuerpo = detalle.getResponse().getContentAsString();
        assertThat(cuerpo).as("la resena retirada no debe aparecer en el detalle de la asesoria")
                .doesNotContain("COMENTARIO_INADECUADO");
    }

    @Test
    @DisplayName("B4 una publicacion retirada no admite nuevas propuestas")
    void withdrawnPublicationRejectsNewProposals() throws Exception {
        Usuario admin = crearUsuario("admin.b4@elpoli.edu.co", Rol.ADMIN, true);
        Usuario dueno = crearUsuario("dueno.b4@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutorUsuario = crearUsuario("tut.b4@elpoli.edu.co", Rol.TUTOR, true);
        Materia materia = crearMateria("Materia B4");
        crearTutor(tutorUsuario, materia);
        SolicitudAsesoria s = crearSolicitud(dueno, materia, EstadoSolicitud.PUBLICADA);

        assertThat(mockMvc.perform(put("/api/v1/admin/publications/" + s.getId() + "/withdraw")
                .header("Authorization", "Bearer " + token(admin)))
                .andReturn().getResponse().getStatus()).isEqualTo(200);

        MvcResult propuesta = mockMvc.perform(post("/api/v1/tutoring-requests/" + s.getId() + "/proposals")
                .header("Authorization", "Bearer " + token(tutorUsuario))
                .contentType(MediaType.APPLICATION_JSON).content("{\"mensaje\":\"quiero ayudarte\"}"))
                .andReturn();
        assertThat(propuesta.getResponse().getStatus())
                .as("POST propuesta a una publicacion ya retirada (estado=%s cuerpo=%s)",
                        propuesta.getResponse().getStatus(), propuesta.getResponse().getContentAsString())
                .isEqualTo(404);
    }

    @Test
    @DisplayName("B5 una publicacion retirada no puede convertirse en asesoria confirmada")
    void withdrawnPublicationCannotBeAccepted() throws Exception {
        Usuario admin = crearUsuario("admin.b5@elpoli.edu.co", Rol.ADMIN, true);
        Usuario dueno = crearUsuario("dueno.b5@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario tutorUsuario = crearUsuario("tut.b5@elpoli.edu.co", Rol.TUTOR, true);
        Materia materia = crearMateria("Materia B5");
        Tutor tutor = crearTutor(tutorUsuario, materia);
        SolicitudAsesoria s = crearSolicitud(dueno, materia, EstadoSolicitud.PUBLICADA);
        assertThat(mockMvc.perform(put("/api/v1/admin/publications/" + s.getId() + "/withdraw")
                .header("Authorization", "Bearer " + token(admin)))
                .andReturn().getResponse().getStatus()).isEqualTo(200);

        MvcResult nuevaPropuesta = mockMvc.perform(post("/api/v1/tutoring-requests/" + s.getId() + "/proposals")
                .header("Authorization", "Bearer " + token(tutorUsuario))
                .contentType(MediaType.APPLICATION_JSON).content("{\"mensaje\":\"quiero ayudarte\"}"))
                .andReturn();
        long pId = json(nuevaPropuesta).path("id").asLong();

        MvcResult acepta = mockMvc.perform(put("/api/v1/proposals/" + pId + "/accept")
                .header("Authorization", "Bearer " + token(dueno))).andReturn();
        assertThat(acepta.getResponse().getStatus())
                .as("aceptar propuesta de una publicacion retirada (estado=%s cuerpo=%s)",
                        acepta.getResponse().getStatus(), acepta.getResponse().getContentAsString())
                .isEqualTo(404);
    }

    // ================= C. Reversibility =================

    @Test
    @DisplayName("C1 revocar tutor es reversible mientras exista la fila tutores")
    void revokeTutorIsReversible() throws Exception {
        Usuario admin = crearUsuario("admin.c1@elpoli.edu.co", Rol.ADMIN, true);
        Usuario tutorUsuario = crearUsuario("tut.c1@elpoli.edu.co", Rol.TUTOR, true);
        Materia materia = crearMateria("Materia C1");
        crearTutor(tutorUsuario, materia);

        MvcResult revoca = mockMvc.perform(put("/api/v1/admin/users/" + tutorUsuario.getId() + "/revoke-tutor")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(revoca.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(revoca).path("role").asText()).isEqualTo("ESTUDIANTE");
        assertThat(json(revoca).path("hasTutorProfile").asBoolean()).isTrue();

        MvcResult restaura = mockMvc.perform(put("/api/v1/admin/users/" + tutorUsuario.getId() + "/restore-tutor")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(restaura.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(restaura).path("role").asText()).isEqualTo("TUTOR");
    }

    @Test
    @DisplayName("C2 restaurar tutor sin fila tutores devuelve 409")
    void restoreTutorWithoutProfileFails() throws Exception {
        Usuario admin = crearUsuario("admin.c2@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.c2@elpoli.edu.co", Rol.ESTUDIANTE, true);
        MvcResult r = mockMvc.perform(put("/api/v1/admin/users/" + estudiante.getId() + "/restore-tutor")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(409);
    }

    @Test
    @DisplayName("C3 desactivar usuario es reversible")
    void deactivateIsReversible() throws Exception {
        Usuario admin = crearUsuario("admin.c3@elpoli.edu.co", Rol.ADMIN, true);
        Usuario estudiante = crearUsuario("est.c3@elpoli.edu.co", Rol.ESTUDIANTE, true);
        MvcResult off = mockMvc.perform(put("/api/v1/admin/users/" + estudiante.getId() + "/deactivate")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(off.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(off).path("active").asBoolean()).isFalse();

        MvcResult on = mockMvc.perform(put("/api/v1/admin/users/" + estudiante.getId() + "/activate")
                .header("Authorization", "Bearer " + token(admin))).andReturn();
        assertThat(on.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(on).path("active").asBoolean()).isTrue();
    }

    // ================= D. Reports =================

    @Test
    @DisplayName("D1 crear reporte valida target, bloquea duplicados y filtra en el panel")
    void reportCreationValidatesTargetAndDuplicates() throws Exception {
        Usuario admin = crearUsuario("admin.d1@elpoli.edu.co", Rol.ADMIN, true);
        Usuario reportador = crearUsuario("rep.d1@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario objetivo = crearUsuario("obj.d1@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Materia materia = crearMateria("Materia D1");
        SolicitudAsesoria s = crearSolicitud(objetivo, materia, EstadoSolicitud.PUBLICADA);
        String tRep = token(reportador);

        MvcResult crea = mockMvc.perform(post("/api/v1/reports").header("Authorization", "Bearer " + tRep)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"USUARIO\",\"targetId\":" + objetivo.getId() + ",\"motivo\":\"spam\"}"))
                .andReturn();
        assertThat(crea.getResponse().getStatus()).isEqualTo(201);
        assertThat(json(crea).path("estado").asText()).isEqualTo("PENDIENTE");

        assertThat(mockMvc.perform(post("/api/v1/reports").header("Authorization", "Bearer " + tRep)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"USUARIO\",\"targetId\":" + objetivo.getId() + ",\"motivo\":\"spam\"}"))
                .andReturn().getResponse().getStatus()).as("duplicado pendiente").isEqualTo(409);

        assertThat(mockMvc.perform(post("/api/v1/reports").header("Authorization", "Bearer " + tRep)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"PUBLICACION\",\"targetId\":999999,\"motivo\":\"spam\"}"))
                .andReturn().getResponse().getStatus()).as("target inexistente").isEqualTo(404);

        assertThat(mockMvc.perform(post("/api/v1/reports").header("Authorization", "Bearer " + tRep)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"OTRO\",\"targetId\":" + s.getId() + ",\"motivo\":\"spam\"}"))
                .andReturn().getResponse().getStatus()).as("tipo invalido").isEqualTo(400);

        assertThat(mockMvc.perform(post("/api/v1/reports").header("Authorization", "Bearer " + tRep)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"PUBLICACION\",\"targetId\":" + s.getId() + ",\"motivo\":\"\"}"))
                .andReturn().getResponse().getStatus()).as("motivo vacio").isEqualTo(400);

        String tAdmin = token(admin);
        MvcResult todos = mockMvc.perform(get("/api/v1/admin/reports")
                .header("Authorization", "Bearer " + tAdmin)).andReturn();
        assertThat(json(todos).path("pagination").path("totalElements").asLong()).isEqualTo(1L);
        MvcResult resueltos = mockMvc.perform(get("/api/v1/admin/reports").param("estado", "RESUELTO")
                .header("Authorization", "Bearer " + tAdmin)).andReturn();
        assertThat(json(resueltos).path("pagination").path("totalElements").asLong()).isEqualTo(0L);
        MvcResult porTipo = mockMvc.perform(get("/api/v1/admin/reports").param("tipo", "USUARIO")
                .header("Authorization", "Bearer " + tAdmin)).andReturn();
        assertThat(json(porTipo).path("pagination").path("totalElements").asLong()).isEqualTo(1L);
    }

    @Test
    @DisplayName("D2 resolver y descartar guardan auditoria y no se reprocesan")
    void resolveAndDismissKeepAudit() throws Exception {
        Usuario admin = crearUsuario("admin.d2@elpoli.edu.co", Rol.ADMIN, true);
        Usuario reportador = crearUsuario("rep.d2@elpoli.edu.co", Rol.ESTUDIANTE, true);
        Usuario objetivo = crearUsuario("obj.d2@elpoli.edu.co", Rol.ESTUDIANTE, true);
        String tAdmin = token(admin);

        MvcResult creado = mockMvc.perform(post("/api/v1/reports")
                .header("Authorization", "Bearer " + token(reportador))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"USUARIO\",\"targetId\":" + objetivo.getId() + ",\"motivo\":\"spam\"}"))
                .andReturn();
        assertThat(creado.getResponse().getStatus()).isEqualTo(201);
        long id = json(creado).path("id").asLong();

        MvcResult detalle = mockMvc.perform(get("/api/v1/admin/reports/" + id)
                .header("Authorization", "Bearer " + tAdmin)).andReturn();
        assertThat(detalle.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(detalle).path("id").asLong()).isEqualTo(id);
        assertThat(json(detalle).path("target").path("autor").path("email").asText())
                .isEqualTo(objetivo.getCorreoElectronico());

        MvcResult resuelve = mockMvc.perform(put("/api/v1/admin/reports/" + id + "/resolve")
                .header("Authorization", "Bearer " + tAdmin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"resolucion\":\"Usuario notificado\"}"))
                .andReturn();
        assertThat(resuelve.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(resuelve).path("estado").asText()).isEqualTo("RESUELTO");
        assertThat(json(resuelve).path("resolucion").asText()).isEqualTo("Usuario notificado");
        assertThat(json(resuelve).path("resueltoPor").path("email").asText())
                .isEqualTo(admin.getCorreoElectronico());
        assertThat(json(resuelve).path("resueltoAt").isNull()).as("resueltoAt informado").isFalse();

        assertThat(mockMvc.perform(put("/api/v1/admin/reports/" + id + "/dismiss")
                .header("Authorization", "Bearer " + tAdmin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"resolucion\":\"Otra resolucion\"}"))
                .andReturn().getResponse().getStatus()).as("reprocesar").isEqualTo(409);

        MvcResult creado2 = mockMvc.perform(post("/api/v1/reports")
                .header("Authorization", "Bearer " + token(reportador))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"USUARIO\",\"targetId\":" + objetivo.getId() + ",\"motivo\":\"abuso\"}"))
                .andReturn();
        long id2 = json(creado2).path("id").asLong();
        MvcResult descarta = mockMvc.perform(put("/api/v1/admin/reports/" + id2 + "/dismiss")
                .header("Authorization", "Bearer " + tAdmin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"resolucion\":\"Sin accion\"}"))
                .andReturn();
        assertThat(descarta.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(descarta).path("estado").asText()).isEqualTo("DESCARTADO");
        assertThat(json(descarta).path("resolucion").asText()).isEqualTo("Sin accion");
        assertThat(json(descarta).path("resueltoPor").path("id").asLong()).isEqualTo(admin.getId());
        assertThat(json(descarta).path("resueltoAt").isNull()).as("resueltoAt informado").isFalse();
    }
}
