package co.edu.epi.tutornow.chat.stream;

import co.edu.epi.tutornow.chat.dto.MensajeResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatStreamService {

    private static final long TIMEOUT_MS = 30L * 60L * 1000L;

    private final Map<Long, Set<SseEmitter>> emisores = new ConcurrentHashMap<>();

    public SseEmitter suscribir(Long usuarioId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emisores.compute(usuarioId, (key, actuales) -> {
            Set<SseEmitter> suscripciones = actuales == null ? ConcurrentHashMap.newKeySet() : actuales;
            suscripciones.add(emitter);
            return suscripciones;
        });
        Runnable limpieza = () -> quitar(usuarioId, emitter);
        emitter.onCompletion(limpieza);
        emitter.onTimeout(limpieza);
        emitter.onError(error -> limpieza.run());
        try {
            emitter.send(SseEmitter.event().comment("conectado"));
        } catch (IOException ex) {
            quitar(usuarioId, emitter);
            emitter.completeWithError(ex);
        }
        return emitter;
    }

    public void emitirMensaje(Long usuarioId, MensajeResponse mensaje) {
        Set<SseEmitter> suscripciones = emisores.get(usuarioId);
        if (suscripciones == null || suscripciones.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : suscripciones) {
            try {
                emitter.send(SseEmitter.event()
                        .name("mensaje")
                        .data(mensaje, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException ex) {
                quitar(usuarioId, emitter);
                emitter.complete();
            }
        }
    }

    void quitar(Long usuarioId, SseEmitter emitter) {
        emisores.computeIfPresent(usuarioId, (key, suscripciones) -> {
            suscripciones.remove(emitter);
            return suscripciones.isEmpty() ? null : suscripciones;
        });
    }
}
