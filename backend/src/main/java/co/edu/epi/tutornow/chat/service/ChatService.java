package co.edu.epi.tutornow.chat.service;

import co.edu.epi.tutornow.chat.dto.ChatResumenResponse;
import co.edu.epi.tutornow.chat.dto.EmisorBriefResponse;
import co.edu.epi.tutornow.chat.dto.EnviarMensajeRequest;
import co.edu.epi.tutornow.chat.dto.MensajeResponse;
import co.edu.epi.tutornow.chat.dto.MensajesPageResponse;
import co.edu.epi.tutornow.chat.event.MensajeEnviadoEvent;
import co.edu.epi.tutornow.chat.model.ChatLectura;
import co.edu.epi.tutornow.chat.model.ChatLecturaId;
import co.edu.epi.tutornow.chat.model.Mensaje;
import co.edu.epi.tutornow.chat.repository.ChatLecturaRepository;
import co.edu.epi.tutornow.chat.repository.MensajeRepository;
import co.edu.epi.tutornow.chat.stream.ChatStreamService;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatPort;
import co.edu.epi.tutornow.tutorial.port.AsesoriaChatResumen;
import co.edu.epi.tutornow.tutorial.port.ParticipanteAsesoria;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int DEFAULT_PAGE_SIZE = 30;
    private static final int MAX_PAGE_SIZE = 50;

    private final MensajeRepository mensajeRepository;
    private final ChatLecturaRepository chatLecturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsesoriaChatPort asesoriaChatPort;
    private final ChatStreamService chatStreamService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<ChatResumenResponse> listar(String correo) {
        Usuario usuario = usuarioActual(correo);
        List<AsesoriaChatResumen> resumenes = asesoriaChatPort.listarPorUsuario(usuario.getId());
        if (resumenes.isEmpty()) {
            return List.of();
        }

        List<Long> asesoriaIds = resumenes.stream().map(AsesoriaChatResumen::asesoriaId).toList();
        Map<Long, Long> noLeidos = new HashMap<>();
        for (Object[] fila : mensajeRepository.countNoLeidos(asesoriaIds, usuario.getId())) {
            noLeidos.put((Long) fila[0], ((Number) fila[1]).longValue());
        }

        Comparator<ChatResumenResponse> porActividad = Comparator
                .<ChatResumenResponse, OffsetDateTime>comparing(
                        ChatResumenResponse::getUltimoMensajeAt,
                        Comparator.nullsLast(Comparator.<OffsetDateTime>reverseOrder()))
                .thenComparing(ChatResumenResponse::getAsesoriaId, Comparator.<Long>reverseOrder());

        return resumenes.stream()
                .map(resumen -> toChatResumen(usuario.getId(), resumen,
                        noLeidos.getOrDefault(resumen.asesoriaId(), 0L)))
                .sorted(porActividad)
                .toList();
    }

    @Transactional(readOnly = true)
    public MensajesPageResponse historial(String correo, Long asesoriaId, Long before, Integer size) {
        Usuario usuario = usuarioActual(correo);
        asesoriaChatPort.requireParticipante(asesoriaId, usuario.getId());

        int pageSize = normalizarTamano(size);
        Pageable pageable = PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<Mensaje> page = before == null
                ? mensajeRepository.findByAsesoriaIdOrderByIdDesc(asesoriaId, pageable)
                : mensajeRepository.findByAsesoriaIdAndIdLessThanOrderByIdDesc(asesoriaId, before, pageable);

        List<MensajeResponse> data = page.getContent().stream()
                .map(this::toMensajeResponse)
                .toList()
                .reversed();
        Long nextBefore = page.hasNext() && !data.isEmpty() ? data.get(0).getId() : null;

        return MensajesPageResponse.builder()
                .data(data)
                .pagination(MensajesPageResponse.Pagination.builder()
                        .size(data.size())
                        .hasMore(page.hasNext())
                        .nextBefore(nextBefore)
                        .build())
                .build();
    }

    @Transactional
    public MensajeResponse enviar(String correo, Long asesoriaId, EnviarMensajeRequest request) {
        Usuario usuario = usuarioActual(correo);
        ParticipanteAsesoria participante = asesoriaChatPort.requireParticipante(asesoriaId, usuario.getId());
        if (participante.estaCancelada()) {
            throw new ConflictException("La asesoria fue cancelada");
        }
        if (!participante.permiteEscritura()) {
            throw new ConflictException("La asesoria ya finalizo; el chat es de solo lectura");
        }

        String contenido = request.getContenido() == null ? "" : request.getContenido().trim();
        if (contenido.isEmpty()) {
            throw new IllegalArgumentException("El mensaje no puede estar vacio");
        }

        return mensajeRepository
                .findByAsesoriaIdAndClientMessageId(asesoriaId, request.getClientMessageId())
                .map(this::toMensajeResponse)
                .orElseGet(() -> guardarMensaje(asesoriaId, usuario, participante, contenido,
                        request.getClientMessageId()));
    }

    @Transactional
    public void marcarLeido(String correo, Long asesoriaId, Long ultimoMensajeId) {        Usuario usuario = usuarioActual(correo);
        asesoriaChatPort.requireParticipante(asesoriaId, usuario.getId());

        ChatLecturaId id = new ChatLecturaId(asesoriaId, usuario.getId());
        ChatLectura lectura = chatLecturaRepository.findById(id)
                .orElseGet(() -> ChatLectura.builder().id(id).build());

        if (lectura.getUltimoLeidoId() != null && lectura.getUltimoLeidoId() >= ultimoMensajeId) {
            return;
        }
        lectura.setUltimoLeidoId(ultimoMensajeId);
        lectura.setUpdatedAt(OffsetDateTime.now());
        chatLecturaRepository.save(lectura);
    }

    public SseEmitter suscribir(String correo) {
        Usuario usuario = usuarioActual(correo);
        return chatStreamService.suscribir(usuario.getId());
    }

    private MensajeResponse guardarMensaje(
            Long asesoriaId,
            Usuario emisor,
            ParticipanteAsesoria participante,
            String contenido,
            String clientMessageId) {
        Mensaje mensaje = Mensaje.builder()
                .asesoria(Asesoria.builder().id(asesoriaId).build())
                .emisor(emisor)
                .contenido(contenido)
                .clientMessageId(clientMessageId)
                .build();
        Mensaje guardado = mensajeRepository.save(mensaje);
        MensajeResponse response = toMensajeResponse(guardado);
        eventPublisher.publishEvent(new MensajeEnviadoEvent(
                asesoriaId,
                participante.estudianteId(),
                participante.tutorUsuarioId(),
                response));
        return response;
    }

    private ChatResumenResponse toChatResumen(Long usuarioId, AsesoriaChatResumen resumen, long noLeidos) {
        boolean esEstudiante = resumen.estudianteId().equals(usuarioId);
        EmisorBriefResponse contraparte = esEstudiante
                ? EmisorBriefResponse.builder()
                        .id(resumen.tutorUsuarioId())
                        .fullName(resumen.tutorNombre())
                        .build()
                : EmisorBriefResponse.builder()
                        .id(resumen.estudianteId())
                        .fullName(resumen.estudianteNombre())
                        .build();
        Mensaje ultimo = mensajeRepository
                .findFirstByAsesoriaIdOrderByIdDesc(resumen.asesoriaId())
                .orElse(null);

        return ChatResumenResponse.builder()
                .asesoriaId(resumen.asesoriaId())
                .contraparte(contraparte)
                .materia(resumen.materia())
                .tema(resumen.tema())
                .estado(resumen.estado().name())
                .permiteEscritura(resumen.estado() == EstadoAsesoria.PENDIENTE)
                .ultimoMensaje(ultimo == null ? null : ultimo.getContenido())
                .ultimoMensajeAt(ultimo == null ? null : ultimo.getCreatedAt())
                .noLeidos(noLeidos)
                .build();
    }

    private MensajeResponse toMensajeResponse(Mensaje mensaje) {
        return MensajeResponse.builder()
                .id(mensaje.getId())
                .asesoriaId(mensaje.getAsesoria().getId())
                .emisor(EmisorBriefResponse.builder()
                        .id(mensaje.getEmisor().getId())
                        .fullName(mensaje.getEmisor().getNombreCompleto())
                        .build())
                .contenido(mensaje.getContenido())
                .createdAt(mensaje.getCreatedAt())
                .build();
    }

    private Usuario usuarioActual(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private int normalizarTamano(Integer size) {
        if (size == null) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }
}
