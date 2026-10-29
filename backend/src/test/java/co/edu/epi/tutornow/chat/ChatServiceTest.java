package co.edu.epi.tutornow.chat;

import co.edu.epi.tutornow.chat.dto.ChatResumenResponse;
import co.edu.epi.tutornow.chat.dto.EnviarMensajeRequest;
import co.edu.epi.tutornow.chat.dto.MensajeResponse;
import co.edu.epi.tutornow.chat.dto.MensajesPageResponse;
import co.edu.epi.tutornow.chat.event.MensajeEnviadoEvent;
import co.edu.epi.tutornow.chat.model.ChatLectura;
import co.edu.epi.tutornow.chat.model.ChatLecturaId;
import co.edu.epi.tutornow.chat.model.Mensaje;
import co.edu.epi.tutornow.chat.repository.ChatLecturaRepository;
import co.edu.epi.tutornow.chat.repository.MensajeRepository;
import co.edu.epi.tutornow.chat.service.ChatService;
import co.edu.epi.tutornow.chat.stream.ChatStreamService;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatPort;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatResumen;
import co.edu.epi.tutornow.tutorial.port.ParticipanteAsesoria;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService")
class ChatServiceTest {

    @Mock
    private MensajeRepository mensajeRepository;
    @Mock
    private ChatLecturaRepository chatLecturaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AsesoriaChatPort asesoriaChatPort;
    @Mock
    private ChatStreamService chatStreamService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ChatService chatService;

    private final Usuario estudiante = Usuario.builder().id(1L)
            .correoElectronico("joseph_rojas82231@elpoli.edu.co")
            .nombreCompleto("Joseph Rojas").rol(Rol.ESTUDIANTE).build();
    private final Usuario tutorUsuario = Usuario.builder().id(2L)
            .correoElectronico("andres_tutor1@elpoli.edu.co")
            .nombreCompleto("Andres Tutor").rol(Rol.TUTOR).build();

    private ParticipanteAsesoria pendiente;

    @BeforeEach
    void setUp() {
        pendiente = new ParticipanteAsesoria(20L, 1L, 2L, EstadoAsesoria.PENDIENTE);
    }

    private void stubUsuario(Usuario usuario) {
        when(usuarioRepository.findByCorreoElectronico(usuario.getCorreoElectronico()))
                .thenReturn(Optional.of(usuario));
    }

    @Nested
    @DisplayName("Enviar mensaje")
    class Enviar {

        @Test
        @DisplayName("El estudiante envia y se publica el evento de tiempo real")
        void estudianteEnvia() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            when(mensajeRepository.findByAsesoriaIdAndClientMessageId(20L, "c-1"))
                    .thenReturn(Optional.empty());
            when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> {
                Mensaje guardado = invocation.getArgument(0);
                guardado.setId(100L);
                return guardado;
            });

            MensajeResponse response = chatService.enviar(
                    estudiante.getCorreoElectronico(), 20L,
                    new EnviarMensajeRequest("  Hola, coordinemos la asesoria  ", "c-1"));

            assertThat(response.getId()).isEqualTo(100L);
            assertThat(response.getContenido()).isEqualTo("Hola, coordinemos la asesoria");
            assertThat(response.getAsesoriaId()).isEqualTo(20L);
            assertThat(response.getEmisor().getId()).isEqualTo(1L);
            assertThat(response.getEmisor().getFullName()).isEqualTo("Joseph Rojas");

            ArgumentCaptor<MensajeEnviadoEvent> evento = ArgumentCaptor.forClass(MensajeEnviadoEvent.class);
            verify(eventPublisher).publishEvent(evento.capture());
            assertThat(evento.getValue().asesoriaId()).isEqualTo(20L);
            assertThat(evento.getValue().estudianteId()).isEqualTo(1L);
            assertThat(evento.getValue().tutorUsuarioId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("El tutor tambien envia en una asesoria pendiente")
        void tutorEnvia() {
            stubUsuario(tutorUsuario);
            when(asesoriaChatPort.requireParticipante(20L, 2L)).thenReturn(pendiente);
            when(mensajeRepository.findByAsesoriaIdAndClientMessageId(20L, "c-2"))
                    .thenReturn(Optional.empty());
            when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> {
                Mensaje guardado = invocation.getArgument(0);
                guardado.setId(101L);
                return guardado;
            });

            MensajeResponse response = chatService.enviar(
                    tutorUsuario.getCorreoElectronico(), 20L,
                    new EnviarMensajeRequest("Perfecto", "c-2"));

            assertThat(response.getEmisor().getId()).isEqualTo(2L);
            assertThat(response.getContenido()).isEqualTo("Perfecto");
        }

        @Test
        @DisplayName("Reenviar el mismo clientMessageId no duplica ni republica")
        void idempotente() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            Mensaje existente = Mensaje.builder().id(55L).asesoria(Asesoria.builder().id(20L).build())
                    .emisor(estudiante).contenido("Hola").clientMessageId("c-1")
                    .createdAt(OffsetDateTime.now()).build();
            when(mensajeRepository.findByAsesoriaIdAndClientMessageId(20L, "c-1"))
                    .thenReturn(Optional.of(existente));

            MensajeResponse response = chatService.enviar(
                    estudiante.getCorreoElectronico(), 20L,
                    new EnviarMensajeRequest("Hola", "c-1"));

            assertThat(response.getId()).isEqualTo(55L);
            verify(mensajeRepository, never()).save(any(Mensaje.class));
            verify(eventPublisher, never()).publishEvent(any());
        }

        @Test
        @DisplayName("Una asesoria cancelada rechaza el envio (409)")
        void cancelada() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L))
                    .thenReturn(new ParticipanteAsesoria(20L, 1L, 2L, EstadoAsesoria.CANCELADA));

            assertThatThrownBy(() -> chatService.enviar(
                    estudiante.getCorreoElectronico(), 20L,
                    new EnviarMensajeRequest("Hola", "c-1")))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("cancelada");
            verify(mensajeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Una asesoria finalizada es de solo lectura (409)")
        void finalizada() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L))
                    .thenReturn(new ParticipanteAsesoria(20L, 1L, 2L, EstadoAsesoria.FINALIZADA));

            assertThatThrownBy(() -> chatService.enviar(
                    estudiante.getCorreoElectronico(), 20L,
                    new EnviarMensajeRequest("Hola", "c-1")))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("solo lectura");
            verify(mensajeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Un contenido en blanco no se guarda")
        void contenidoEnBlanco() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);

            assertThatThrownBy(() -> chatService.enviar(
                    estudiante.getCorreoElectronico(), 20L,
                    new EnviarMensajeRequest("     ", "c-1")))
                    .isInstanceOf(IllegalArgumentException.class);
            verify(mensajeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Historial")
    class Historial {

        private final Asesoria asesoria = Asesoria.builder().id(20L).build();

        private Mensaje mensaje(long id, Usuario emisor, String contenido) {
            return Mensaje.builder().id(id).asesoria(asesoria).emisor(emisor)
                    .contenido(contenido).clientMessageId("c-" + id)
                    .createdAt(OffsetDateTime.now()).build();
        }

        @Test
        @DisplayName("Devuelve los mensajes en orden cronologico y con cursor")
        void ordenCronologico() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            Page<Mensaje> page = new PageImpl<>(
                    List.of(mensaje(12L, tutorUsuario, "tercero"),
                            mensaje(11L, estudiante, "segundo"),
                            mensaje(10L, tutorUsuario, "primero")),
                    PageRequest.of(0, 30), 31);
            when(mensajeRepository.findByAsesoriaIdOrderByIdDesc(eq(20L), any(Pageable.class)))
                    .thenReturn(page);

            MensajesPageResponse response = chatService.historial(
                    estudiante.getCorreoElectronico(), 20L, null, 30);

            assertThat(response.getData()).extracting(MensajeResponse::getId)
                    .containsExactly(10L, 11L, 12L);
            assertThat(response.getPagination().isHasMore()).isTrue();
            assertThat(response.getPagination().getNextBefore()).isEqualTo(10L);
            assertThat(response.getPagination().getSize()).isEqualTo(3);
        }

        @Test
        @DisplayName("Con before usa el cursor hacia atras")
        void conCursor() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            Page<Mensaje> page = new PageImpl<>(List.of(mensaje(9L, estudiante, "noveno")));
            when(mensajeRepository.findByAsesoriaIdAndIdLessThanOrderByIdDesc(
                    eq(20L), eq(10L), any(Pageable.class))).thenReturn(page);

            MensajesPageResponse response = chatService.historial(
                    estudiante.getCorreoElectronico(), 20L, 10L, 30);

            assertThat(response.getData()).extracting(MensajeResponse::getId).containsExactly(9L);
            assertThat(response.getPagination().isHasMore()).isFalse();
            assertThat(response.getPagination().getNextBefore()).isNull();
        }

        @Test
        @DisplayName("El tamano de pagina se limita a 50")
        void tamanoLimitado() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            when(mensajeRepository.findByAsesoriaIdOrderByIdDesc(eq(20L), any(Pageable.class)))
                    .thenReturn(Page.empty());

            chatService.historial(estudiante.getCorreoElectronico(), 20L, null, 500);

            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            verify(mensajeRepository).findByAsesoriaIdOrderByIdDesc(eq(20L), captor.capture());
            assertThat(captor.getValue().getPageSize()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("Marcar leido")
    class MarcarLeido {

        @Test
        @DisplayName("Crea el registro cuando no existe")
        void sinRegistroPrevio() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            when(chatLecturaRepository.findById(new ChatLecturaId(20L, 1L))).thenReturn(Optional.empty());

            chatService.marcarLeido(estudiante.getCorreoElectronico(), 20L, 12L);

            ArgumentCaptor<ChatLectura> captor = ArgumentCaptor.forClass(ChatLectura.class);
            verify(chatLecturaRepository).save(captor.capture());
            assertThat(captor.getValue().getId().getAsesoriaId()).isEqualTo(20L);
            assertThat(captor.getValue().getId().getUsuarioId()).isEqualTo(1L);
            assertThat(captor.getValue().getUltimoLeidoId()).isEqualTo(12L);
        }

        @Test
        @DisplayName("El cursor nunca retrocede")
        void noRetrocede() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.requireParticipante(20L, 1L)).thenReturn(pendiente);
            ChatLectura lectura = ChatLectura.builder()
                    .id(new ChatLecturaId(20L, 1L))
                    .ultimoLeidoId(15L)
                    .updatedAt(OffsetDateTime.now())
                    .build();
            when(chatLecturaRepository.findById(new ChatLecturaId(20L, 1L)))
                    .thenReturn(Optional.of(lectura));

            chatService.marcarLeido(estudiante.getCorreoElectronico(), 20L, 8L);

            assertThat(lectura.getUltimoLeidoId()).isEqualTo(15L);
            verify(chatLecturaRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Listar hilos")
    class Listar {

        @Test
        @DisplayName("Compone contraparte, no leidos y permite escritura")
        void componeHilos() {
            stubUsuario(estudiante);
            AsesoriaChatResumen abierta = new AsesoriaChatResumen(
                    20L, 1L, "Joseph Rojas", 2L, "Andres Tutor",
                    "Calculo Diferencial", "Derivadas", EstadoAsesoria.PENDIENTE);
            AsesoriaChatResumen cerrada = new AsesoriaChatResumen(
                    21L, 1L, "Joseph Rojas", 3L, "Otra Tutora",
                    "Fisica", "Cinematica", EstadoAsesoria.FINALIZADA);
            when(asesoriaChatPort.listarPorUsuario(1L)).thenReturn(List.of(abierta, cerrada));
            when(mensajeRepository.countNoLeidos(anyList(), eq(1L)))
                    .thenReturn(List.<Object[]>of(new Object[]{20L, 3L}));
            when(mensajeRepository.findFirstByAsesoriaIdOrderByIdDesc(20L))
                    .thenReturn(Optional.of(Mensaje.builder().id(12L).contenido("Ultimo")
                            .createdAt(OffsetDateTime.now()).build()));
            when(mensajeRepository.findFirstByAsesoriaIdOrderByIdDesc(21L))
                    .thenReturn(Optional.empty());

            List<ChatResumenResponse> hilos = chatService.listar(estudiante.getCorreoElectronico());

            assertThat(hilos).hasSize(2);
            ChatResumenResponse primero = hilos.get(0);
            assertThat(primero.getAsesoriaId()).isEqualTo(20L);
            assertThat(primero.getContraparte().getId()).isEqualTo(2L);
            assertThat(primero.getContraparte().getFullName()).isEqualTo("Andres Tutor");
            assertThat(primero.getNoLeidos()).isEqualTo(3L);
            assertThat(primero.getUltimoMensaje()).isEqualTo("Ultimo");
            assertThat(primero.isPermiteEscritura()).isTrue();

            ChatResumenResponse segundo = hilos.get(1);
            assertThat(segundo.getAsesoriaId()).isEqualTo(21L);
            assertThat(segundo.getNoLeidos()).isZero();
            assertThat(segundo.isPermiteEscritura()).isFalse();
            assertThat(segundo.getUltimoMensaje()).isNull();
        }

        @Test
        @DisplayName("Para el tutor la contraparte es el estudiante")
        void contraparteDelTutor() {
            stubUsuario(tutorUsuario);
            AsesoriaChatResumen abierta = new AsesoriaChatResumen(
                    20L, 1L, "Joseph Rojas", 2L, "Andres Tutor",
                    "Calculo Diferencial", "Derivadas", EstadoAsesoria.PENDIENTE);
            when(asesoriaChatPort.listarPorUsuario(2L)).thenReturn(List.of(abierta));
            when(mensajeRepository.countNoLeidos(anyList(), eq(2L))).thenReturn(List.of());
            when(mensajeRepository.findFirstByAsesoriaIdOrderByIdDesc(20L)).thenReturn(Optional.empty());

            List<ChatResumenResponse> hilos = chatService.listar(tutorUsuario.getCorreoElectronico());

            assertThat(hilos.get(0).getContraparte().getId()).isEqualTo(1L);
            assertThat(hilos.get(0).getContraparte().getFullName()).isEqualTo("Joseph Rojas");
        }

        @Test
        @DisplayName("Sin asesorias no consulta mensajes")
        void sinAsesorias() {
            stubUsuario(estudiante);
            when(asesoriaChatPort.listarPorUsuario(1L)).thenReturn(List.of());

            assertThat(chatService.listar(estudiante.getCorreoElectronico())).isEmpty();
            verifyNoInteractions(mensajeRepository);
        }
    }
}
