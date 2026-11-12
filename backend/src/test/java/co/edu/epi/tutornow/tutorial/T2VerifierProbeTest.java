package co.edu.epi.tutornow.tutorial;

import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAudienciaTutorRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
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
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Independent verifier probes for S2 (T2): optional tutor audience selection.
 * Written by the verifier, not by the feature author.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class T2VerifierProbeTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;
    @Autowired JwtService jwtService;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired TutorRepository tutorRepository;
    @Autowired MateriaRepository materiaRepository;
    @Autowired SolicitudAsesoriaRepository solicitudRepository;
    @Autowired SolicitudAudienciaTutorRepository audienciaRepository;
    @Autowired PropuestaRepository propuestaRepository;

    private String token(Usuario u) {
        return jwtService.generateAccessToken(u.getCorreoElectronico());
    }

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
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

    private Tutor crearTutor(String correo, Set<Materia> materias) {
        return tutorRepository.save(Tutor.builder()
                .usuario(crearUsuario(correo, Rol.TUTOR)).biografia("Bio").materias(materias).build());
    }

    private List<Long> idsEnFeed(Usuario u) throws Exception {
        return idsEnFeed(u, null);
    }

    private List<Long> idsEnFeed(Usuario u, Long materiaId) throws Exception {
        String url = "/api/v1/tutoring-requests?size=50"
                + (materiaId == null ? "" : "&materiaId=" + materiaId);
        MvcResult r = mockMvc.perform(get(url)
                        .header("Authorization", "Bearer " + token(u))).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        List<Long> ids = new ArrayList<>();
        json(r).path("data").forEach(n -> ids.add(n.path("id").asLong()));
        System.out.println("PROBE feed user=" + u.getCorreoElectronico()
                + " materiaId=" + materiaId + " ids=" + ids);
        return ids;
    }

    private String cuerpo(Materia m, String tutorIdsJson) {
        String tema = "T2 probe " + UUID.randomUUID().toString().substring(0, 8);
        StringBuilder sb = new StringBuilder();
        sb.append("{\"materiaId\":").append(m.getId());
        sb.append(",\"tema\":\"").append(tema).append('"');
        sb.append(",\"modalidad\":\"VIRTUAL\"");
        sb.append(",\"disponibilidad\":\"Lunes y miercoles 2-4pm\"");
        if (tutorIdsJson != null) {
            sb.append(",\"tutorIds\":").append(tutorIdsJson);
        }
        sb.append('}');
        return sb.toString();
    }

    private MvcResult postPublicacion(Usuario est, Materia m, String tutorIdsJson) throws Exception {
        return mockMvc.perform(post("/api/v1/tutoring-requests")
                .header("Authorization", "Bearer " + token(est))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo(m, tutorIdsJson))).andReturn();
    }

    private long publicar(Usuario est, Materia m, String tutorIdsJson) throws Exception {
        MvcResult r = postPublicacion(est, m, tutorIdsJson);
        assertThat(r.getResponse().getStatus()).isEqualTo(201);
        return json(r).path("id").asLong();
    }

    private String digestSolicitudes() {
        return solicitudRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                .map(s -> s.getId() + ":" + s.getEstado() + ":" + s.getTema())
                .collect(Collectors.joining("|"));
    }

    // S2.3: feed solo de la audiencia, en ambos query plans, adicional a filtros de materia
    @Test
    void s2_3_feedSoloAudienciaEnAmbosPlanes() throws Exception {
        Usuario est = crearUsuario("vp1est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP1 Materia Uno");
        Materia m2 = crearMateria("VP1 Materia Dos");
        Tutor enAudienciaPriorizado = crearTutor("vp1a@elpoli.edu.co", Set.of(m1));
        Tutor enAudienciaSinMaterias = crearTutor("vp1b@elpoli.edu.co", Set.of());
        Tutor fueraConMatch = crearTutor("vp1c@elpoli.edu.co", Set.of(m1));
        Tutor fueraOtraMateria = crearTutor("vp1d@elpoli.edu.co", Set.of(m2));

        long id = publicar(est, m1,
                "[" + enAudienciaPriorizado.getId() + "," + enAudienciaSinMaterias.getId() + "]");

        // plan priorizado (tutor con materias): dentro de audiencia -> visible
        assertThat(idsEnFeed(enAudienciaPriorizado.getUsuario())).contains(id);
        // plan findFiltered (tutor sin materias): dentro de audiencia -> visible
        assertThat(idsEnFeed(enAudienciaSinMaterias.getUsuario())).contains(id);
        // materia coincide pero esta FUERA de la audiencia -> no visible (restriccion adicional)
        assertThat(idsEnFeed(fueraConMatch.getUsuario())).doesNotContain(id);
        // fuera de la audiencia en el plan priorizado -> no visible
        assertThat(idsEnFeed(fueraOtraMateria.getUsuario())).doesNotContain(id);
        // el filtro de materia existente sigue aplicando para el miembro de la audiencia
        assertThat(idsEnFeed(enAudienciaPriorizado.getUsuario(), m2.getId())).doesNotContain(id);
        assertThat(idsEnFeed(enAudienciaPriorizado.getUsuario(), m1.getId())).contains(id);
        // el estudiante dueno sigue viendo su publicacion en su propio feed
        assertThat(idsEnFeed(est)).contains(id);
    }

    // S2.2: sin tutorIds el comportamiento es identico al baseline (todos los tutores la ven)
    @Test
    void s2_2_sinAudienciaVisibleParaTodos() throws Exception {
        Usuario est = crearUsuario("vp2est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP2 Materia Uno");
        Tutor conMaterias = crearTutor("vp2a@elpoli.edu.co", Set.of(m1));
        Tutor sinMaterias = crearTutor("vp2b@elpoli.edu.co", Set.of());
        Tutor conOtraMateria = crearTutor("vp2c@elpoli.edu.co", Set.of(crearMateria("VP2 Materia Dos")));

        // variante A: campo tutorIds ausente (payload identico al baseline)
        long idSinCampo = publicar(est, m1, null);
        // variante B: tutorIds vacio (lo que envia el frontend nuevo sin seleccion)
        long idArrayVacio = publicar(est, m1, "[]");

        for (Tutor t : List.of(conMaterias, sinMaterias, conOtraMateria)) {
            List<Long> feed = idsEnFeed(t.getUsuario());
            assertThat(feed).contains(idSinCampo, idArrayVacio);
        }
        assertThat(idsEnFeed(est)).contains(idSinCampo, idArrayVacio);
    }

    // S2.6: detalle y propuestas 403 fuera de la audiencia, 200 dentro; y el rechazo no muta estado
    @Test
    void s2_6_detalleYPropuestas403() throws Exception {
        Usuario est = crearUsuario("vp3est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP3 Materia Uno");
        Tutor dentro = crearTutor("vp3a@elpoli.edu.co", Set.of(m1));
        Tutor fuera = crearTutor("vp3b@elpoli.edu.co", Set.of(m1));
        long id = publicar(est, m1, "[" + dentro.getId() + "]");

        // detalle: 200 dentro, 403 fuera, 200 el dueno
        MvcResult rDentro = mockMvc.perform(get("/api/v1/tutoring-requests/" + id)
                .header("Authorization", "Bearer " + token(dentro.getUsuario()))).andReturn();
        assertThat(rDentro.getResponse().getStatus()).isEqualTo(200);

        MvcResult rFuera = mockMvc.perform(get("/api/v1/tutoring-requests/" + id)
                .header("Authorization", "Bearer " + token(fuera.getUsuario()))).andReturn();
        assertThat(rFuera.getResponse().getStatus()).isEqualTo(403);
        assertThat(json(rFuera).path("message").asText())
                .isEqualTo("No tienes acceso a esta asesoria");

        MvcResult rDueno = mockMvc.perform(get("/api/v1/tutoring-requests/" + id)
                .header("Authorization", "Bearer " + token(est))).andReturn();
        assertThat(rDueno.getResponse().getStatus()).isEqualTo(200);

        // listado de propuestas: 403 fuera, 200 dentro
        MvcResult pFuera = mockMvc.perform(get("/api/v1/tutoring-requests/" + id + "/proposals")
                .header("Authorization", "Bearer " + token(fuera.getUsuario()))).andReturn();
        assertThat(pFuera.getResponse().getStatus()).isEqualTo(403);

        MvcResult pDentro = mockMvc.perform(get("/api/v1/tutoring-requests/" + id + "/proposals")
                .header("Authorization", "Bearer " + token(dentro.getUsuario()))).andReturn();
        assertThat(pDentro.getResponse().getStatus()).isEqualTo(200);

        // el rechazo no debe mutar nada
        String estadoAntes = solicitudRepository.findById(id).get().getEstado().name();
        long propuestasAntes = propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(id).size();
        assertThat(estadoAntes).isEqualTo("PUBLICADA");
        assertThat(propuestasAntes).isZero();

        // crear propuesta por un tutor FUERA de la audiencia: S2.6 exige 403
        MvcResult postFuera = mockMvc.perform(post("/api/v1/tutoring-requests/" + id + "/proposals")
                .header("Authorization", "Bearer " + token(fuera.getUsuario()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"mensaje\":\"propuesta de tutor fuera de audiencia\"}")).andReturn();
        System.out.println("PROBE POST-proposals fuera status=" + postFuera.getResponse().getStatus()
                + " body=" + postFuera.getResponse().getContentAsString());

        String estadoDespues = solicitudRepository.findById(id).get().getEstado().name();
        long propuestasDespues = propuestaRepository.findBySolicitudIdOrderByCreatedAtAsc(id).size();
        System.out.println("PROBE estado despues=" + estadoDespues
                + " propuestas=" + propuestasDespues);

        assertThat(postFuera.getResponse().getStatus())
                .as("POST /proposals de tutor fuera de la audiencia: esperado 403, body=%s",
                        postFuera.getResponse().getContentAsString())
                .isEqualTo(403);
        assertThat(estadoDespues)
                .as("un comando rechazado no debe mutar la solicitud")
                .isEqualTo("PUBLICADA");
        assertThat(propuestasDespues)
                .as("un comando rechazado no debe crear propuestas")
                .isZero();
    }

    // S2.4: GET /tutors devuelve id, nombre y materias (sin campos sensibles)
    @Test
    void s2_4_listaTutoresParaElSelector() throws Exception {
        Usuario est = crearUsuario("vp4est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP4 Materia Uno");
        Tutor conMaterias = crearTutor("vp4a@elpoli.edu.co", Set.of(m1));
        Tutor sinMaterias = crearTutor("vp4b@elpoli.edu.co", Set.of());

        MvcResult r = mockMvc.perform(get("/api/v1/tutors")
                .header("Authorization", "Bearer " + token(est))).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        JsonNode arr = json(r);
        assertThat(arr.isArray()).isTrue();

        JsonNode nCon = null;
        JsonNode nSin = null;
        for (JsonNode n : arr) {
            if (n.path("id").asLong() == conMaterias.getId()) nCon = n;
            if (n.path("id").asLong() == sinMaterias.getId()) nSin = n;
        }
        assertThat(nCon).as("el tutor con materias debe aparecer en GET /tutors").isNotNull();
        Set<String> campos = new LinkedHashSet<>();
        nCon.fieldNames().forEachRemaining(campos::add);
        assertThat(campos).containsExactlyInAnyOrder("id", "nombre", "materias");
        assertThat(nCon.path("nombre").asText()).isEqualTo("Nombre vp4a@elpoli.edu.co");
        assertThat(nCon.path("materias").isArray()).isTrue();
        assertThat(nCon.path("materias").get(0).path("label").asText()).isEqualTo("VP4 Materia Uno");
        assertThat(nCon.path("materias").get(0).path("id").asLong()).isEqualTo(m1.getId());

        assertThat(nSin).as("el tutor sin materias debe aparecer en GET /tutors").isNotNull();
        assertThat(nSin.path("materias").isArray()).isTrue();
        assertThat(nSin.path("materias").size()).isZero();

        // sin token: cualquierRequest autenticado
        MvcResult rAnon = mockMvc.perform(get("/api/v1/tutors")).andReturn();
        assertThat(rAnon.getResponse().getStatus()).isEqualTo(401);
    }

    // limites del campo tutorIds: 51 rechazado con 400 y mensaje exacto
    @Test
    void s2_limite51Rechazado() throws Exception {
        Usuario est = crearUsuario("vp5est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP5 Materia Uno");
        StringBuilder ids = new StringBuilder("[");
        for (int i = 1; i <= 51; i++) {
            if (i > 1) ids.append(',');
            ids.append(i);
        }
        ids.append(']');

        long solBefore = solicitudRepository.count();
        long audBefore = audienciaRepository.count();
        String digestBefore = digestSolicitudes();

        MvcResult r = postPublicacion(est, m1, ids.toString());
        assertThat(r.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(r).path("errors").path("tutorIds").asText())
                .isEqualTo("No puedes seleccionar mas de 50 tutores");
        // nada quedo persistido
        assertThat(solicitudRepository.count()).isEqualTo(solBefore);
        assertThat(audienciaRepository.count()).isEqualTo(audBefore);
        assertThat(digestSolicitudes()).isEqualTo(digestBefore);
    }

    // tutor inexistente -> 409 con mensaje exacto y estado de la BD intacto
    @Test
    void s2_tutorInexistente409SinCambiosDeEstado() throws Exception {
        Usuario est = crearUsuario("vp6est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP6 Materia Uno");
        // una publicacion previa legitima para comparar el estado
        long previa = publicar(est, m1, null);

        long solBefore = solicitudRepository.count();
        long audBefore = audienciaRepository.count();
        long propBefore = propuestaRepository.count();
        String digestBefore = digestSolicitudes();

        MvcResult r = postPublicacion(est, m1, "[999999999]");
        assertThat(r.getResponse().getStatus()).isEqualTo(409);
        assertThat(json(r).path("message").asText())
                .isEqualTo("Uno de los tutores seleccionados no existe");

        assertThat(solicitudRepository.count()).isEqualTo(solBefore);
        assertThat(audienciaRepository.count()).isEqualTo(audBefore);
        assertThat(propuestaRepository.count()).isEqualTo(propBefore);
        assertThat(digestSolicitudes()).isEqualTo(digestBefore);
        // la publicacion previa sigue intacta
        assertThat(solicitudRepository.findById(previa).get().getEstado().name())
                .isEqualTo("PUBLICADA");
    }

    // ids duplicados: un solo guardado (sin duplicar filas); nulos: sin audiencia
    @Test
    void s2_duplicadosYNulos() throws Exception {
        Usuario est = crearUsuario("vp7est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP7 Materia Uno");
        Tutor t = crearTutor("vp7a@elpoli.edu.co", Set.of(m1));

        long idDup = publicar(est, m1, "[" + t.getId() + "," + t.getId() + "]");
        long filasDup = audienciaRepository.findAll().stream()
                .filter(a -> a.getSolicitud().getId() == idDup).count();
        assertThat(filasDup).isEqualTo(1);

        // [null] se comporta como sin seleccion: 201 y sin filas de audiencia
        MvcResult rNull = postPublicacion(est, m1, "[null]");
        System.out.println("PROBE tutorIds=[null] status=" + rNull.getResponse().getStatus());
        assertThat(rNull.getResponse().getStatus()).isEqualTo(201);
        long idNull = json(rNull).path("id").asLong();
        long filasNull = audienciaRepository.findAll().stream()
                .filter(a -> a.getSolicitud().getId() == idNull).count();
        assertThat(filasNull).isZero();
    }

    // borde superior: exactamente 50 tutores aceptado con 201
    @Test
    void s2_limite50Aceptado() throws Exception {
        Usuario est = crearUsuario("vp8est@elpoli.edu.co", Rol.ESTUDIANTE);
        Materia m1 = crearMateria("VP8 Materia Uno");
        List<Long> ids50 = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            Tutor t = crearTutor("vp8t" + i + "@elpoli.edu.co", Set.of());
            ids50.add(t.getId());
        }
        String jsonIds = ids50.stream().map(String::valueOf).collect(Collectors.joining(",", "[", "]"));
        MvcResult r = postPublicacion(est, m1, jsonIds);
        assertThat(r.getResponse().getStatus()).isEqualTo(201);
        long id = json(r).path("id").asLong();
        long filas = audienciaRepository.findAll().stream()
                .filter(a -> a.getSolicitud().getId() == id).count();
        assertThat(filas).isEqualTo(50);
    }
}
