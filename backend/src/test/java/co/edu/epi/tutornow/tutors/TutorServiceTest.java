package co.edu.epi.tutornow.tutors;

import co.edu.epi.tutornow.catalog.model.Materia;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutors.dto.TutorProfileRequest;
import co.edu.epi.tutornow.tutors.dto.TutorResponse;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.tutors.service.TutorService;
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

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TutorServiceTest {

    @Mock
    private TutorRepository tutorRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MateriaRepository materiaRepository;

    @InjectMocks
    private TutorService tutorService;

    @Nested
    @DisplayName("Creacion de perfil de tutor")
    class BecomeTutor {

        @Test
        @DisplayName("Crea el perfil de tutor y asigna el rol TUTOR al usuario")
        void shouldCreateTutorProfileAndAssignRolTutor() {
            Usuario usuario = buildUsuario(Rol.ESTUDIANTE);
            TutorProfileRequest request = buildRequest(List.of(1L, 2L, 2L));
            when(tutorRepository.existsByUsuario_CorreoElectronico("user@elpoli.edu.co")).thenReturn(false);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(materiaRepository.findAllById(anyList())).thenReturn(List.of(
                    buildMateria(1L, "Calculo Diferencial", true),
                    buildMateria(2L, "Algebra Lineal", true)));
            when(tutorRepository.save(any(Tutor.class))).thenAnswer(invocation -> {
                Tutor t = invocation.getArgument(0);
                t.setId(10L);
                t.setCreatedAt(OffsetDateTime.now());
                return t;
            });

            TutorResponse response = tutorService.becomeTutor("user@elpoli.edu.co", request);

            ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(usuarioCaptor.capture());
            assertEquals(Rol.TUTOR, usuarioCaptor.getValue().getRol());

            ArgumentCaptor<Tutor> tutorCaptor = ArgumentCaptor.forClass(Tutor.class);
            verify(tutorRepository).save(tutorCaptor.capture());
            assertEquals(usuario, tutorCaptor.getValue().getUsuario());
            assertEquals("Soy tutor de matematicas", tutorCaptor.getValue().getBiografia());
            assertEquals(2, tutorCaptor.getValue().getMaterias().size());

            assertEquals(10L, response.getId());
            assertEquals(2, response.getMaterias().size());
            assertEquals("Calculo Diferencial", response.getMaterias().get(0).getLabel());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando el usuario ya es tutor")
        void shouldThrowConflictWhenAlreadyTutor() {
            when(tutorRepository.existsByUsuario_CorreoElectronico("user@elpoli.edu.co")).thenReturn(true);

            assertThrows(ConflictException.class,
                    () -> tutorService.becomeTutor("user@elpoli.edu.co", buildRequest(List.of(1L))));
            verify(tutorRepository, never()).save(any());
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando una materia no existe")
        void shouldThrowConflictWhenMateriaDoesNotExist() {
            Usuario usuario = buildUsuario(Rol.ESTUDIANTE);
            when(tutorRepository.existsByUsuario_CorreoElectronico("user@elpoli.edu.co")).thenReturn(false);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(materiaRepository.findAllById(anyList())).thenReturn(List.of(
                    buildMateria(1L, "Calculo Diferencial", true)));

            assertThrows(ConflictException.class,
                    () -> tutorService.becomeTutor("user@elpoli.edu.co", buildRequest(List.of(1L, 99L))));
            verify(tutorRepository, never()).save(any());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando una materia esta inactiva")
        void shouldThrowConflictWhenMateriaInactive() {
            Usuario usuario = buildUsuario(Rol.ESTUDIANTE);
            when(tutorRepository.existsByUsuario_CorreoElectronico("user@elpoli.edu.co")).thenReturn(false);
            when(usuarioRepository.findByCorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.of(usuario));
            when(materiaRepository.findAllById(anyList())).thenReturn(List.of(
                    buildMateria(1L, "Calculo Diferencial", false)));

            assertThrows(ConflictException.class,
                    () -> tutorService.becomeTutor("user@elpoli.edu.co", buildRequest(List.of(1L))));
            verify(tutorRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Consulta de perfil de tutor")
    class GetMyTutorProfile {

        @Test
        @DisplayName("Retorna el perfil de tutor con sus materias")
        void shouldReturnTutorProfileWithMaterias() {
            Tutor tutor = buildTutor();
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(tutor));

            TutorResponse response = tutorService.getMyTutorProfile("user@elpoli.edu.co");

            assertEquals(10L, response.getId());
            assertEquals("Soy tutor de matematicas", response.getBiografia());
            assertEquals(1, response.getMaterias().size());
            assertEquals("Calculo Diferencial", response.getMaterias().get(0).getLabel());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no es tutor")
        void shouldThrowNotFoundWhenNotTutor() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> tutorService.getMyTutorProfile("user@elpoli.edu.co"));
        }
    }

    @Nested
    @DisplayName("Actualizacion de perfil de tutor")
    class UpdateMyTutorProfile {

        @Test
        @DisplayName("Actualiza biografia y materias correctamente")
        void shouldUpdateTutorProfileSuccessfully() {
            Tutor tutor = buildTutor();
            TutorProfileRequest request = TutorProfileRequest.builder()
                    .biografia("Nueva biografia del tutor")
                    .materiaIds(List.of(2L, 3L))
                    .build();
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(tutor));
            when(materiaRepository.findAllById(anyList())).thenReturn(List.of(
                    buildMateria(2L, "Algebra Lineal", true),
                    buildMateria(3L, "Fisica I", true)));

            TutorResponse response = tutorService.updateMyTutorProfile("user@elpoli.edu.co", request);

            ArgumentCaptor<Tutor> captor = ArgumentCaptor.forClass(Tutor.class);
            verify(tutorRepository).save(captor.capture());
            assertEquals("Nueva biografia del tutor", captor.getValue().getBiografia());
            assertEquals(2, captor.getValue().getMaterias().size());

            assertEquals("Nueva biografia del tutor", response.getBiografia());
            assertEquals(2, response.getMaterias().size());
            assertEquals("Algebra Lineal", response.getMaterias().get(0).getLabel());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no es tutor")
        void shouldThrowNotFoundWhenNotTutor() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> tutorService.updateMyTutorProfile("user@elpoli.edu.co", buildRequest(List.of(1L))));
            verify(tutorRepository, never()).save(any());
        }
    }

    private TutorProfileRequest buildRequest(List<Long> materiaIds) {
        return TutorProfileRequest.builder()
                .biografia("Soy tutor de matematicas")
                .materiaIds(materiaIds)
                .build();
    }

    private Usuario buildUsuario(Rol rol) {
        return Usuario.builder()
                .id(1L)
                .correoElectronico("user@elpoli.edu.co")
                .nombreCompleto("Usuario Prueba")
                .rol(rol)
                .verificado(true)
                .activo(true)
                .build();
    }

    private Materia buildMateria(Long id, String nombre, boolean activa) {
        return Materia.builder()
                .id(id)
                .nombre(nombre)
                .activa(activa)
                .build();
    }

    private Tutor buildTutor() {
        Set<Materia> materias = new LinkedHashSet<>(Set.of(buildMateria(1L, "Calculo Diferencial", true)));
        return Tutor.builder()
                .id(10L)
                .usuario(buildUsuario(Rol.TUTOR))
                .biografia("Soy tutor de matematicas")
                .materias(materias)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }
}
