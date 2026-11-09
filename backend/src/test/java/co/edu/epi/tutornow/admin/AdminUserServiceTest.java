package co.edu.epi.tutornow.admin;

import co.edu.epi.tutornow.admin.dto.AdminUserResponse;
import co.edu.epi.tutornow.admin.service.AdminUserService;
import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserService")
class AdminUserServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private ResenaRepository resenaRepository;
    @InjectMocks
    private AdminUserService adminUserService;

    private final String CORREO_ADMIN = "admin@elpoli.edu.co";

    private Usuario admin() {
        return Usuario.builder().id(1L)
                .correoElectronico(CORREO_ADMIN)
                .nombreCompleto("Admin Uno").rol(Rol.ADMIN).activo(true).build();
    }

    private Usuario tutor(Long id) {
        return Usuario.builder().id(id)
                .correoElectronico("tutor" + id + "@elpoli.edu.co")
                .nombreCompleto("Tutor " + id).rol(Rol.TUTOR).activo(true).verificado(true).build();
    }

    private Usuario estudiante(Long id) {
        return Usuario.builder().id(id)
                .correoElectronico("alumno" + id + "@elpoli.edu.co")
                .nombreCompleto("Estudiante " + id).rol(Rol.ESTUDIANTE).activo(true).build();
    }

    @Nested
    @DisplayName("list")
    class Listar {

        @Test
        @DisplayName("devuelve usuarios paginados con resumen de resenas para tutores")
        void shouldListUsersWithTutorStats() {
            Usuario tutor = tutor(2L);
            Usuario alumno = estudiante(3L);
            Page<Usuario> page = new PageImpl<>(
                    List.of(tutor, alumno), PageRequest.of(0, 10), 2);

            when(usuarioRepository.findAdminFiltered(any(), any(), any(), any())).thenReturn(page);
            when(resenaRepository.findResumenPorTutorIds(any(), any(), any()))
                    .thenReturn(List.<Object[]>of(new Object[] {2L, 1.5d, 4L}));

            PageResponse<AdminUserResponse> result = adminUserService.list(null, true, null, 0, 10);

            assertThat(result.getData()).hasSize(2);
            AdminUserResponse tutorRow = result.getData().get(0);
            assertThat(tutorRow.getRole()).isEqualTo("TUTOR");
            assertThat(tutorRow.getTutorReviews().getAverageRating()).isEqualTo(1.5);
            assertThat(tutorRow.getTutorReviews().getReviewCount()).isEqualTo(4);
            assertThat(result.getData().get(1).getTutorReviews()).isNull();
            assertThat(result.getPagination().getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("expone si cada usuario tiene perfil de tutor previo para poder restaurarlo")
        void shouldExposeTutorProfileFlag() {
            Usuario tutor = tutor(2L);
            Usuario alumno = estudiante(3L);
            Page<Usuario> page = new PageImpl<>(
                    List.of(tutor, alumno), PageRequest.of(0, 10), 2);

            when(usuarioRepository.findAdminFiltered(any(), any(), any(), any())).thenReturn(page);
            when(resenaRepository.findResumenPorTutorIds(any(), any(), any()))
                    .thenReturn(List.<Object[]>of());
            when(tutorRepository.findByUsuario_IdIn(any())).thenReturn(List.of(
                    co.edu.epi.tutornow.tutors.model.Tutor.builder().id(9L).usuario(tutor).build()));

            PageResponse<AdminUserResponse> result = adminUserService.list(null, true, null, 0, 10);

            assertThat(result.getData().get(0).isHasTutorProfile()).isTrue();
            assertThat(result.getData().get(1).isHasTutorProfile()).isFalse();
        }
    }

    @Nested
    @DisplayName("revocar tutor")
    class RevocarTutor {

        @Test
        @DisplayName("cambia TUTOR a ESTUDIANTE y persiste")
        void shouldRevokeTutorRole() {
            Usuario target = tutor(2L);
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(target));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

            AdminUserResponse result = adminUserService.revokeTutor(CORREO_ADMIN, 2L);

            assertThat(result.getRole()).isEqualTo("ESTUDIANTE");
            verify(usuarioRepository).save(target);
        }

        @Test
        @DisplayName("falla con 409 si el usuario no es tutor")
        void shouldThrowWhenNotTutor() {
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(estudiante(2L)));

            assertThatThrownBy(() -> adminUserService.revokeTutor(CORREO_ADMIN, 2L))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("falla con 404 si el usuario no existe")
        void shouldThrowWhenTargetMissing() {
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.revokeTutor(CORREO_ADMIN, 99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("restaurar tutor")
    class RestaurarTutor {

        @Test
        @DisplayName("revera TUTOR si existe el perfil de tutor previo")
        void shouldRestoreTutorRole() {
            Usuario target = estudiante(2L);
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(target));
            when(tutorRepository.findByUsuario_Id(2L)).thenReturn(Optional.of(
                    co.edu.epi.tutornow.tutors.model.Tutor.builder().id(9L).usuario(target).build()));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

            AdminUserResponse result = adminUserService.restoreTutor(CORREO_ADMIN, 2L);

            assertThat(result.getRole()).isEqualTo("TUTOR");
            verify(usuarioRepository).save(target);
        }

        @Test
        @DisplayName("falla con 409 si no hay perfil de tutor previo")
        void shouldThrowWithoutTutorProfile() {
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(estudiante(2L)));
            when(tutorRepository.findByUsuario_Id(2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.restoreTutor(CORREO_ADMIN, 2L))
                    .isInstanceOf(ConflictException.class);
        }
    }

    @Nested
    @DisplayName("activacion de usuarios")
    class Activacion {

        @Test
        @DisplayName("desactiva un usuario y reverte con activate")
        void shouldDeactivateAndActivate() {
            Usuario target = estudiante(2L);
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(target));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

            AdminUserResponse deactivated = adminUserService.deactivate(CORREO_ADMIN, 2L);
            target.setActivo(false);
            assertThat(deactivated.isActive()).isFalse();

            target.setActivo(true);
            target = Usuario.builder().id(2L)
                    .correoElectronico("alumno2@elpoli.edu.co")
                    .nombreCompleto("Estudiante 2").rol(Rol.ESTUDIANTE).activo(true).build();
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(target));
            assertThat(adminUserService.activate(CORREO_ADMIN, 2L).isActive()).isTrue();
        }

        @Test
        @DisplayName("falla con 409 si el admin intenta modificarse a si mismo")
        void shouldThrowWhenModifyingSelf() {
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));

            assertThatThrownBy(() -> adminUserService.deactivate(CORREO_ADMIN, 1L))
                    .isInstanceOf(ConflictException.class);
        }
    }

    @Nested
    @DisplayName("promover admin")
    class PromoverAdmin {

        @Test
        @DisplayName("asigna el rol ADMIN y persiste")
        void shouldPromoteToAdmin() {
            Usuario target = estudiante(2L);
            when(usuarioRepository.findByCorreoElectronico(CORREO_ADMIN)).thenReturn(Optional.of(admin()));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(target));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

            AdminUserResponse result = adminUserService.promoteAdmin(CORREO_ADMIN, 2L);

            assertThat(result.getRole()).isEqualTo("ADMIN");
            verify(usuarioRepository).save(target);
        }
    }
}
