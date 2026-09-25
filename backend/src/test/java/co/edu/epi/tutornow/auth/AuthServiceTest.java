package co.edu.epi.tutornow.auth;

import co.edu.epi.tutornow.auth.dto.AuthResponse;
import co.edu.epi.tutornow.auth.dto.ChangePasswordRequest;
import co.edu.epi.tutornow.auth.dto.ForgotPasswordRequest;
import co.edu.epi.tutornow.auth.dto.LoginRequest;
import co.edu.epi.tutornow.auth.dto.RegisterRequest;
import co.edu.epi.tutornow.auth.dto.RegisterResponse;
import co.edu.epi.tutornow.auth.dto.ResetPasswordRequest;
import co.edu.epi.tutornow.auth.service.AuthService;
import co.edu.epi.tutornow.auth.service.EmailService;
import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.catalog.model.Carrera;
import co.edu.epi.tutornow.catalog.model.Semestre;
import co.edu.epi.tutornow.catalog.repository.CarreraRepository;
import co.edu.epi.tutornow.catalog.repository.SemestreRepository;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.CorreoNoVerificadoException;
import co.edu.epi.tutornow.common.exception.CredencialesInvalidasException;
import co.edu.epi.tutornow.common.exception.TokenInvalidoException;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    @Mock
    private CarreraRepository carreraRepository;

    @Mock
    private SemestreRepository semestreRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Nested
    @DisplayName("Registro")
    class Register {

        @Test
        @DisplayName("Registra usuario correctamente con correo institucional")
        void shouldRegisterUserSuccessfully() {
            RegisterRequest request = buildRegisterRequest("nuevo@elpoli.edu.co");
            when(usuarioRepository.existsByCorreoElectronico("nuevo@elpoli.edu.co")).thenReturn(false);
            when(carreraRepository.findById(1L)).thenReturn(Optional.of(Carrera.builder().id(1L).nombre("Ingenieria de Sistemas").activa(true).build()));
            when(semestreRepository.findById(1L)).thenReturn(Optional.of(Semestre.builder().id(1L).numero(1).activo(true).build()));
            when(passwordEncoder.encode(anyString())).thenReturn("hash_encriptado");
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
                Usuario u = invocation.getArgument(0);
                u.setId(1L);
                return u;
            });

            RegisterResponse response = authService.register(request);

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            Usuario guardado = captor.getValue();

            assertEquals("nuevo@elpoli.edu.co", guardado.getCorreoElectronico());
            assertEquals("hash_encriptado", guardado.getContrasena());
            assertEquals(Rol.ESTUDIANTE, guardado.getRol());
            assertFalse(guardado.isVerificado());
            assertTrue(guardado.isActivo());
            assertNotNull(guardado.getVerificationToken());
            assertNotNull(guardado.getTokenExpiracion());
            assertEquals(1L, response.getId());
            assertTrue(response.isRequiresVerification());
            verify(emailService).sendVerificationEmail(any(Usuario.class));
        }

        @Test
        @DisplayName("Normaliza el correo a minusculas antes de guardar")
        void shouldNormalizeEmailToLowerCase() {
            RegisterRequest request = buildRegisterRequest("  USUARIO@elpoli.edu.co  ");
            when(usuarioRepository.existsByCorreoElectronico("usuario@elpoli.edu.co")).thenReturn(false);
            when(carreraRepository.findById(1L)).thenReturn(Optional.of(Carrera.builder().id(1L).nombre("Ingenieria de Sistemas").activa(true).build()));
            when(semestreRepository.findById(1L)).thenReturn(Optional.of(Semestre.builder().id(1L).numero(1).activo(true).build()));
            when(passwordEncoder.encode(anyString())).thenReturn("hash");
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

            authService.register(request);

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertEquals("usuario@elpoli.edu.co", captor.getValue().getCorreoElectronico());
        }

        @Test
        @DisplayName("Lanza excepcion si el correo ya existe")
        void shouldThrowConflictWhenEmailAlreadyExists() {
            RegisterRequest request = buildRegisterRequest("existente@elpoli.edu.co");
            when(usuarioRepository.existsByCorreoElectronico("existente@elpoli.edu.co")).thenReturn(true);

            assertThrows(ConflictException.class, () -> authService.register(request));
            verify(usuarioRepository, never()).save(any());
            verify(emailService, never()).sendVerificationEmail(any());
        }
    }

    @Nested
    @DisplayName("Verificacion de correo")
    class VerifyEmail {

        @Test
        @DisplayName("Verifica la cuenta con un token valido")
        void shouldVerifyEmailWithValidToken() {
            Usuario usuario = buildUsuario(false, OffsetDateTime.now().plusHours(2));
            usuario.setVerificationToken("token-valido");
            when(usuarioRepository.findByVerificationToken("token-valido")).thenReturn(Optional.of(usuario));

            authService.verifyEmail("token-valido");

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertTrue(captor.getValue().isVerificado());
            assertNull(captor.getValue().getVerificationToken());
            assertNull(captor.getValue().getTokenExpiracion());
        }

        @Test
        @DisplayName("Lanza excepcion con token inexistente")
        void shouldThrowWhenTokenDoesNotExist() {
            when(usuarioRepository.findByVerificationToken("no-existe")).thenReturn(Optional.empty());

            assertThrows(TokenInvalidoException.class, () -> authService.verifyEmail("no-existe"));
        }

        @Test
        @DisplayName("Lanza excepcion si la cuenta ya estaba verificada")
        void shouldThrowWhenAlreadyVerified() {
            Usuario usuario = buildUsuario(true, OffsetDateTime.now().plusHours(2));
            usuario.setVerificationToken("token");
            when(usuarioRepository.findByVerificationToken("token")).thenReturn(Optional.of(usuario));

            assertThrows(TokenInvalidoException.class, () -> authService.verifyEmail("token"));
        }

        @Test
        @DisplayName("Lanza excepcion si el token expiro")
        void shouldThrowWhenTokenExpired() {
            Usuario usuario = buildUsuario(false, OffsetDateTime.now().minusHours(1));
            usuario.setVerificationToken("token-expirado");
            when(usuarioRepository.findByVerificationToken("token-expirado")).thenReturn(Optional.of(usuario));

            assertThrows(TokenInvalidoException.class, () -> authService.verifyEmail("token-expirado"));
        }
    }

    @Nested
    @DisplayName("Inicio de sesion")
    class Login {

        @Test
        @DisplayName("Retorna token JWT con credenciales validas y correo verificado")
        void shouldLoginSuccessfully() {
            LoginRequest request = new LoginRequest("user@elpoli.edu.co", "Pass123!");
            Usuario usuario = buildUsuario(true, null);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(jwtService.generateAccessToken("user@elpoli.edu.co")).thenReturn("jwt-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(86400L);

            AuthResponse response = authService.login(request);

            assertEquals("jwt-token", response.getAccessToken());
            assertEquals("Bearer", response.getTokenType());
            assertEquals(86400L, response.getExpiresIn());
            assertEquals("user@elpoli.edu.co", response.getEmail());
            assertEquals("ESTUDIANTE", response.getRole());
        }

        @Test
        @DisplayName("Bloquea el login si el correo no fue verificado")
        void shouldBlockLoginWhenEmailNotVerified() {
            LoginRequest request = new LoginRequest("user@elpoli.edu.co", "Pass123!");
            Usuario usuario = buildUsuario(false, null);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));

            assertThrows(CorreoNoVerificadoException.class, () -> authService.login(request));
        }

        @Test
        @DisplayName("Propaga error con credenciales incorrectas")
        void shouldThrowWhenBadCredentials() {
            LoginRequest request = new LoginRequest("user@elpoli.edu.co", "mala");
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("bad"));

            assertThrows(BadCredentialsException.class, () -> authService.login(request));
        }
    }

    @Nested
    @DisplayName("Recuperacion de contrasena")
    class RecuperarContrasena {

        @Test
        @DisplayName("Genera token y envia correo si el email existe")
        void shouldGenerateResetTokenWhenEmailExists() {
            Usuario usuario = buildUsuario(true, null);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));

            authService.forgotPassword(new ForgotPasswordRequest("user@elpoli.edu.co"));

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertNotNull(captor.getValue().getResetToken());
            assertNotNull(captor.getValue().getResetTokenExpiracion());
            assertTrue(captor.getValue().getResetTokenExpiracion().isAfter(OffsetDateTime.now()));
            verify(emailService).sendPasswordResetEmail(any(Usuario.class));
        }

        @Test
        @DisplayName("No revela si el correo no existe")
        void shouldNotRevealWhenEmailDoesNotExist() {
            when(usuarioRepository.findByCorreoElectronico("nadie@elpoli.edu.co")).thenReturn(Optional.empty());

            authService.forgotPassword(new ForgotPasswordRequest("nadie@elpoli.edu.co"));

            verify(usuarioRepository, never()).save(any());
            verify(emailService, never()).sendPasswordResetEmail(any());
        }

        @Test
        @DisplayName("Restablece contrasena con token valido")
        void shouldResetPasswordWithValidToken() {
            Usuario usuario = buildUsuario(true, null);
            usuario.setResetToken("reset-token");
            usuario.setResetTokenExpiracion(OffsetDateTime.now().plusMinutes(10));
            when(usuarioRepository.findByResetToken("reset-token")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.encode("NuevaPass123")).thenReturn("nuevo_hash");

            authService.resetPassword(buildResetRequest("reset-token", "NuevaPass123"));

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertEquals("nuevo_hash", captor.getValue().getContrasena());
            assertNull(captor.getValue().getResetToken());
            assertNull(captor.getValue().getResetTokenExpiracion());
        }

        @Test
        @DisplayName("Lanza excepcion con token de reset invalido")
        void shouldThrowWhenResetTokenInvalid() {
            when(usuarioRepository.findByResetToken("no-existe")).thenReturn(Optional.empty());

            assertThrows(TokenInvalidoException.class,
                    () -> authService.resetPassword(buildResetRequest("no-existe", "NuevaPass123")));
        }

        @Test
        @DisplayName("Lanza excepcion con token de reset expirado")
        void shouldThrowWhenResetTokenExpired() {
            Usuario usuario = buildUsuario(true, null);
            usuario.setResetToken("expirado");
            usuario.setResetTokenExpiracion(OffsetDateTime.now().minusMinutes(1));
            when(usuarioRepository.findByResetToken("expirado")).thenReturn(Optional.of(usuario));

            assertThrows(TokenInvalidoException.class,
                    () -> authService.resetPassword(buildResetRequest("expirado", "NuevaPass123")));
        }
    }

    @Nested
    @DisplayName("Cambio de contrasena")
    class CambiarContrasena {

        @Test
        @DisplayName("Genera enlace de confirmacion con contrasena actual correcta")
        void shouldGenerateChangeTokenWithValidCurrentPassword() {
            Usuario usuario = buildUsuario(true, null);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("ActualPass123", "hash")).thenReturn(true);
            when(passwordEncoder.matches("NuevaPass123", "hash")).thenReturn(false);
            when(passwordEncoder.encode("NuevaPass123")).thenReturn("nuevo_hash");

            authService.changePassword("user@elpoli.edu.co",
                    new ChangePasswordRequest("ActualPass123", "NuevaPass123"));

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertEquals("hash", captor.getValue().getContrasena());
            assertEquals("nuevo_hash", captor.getValue().getContrasenaPendiente());
            assertNotNull(captor.getValue().getCambioToken());
            assertNotNull(captor.getValue().getCambioTokenExpiracion());
            verify(emailService).sendPasswordChangeConfirmationEmail(any(Usuario.class));
        }

        @Test
        @DisplayName("Rechaza el cambio si la contrasena actual es incorrecta")
        void shouldRejectWhenCurrentPasswordWrong() {
            Usuario usuario = buildUsuario(true, null);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("MalPass123", "hash")).thenReturn(false);

            assertThrows(CredencialesInvalidasException.class,
                    () -> authService.changePassword("user@elpoli.edu.co",
                            new ChangePasswordRequest("MalPass123", "NuevaPass123")));
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("Rechaza la nueva contrasena si es igual a la actual")
        void shouldRejectWhenNewPasswordSameAsCurrent() {
            Usuario usuario = buildUsuario(true, null);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("ActualPass123", "hash")).thenReturn(true);

            assertThrows(ConflictException.class,
                    () -> authService.changePassword("user@elpoli.edu.co",
                            new ChangePasswordRequest("ActualPass123", "ActualPass123")));
        }

        @Test
        @DisplayName("Confirma el cambio con token valido")
        void shouldConfirmChangeWithValidToken() {
            Usuario usuario = buildUsuario(true, null);
            usuario.setContrasenaPendiente("nuevo_hash");
            usuario.setCambioToken("cambio-token");
            usuario.setCambioTokenExpiracion(OffsetDateTime.now().plusMinutes(10));
            when(usuarioRepository.findByCambioToken("cambio-token")).thenReturn(Optional.of(usuario));

            authService.confirmPasswordChange("cambio-token");

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertEquals("nuevo_hash", captor.getValue().getContrasena());
            assertNull(captor.getValue().getContrasenaPendiente());
            assertNull(captor.getValue().getCambioToken());
            assertNull(captor.getValue().getCambioTokenExpiracion());
        }

        @Test
        @DisplayName("Lanza excepcion al confirmar con token invalido")
        void shouldThrowWhenChangeTokenInvalid() {
            when(usuarioRepository.findByCambioToken("no-existe")).thenReturn(Optional.empty());

            assertThrows(TokenInvalidoException.class, () -> authService.confirmPasswordChange("no-existe"));
        }

        @Test
        @DisplayName("Lanza excepcion al confirmar con token expirado")
        void shouldThrowWhenChangeTokenExpired() {
            Usuario usuario = buildUsuario(true, null);
            usuario.setCambioToken("expirado");
            usuario.setCambioTokenExpiracion(OffsetDateTime.now().minusMinutes(1));
            when(usuarioRepository.findByCambioToken("expirado")).thenReturn(Optional.of(usuario));

            assertThrows(TokenInvalidoException.class, () -> authService.confirmPasswordChange("expirado"));
        }
    }

    private RegisterRequest buildRegisterRequest(String email) {
        return RegisterRequest.builder()
                .email(email)
                .password("Pass123!")
                .fullName("Usuario Prueba")
                .carreraId(1L)
                .semestreId(1L)
                .build();
    }

    private ResetPasswordRequest buildResetRequest(String token, String newPassword) {
        return ResetPasswordRequest.builder()
                .token(token)
                .newPassword(newPassword)
                .build();
    }

    private Usuario buildUsuario(boolean verificado, OffsetDateTime expiracion) {
        return Usuario.builder()
                .id(1L)
                .correoElectronico("user@elpoli.edu.co")
                .contrasena("hash")
                .nombreCompleto("Usuario Prueba")
                .rol(Rol.ESTUDIANTE)
                .verificado(verificado)
                .activo(true)
                .tokenExpiracion(expiracion)
                .build();
    }
}
