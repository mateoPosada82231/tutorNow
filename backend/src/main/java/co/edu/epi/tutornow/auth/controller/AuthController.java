package co.edu.epi.tutornow.auth.controller;

import co.edu.epi.tutornow.auth.dto.AuthResponse;
import co.edu.epi.tutornow.auth.dto.ChangePasswordRequest;
import co.edu.epi.tutornow.auth.dto.ForgotPasswordRequest;
import co.edu.epi.tutornow.auth.dto.LoginRequest;
import co.edu.epi.tutornow.auth.dto.RegisterRequest;
import co.edu.epi.tutornow.auth.dto.RegisterResponse;
import co.edu.epi.tutornow.auth.dto.ResetPasswordRequest;
import co.edu.epi.tutornow.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Correo verificado correctamente. Ya puedes iniciar sesion."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of(
                "message", "Si el correo esta registrado, recibiras un enlace de recuperacion"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Contrasena restablecida correctamente"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of(
                "message", "Revisa tu correo institucional para confirmar el cambio de contrasena"));
    }

    @GetMapping("/confirm-password-change")
    public ResponseEntity<Map<String, String>> confirmPasswordChange(@RequestParam String token) {
        authService.confirmPasswordChange(token);
        return ResponseEntity.ok(Map.of("message", "Contrasena actualizada correctamente"));
    }
}
