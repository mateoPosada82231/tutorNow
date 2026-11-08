package co.edu.epi.tutornow.tutorial.controller;

import co.edu.epi.tutornow.tutorial.dto.MisResenasResponse;
import co.edu.epi.tutornow.tutorial.service.ResenaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaService resenaService;

    @GetMapping("/me")
    public ResponseEntity<MisResenasResponse> misResenas(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(resenaService.obtenerMisResenas(userDetails.getUsername()));
    }
}
