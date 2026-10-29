package co.edu.epi.tutornow.chat.stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ChatStreamService")
class ChatStreamServiceTest {

    private static final Class<?> HANDLER = cargarHandler();

    private final ChatStreamService servicio = new ChatStreamService();

    @Test
    @DisplayName("Al completarse el emisor se descarta")
    void completarDescarta() throws Exception {
        SseEmitter emitter = servicio.suscribir(1L);
        inicializar(emitter);

        emitter.complete();

        assertThat(suscripciones(1L)).isNullOrEmpty();
    }

    @Test
    @DisplayName("Al expirar el emisor se descarta")
    void timeoutDescarta() throws Exception {
        SseEmitter emitter = servicio.suscribir(1L);
        Callbacks callbacks = inicializar(emitter);

        callbacks.timeout.run();

        assertThat(suscripciones(1L)).isNullOrEmpty();
    }

    @Test
    @DisplayName("Al fallar el emisor se descarta")
    void errorDescarta() throws Exception {
        SseEmitter emitter = servicio.suscribir(1L);
        Callbacks callbacks = inicializar(emitter);

        callbacks.error.accept(new IllegalStateException("roto"));

        assertThat(suscripciones(1L)).isNullOrEmpty();
    }

    @Test
    @DisplayName("Limpiar un emisor viejo conserva el que sigue vivo")
    void limpiarViejoConservaVivo() throws Exception {
        SseEmitter viejo = servicio.suscribir(1L);
        SseEmitter nuevo = servicio.suscribir(1L);

        servicio.quitar(1L, viejo);

        assertThat(suscripciones(1L)).containsExactly(nuevo);
    }

    @Test
    @DisplayName("Suscripcion y limpieza concurrentes no pierden emisores vivos")
    void concurrenciaNoPierdeEmisores() throws Exception {
        Long usuarioId = 7L;
        int iteraciones = 20_000;
        CyclicBarrier barrera = new CyclicBarrier(3);
        AtomicInteger perdidos = new AtomicInteger();
        SseEmitter[] ultimo = new SseEmitter[1];
        SseEmitter[] anterior = new SseEmitter[1];

        Thread suscriptor = new Thread(() -> {
            for (int i = 0; i < iteraciones; i++) {
                esperar(barrera);
                ultimo[0] = servicio.suscribir(usuarioId);
                esperar(barrera);
            }
        });
        Thread limpiador = new Thread(() -> {
            for (int i = 0; i < iteraciones; i++) {
                esperar(barrera);
                if (anterior[0] != null) {
                    servicio.quitar(usuarioId, anterior[0]);
                }
                esperar(barrera);
                anterior[0] = ultimo[0];
            }
        });
        suscriptor.start();
        limpiador.start();
        try {
            for (int i = 0; i < iteraciones; i++) {
                esperar(barrera);
                esperar(barrera);
                Set<SseEmitter> vivos = suscripciones(usuarioId);
                if (vivos == null || !vivos.contains(ultimo[0])) {
                    perdidos.incrementAndGet();
                }
            }
        } finally {
            suscriptor.join();
            limpiador.join();
        }

        assertThat(perdidos.get()).as("emisores vivos perdidos por el registro").isZero();
    }

    @SuppressWarnings("unchecked")
    private Set<SseEmitter> suscripciones(Long usuarioId) throws Exception {
        Field campo = ChatStreamService.class.getDeclaredField("emisores");
        campo.setAccessible(true);
        Map<Long, Set<SseEmitter>> emisores = (Map<Long, Set<SseEmitter>>) campo.get(servicio);
        return emisores.get(usuarioId);
    }

    private static final class Callbacks {
        private Runnable completion = () -> { };
        private Runnable timeout = () -> { };
        private Consumer<Throwable> error = throwable -> { };
    }

    private static Callbacks inicializar(SseEmitter emitter) throws Exception {
        Callbacks callbacks = new Callbacks();
        Object handler = Proxy.newProxyInstance(
                HANDLER.getClassLoader(),
                new Class<?>[]{HANDLER},
                (proxy, metodo, argumentos) -> {
                    switch (metodo.getName()) {
                        case "onCompletion" -> callbacks.completion = (Runnable) argumentos[0];
                        case "onTimeout" -> callbacks.timeout = (Runnable) argumentos[0];
                        case "onError" -> callbacks.error = (Consumer<Throwable>) argumentos[0];
                        case "complete" -> callbacks.completion.run();
                        case "completeWithError" -> callbacks.error.accept((Throwable) argumentos[0]);
                        default -> { }
                    }
                    return null;
                });
        Method initialize = ResponseBodyEmitter.class.getDeclaredMethod("initialize", HANDLER);
        initialize.setAccessible(true);
        initialize.invoke(emitter, handler);
        return callbacks;
    }

    private static Class<?> cargarHandler() {
        try {
            return Class.forName(
                    "org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter$Handler");
        } catch (ClassNotFoundException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static void esperar(CyclicBarrier barrera) {
        try {
            barrera.await();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
