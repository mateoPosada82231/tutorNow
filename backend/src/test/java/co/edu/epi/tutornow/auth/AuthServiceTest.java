package co.edu.epi.tutornow.auth;

import co.edu.epi.tutornow.auth.dto.AuthResponse;
import co.edu.epi.tutornow.auth.dto.LoginRequest;
import co.edu.epi.tutornow.auth.dto.RegisterRequest;
import co.edu.epi.tutornow.auth.dto.RegisterResponse;
import co.edu.epi.tutornow.auth.service.AuthService;
import co.edu.epi.tutornow.auth.service.EmailService;
import co.edu.epi.tutornow.auth.service.JwtService;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.CorreoNoVerificadoException;
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

    private RegisterRequest buildRegisterRequest(String email) {
        return RegisterRequest.builder()
                .email(email)
                .password("Pass123!")
                .fullName("Usuario Prueba")
                .program("Ingenieria de Sistemas")
                .semester(5)
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
