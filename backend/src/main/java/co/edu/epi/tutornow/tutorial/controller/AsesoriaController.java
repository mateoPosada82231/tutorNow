package co.edu.epi.tutornow.tutorial.controller;

import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.service.AsesoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/asesorias")
@RequiredArgsConstructor
public class AsesoriaController {

    private final AsesoriaService asesoriaService;

    @PutMapping("/{id}/finalizar")
    public ResponseEntity<AsesoriaResponse> finalizar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(asesoriaService.confirmarFinalizacion(userDetails.getUsername(), id));
    }
}
