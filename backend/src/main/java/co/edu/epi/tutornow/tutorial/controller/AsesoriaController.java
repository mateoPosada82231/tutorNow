package co.edu.epi.tutornow.tutorial.controller;

import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.dto.ResenaRequest;
import co.edu.epi.tutornow.tutorial.service.AsesoriaService;
import co.edu.epi.tutornow.tutorial.service.ResenaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/asesorias")
@RequiredArgsConstructor
public class AsesoriaController {

    private final AsesoriaService asesoriaService;
    private final ResenaService resenaService;

    @PutMapping("/{id}/finalizar")
    public ResponseEntity<AsesoriaResponse> finalizar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(asesoriaService.confirmarFinalizacion(userDetails.getUsername(), id));
    }

    @PostMapping("/{id}/resenas")
    public ResponseEntity<AsesoriaResponse> resenar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ResenaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resenaService.crear(userDetails.getUsername(), id, request));
    }
}
