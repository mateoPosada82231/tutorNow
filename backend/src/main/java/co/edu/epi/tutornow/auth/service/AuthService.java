package co.edu.epi.tutornow.auth.service;

import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.CorreoNoVerificadoException;
import co.edu.epi.tutornow.common.exception.TokenInvalidoException;
import co.edu.epi.tutornow.auth.dto.AuthResponse;
import co.edu.epi.tutornow.auth.dto.LoginRequest;
import co.edu.epi.tutornow.auth.dto.RegisterRequest;
import co.edu.epi.tutornow.auth.dto.RegisterResponse;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String correo = request.getEmail().toLowerCase().trim();

        if (usuarioRepository.existsByCorreoElectronico(correo)) {
            throw new ConflictException("El correo electronico ya esta registrado");
        }

        String token = UUID.randomUUID().toString();

        Usuario usuario = Usuario.builder()
                .correoElectronico(correo)
                .contrasena(passwordEncoder.encode(request.getPassword()))
                .nombreCompleto(request.getFullName())
                .programa(request.getProgram())
                .semestre(request.getSemester())
                .rol(Rol.ESTUDIANTE)
                .verificado(false)
                .activo(true)
                .verificationToken(token)
                .tokenExpiracion(OffsetDateTime.now().plusHours(24))
                .build();

        usuarioRepository.save(usuario);
        emailService.sendVerificationEmail(usuario);

        return RegisterResponse.builder()
                .id(usuario.getId())
                .email(usuario.getCorreoElectronico())
                .fullName(usuario.getNombreCompleto())
                .role(usuario.getRol().name())
                .requiresVerification(true)
                .message("Registro exitoso. Revisa tu correo institucional para confirmar tu cuenta.")
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {
        Usuario usuario = usuarioRepository.findByVerificationToken(token)
                .orElseThrow(() -> new TokenInvalidoException("El token de verificacion no es valido"));

        if (usuario.isVerificado()) {
            throw new TokenInvalidoException("La cuenta ya fue verificada anteriormente");
        }

        if (usuario.getTokenExpiracion() == null || usuario.getTokenExpiracion().isBefore(OffsetDateTime.now())) {
            throw new TokenInvalidoException("El token de verificacion ha expirado");
        }

        usuario.setVerificado(true);
        usuario.setVerificationToken(null);
        usuario.setTokenExpiracion(null);
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String correo = request.getEmail().toLowerCase().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(correo, request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado tras autenticacion"));

        if (!usuario.isVerificado()) {
            throw new CorreoNoVerificadoException("Debes confirmar tu correo electronico antes de iniciar sesion");
        }

        String accessToken = jwtService.generateAccessToken(usuario.getCorreoElectronico());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpirationSeconds())
                .id(usuario.getId())
                .email(usuario.getCorreoElectronico())
                .fullName(usuario.getNombreCompleto())
                .role(usuario.getRol().name())
                .build();
    }
}
