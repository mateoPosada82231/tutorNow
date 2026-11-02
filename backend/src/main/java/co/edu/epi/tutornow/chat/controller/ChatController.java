package co.edu.epi.tutornow.chat.controller;

import co.edu.epi.tutornow.chat.dto.ChatResumenResponse;
import co.edu.epi.tutornow.chat.dto.EnviarMensajeRequest;
import co.edu.epi.tutornow.chat.dto.MarcarLeidoRequest;
import co.edu.epi.tutornow.chat.dto.MensajeResponse;
import co.edu.epi.tutornow.chat.dto.MensajesPageResponse;
import co.edu.epi.tutornow.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatResumenResponse>> listar(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.listar(userDetails.getUsername()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<MensajesPageResponse> historial(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam(required = false) Long before,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(chatService.historial(userDetails.getUsername(), id, before, size));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MensajeResponse> enviar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody EnviarMensajeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.enviar(userDetails.getUsername(), id, request));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> marcarLeido(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody MarcarLeidoRequest request) {
        chatService.marcarLeido(userDetails.getUsername(), id, request.getUltimoMensajeId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stream")
    public SseEmitter stream(@AuthenticationPrincipal UserDetails userDetails) {
        return chatService.suscribir(userDetails.getUsername());
    }
}
