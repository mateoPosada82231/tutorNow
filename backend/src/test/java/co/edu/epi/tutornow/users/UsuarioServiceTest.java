package co.edu.epi.tutornow.users;

import co.edu.epi.tutornow.catalog.model.Carrera;
import co.edu.epi.tutornow.catalog.model.Semestre;
import co.edu.epi.tutornow.catalog.repository.CarreraRepository;
import co.edu.epi.tutornow.catalog.repository.SemestreRepository;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.users.dto.UpdateProfileRequest;
import co.edu.epi.tutornow.users.dto.UserResponse;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import co.edu.epi.tutornow.users.service.UsuarioService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CarreraRepository carreraRepository;

    @Mock
    private SemestreRepository semestreRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @Nested
    @DisplayName("Consulta de perfil")
    class GetProfile {

        @Test
        @DisplayName("Retorna el perfil del usuario con isTutor en false")
        void shouldReturnProfileWithIsTutorFalseWhenEstudiante() {
            Usuario usuario = buildUsuarioConCatalogos(Rol.ESTUDIANTE);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));

            UserResponse response = usuarioService.getProfile("user@elpoli.edu.co");

            assertEquals(1L, response.getId());
            assertEquals("user@elpoli.edu.co", response.getEmail());
            assertEquals("Usuario Prueba", response.getFullName());
            assertEquals("ESTUDIANTE", response.getRole());
            assertEquals(1L, response.getCarrera().getId());
            assertEquals("Ingenieria de Sistemas", response.getCarrera().getLabel());
            assertEquals(1L, response.getSemestre().getId());
            assertEquals("Semestre 3", response.getSemestre().getLabel());
            assertFalse(response.isTutor());
        }

        @Test
        @DisplayName("Retorna isTutor en true cuando el rol es TUTOR")
        void shouldReturnIsTutorTrueWhenRolTutor() {
            Usuario usuario = buildUsuarioConCatalogos(Rol.TUTOR);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));

            UserResponse response = usuarioService.getProfile("user@elpoli.edu.co");

            assertEquals("TUTOR", response.getRole());
            assertTrue(response.isTutor());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no existe")
        void shouldThrowNotFoundWhenUserDoesNotExist() {
            when(usuarioRepository.findByCorreoElectronico("nadie@elpoli.edu.co")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> usuarioService.getProfile("nadie@elpoli.edu.co"));
        }
    }

    @Nested
    @DisplayName("Actualizacion de perfil")
    class UpdateProfile {

        @Test
        @DisplayName("Actualiza nombre, carrera y semestre correctamente")
        void shouldUpdateProfileSuccessfully() {
            Usuario usuario = buildUsuarioConCatalogos(Rol.ESTUDIANTE);
            Carrera nuevaCarrera = Carrera.builder().id(2L).nombre("Ingenieria Civil").activa(true).build();
            Semestre nuevoSemestre = Semestre.builder().id(5L).numero(5).activo(true).build();
            UpdateProfileRequest request = buildUpdateRequest("Nuevo Nombre", 2L, 5L);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(carreraRepository.findById(2L)).thenReturn(Optional.of(nuevaCarrera));
            when(semestreRepository.findById(5L)).thenReturn(Optional.of(nuevoSemestre));

            UserResponse response = usuarioService.updateProfile("user@elpoli.edu.co", request);

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertEquals("Nuevo Nombre", captor.getValue().getNombreCompleto());
            assertEquals(2L, captor.getValue().getCarrera().getId());
            assertEquals(5L, captor.getValue().getSemestreRef().getId());

            assertEquals("Nuevo Nombre", response.getFullName());
            assertEquals("Ingenieria Civil", response.getCarrera().getLabel());
            assertEquals("Semestre 5", response.getSemestre().getLabel());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando la carrera no existe")
        void shouldThrowConflictWhenCarreraInvalid() {
            Usuario usuario = buildUsuarioConCatalogos(Rol.ESTUDIANTE);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(carreraRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(ConflictException.class,
                    () -> usuarioService.updateProfile("user@elpoli.edu.co", buildUpdateRequest("Nombre", 99L, 1L)));
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando el semestre no existe")
        void shouldThrowConflictWhenSemestreInvalid() {
            Usuario usuario = buildUsuarioConCatalogos(Rol.ESTUDIANTE);
            Carrera carrera = Carrera.builder().id(1L).nombre("Ingenieria de Sistemas").activa(true).build();
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(carreraRepository.findById(1L)).thenReturn(Optional.of(carrera));
            when(semestreRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(ConflictException.class,
                    () -> usuarioService.updateProfile("user@elpoli.edu.co", buildUpdateRequest("Nombre", 1L, 99L)));
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no existe")
        void shouldThrowNotFoundWhenUserDoesNotExist() {
            when(usuarioRepository.findByCorreoElectronico("nadie@elpoli.edu.co")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> usuarioService.updateProfile("nadie@elpoli.edu.co", buildUpdateRequest("Nombre", 1L, 1L)));
            verify(usuarioRepository, never()).save(any());
        }
    }

    private UpdateProfileRequest buildUpdateRequest(String fullName, Long carreraId, Long semestreId) {
        return UpdateProfileRequest.builder()
                .fullName(fullName)
                .carreraId(carreraId)
                .semestreId(semestreId)
                .build();
    }

    private Usuario buildUsuarioConCatalogos(Rol rol) {
        return Usuario.builder()
                .id(1L)
                .correoElectronico("user@elpoli.edu.co")
                .nombreCompleto("Usuario Prueba")
                .carrera(Carrera.builder().id(1L).nombre("Ingenieria de Sistemas").activa(true).build())
                .semestreRef(Semestre.builder().id(1L).numero(3).activo(true).build())
                .rol(rol)
                .verificado(true)
                .activo(true)
                .build();
    }
}
