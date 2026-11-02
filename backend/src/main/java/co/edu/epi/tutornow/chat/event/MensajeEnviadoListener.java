package co.edu.epi.tutornow.chat.event;

import co.edu.epi.tutornow.chat.stream.ChatStreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class MensajeEnviadoListener {

    private final ChatStreamService chatStreamService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alEnviar(MensajeEnviadoEvent event) {
        chatStreamService.emitirMensaje(event.estudianteId(), event.mensaje());
        chatStreamService.emitirMensaje(event.tutorUsuarioId(), event.mensaje());
    }
}
