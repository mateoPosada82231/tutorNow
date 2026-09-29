package co.edu.epi.tutornow.tutors;

import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutors.dto.TutorSlotRequest;
import co.edu.epi.tutornow.tutors.dto.TutorSlotResponse;
import co.edu.epi.tutornow.tutors.dto.TutorSlotsRequest;
import co.edu.epi.tutornow.tutors.model.DiaSemana;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.model.TutorSlot;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.tutors.repository.TutorSlotRepository;
import co.edu.epi.tutornow.tutors.service.TutorSlotService;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TutorSlotServiceTest {

    @Mock
    private TutorRepository tutorRepository;

    @Mock
    private TutorSlotRepository tutorSlotRepository;

    @InjectMocks
    private TutorSlotService tutorSlotService;

    @Nested
    @DisplayName("Consulta de slots")
    class GetMySlots {

        @Test
        @DisplayName("Retorna los slots ordenados por dia y hora")
        void shouldReturnSlotsSortedByDayAndHour() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));
            when(tutorSlotRepository.findByTutorId(10L)).thenReturn(List.of(
                    buildSlot(1L, DiaSemana.MARTES, LocalTime.of(9, 0)),
                    buildSlot(2L, DiaSemana.LUNES, LocalTime.of(10, 0)),
                    buildSlot(3L, DiaSemana.LUNES, LocalTime.of(8, 0))));

            List<TutorSlotResponse> response = tutorSlotService.getMySlots("user@elpoli.edu.co");

            assertEquals(3, response.size());
            assertEquals("LUNES", response.get(0).getDiaSemana());
            assertEquals(LocalTime.of(8, 0), response.get(0).getHoraInicio());
            assertEquals("LUNES", response.get(1).getDiaSemana());
            assertEquals(LocalTime.of(10, 0), response.get(1).getHoraInicio());
            assertEquals("MARTES", response.get(2).getDiaSemana());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no es tutor")
        void shouldThrowNotFoundWhenNotTutor() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> tutorSlotService.getMySlots("user@elpoli.edu.co"));
        }
    }

    @Nested
    @DisplayName("Guardado de slots")
    class SaveMySlots {

        @Test
        @DisplayName("Reemplaza el grid completo con los nuevos slots")
        void shouldReplaceAllSlots() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));
            when(tutorSlotRepository.saveAll(anyIterable())).thenAnswer(invocation -> {
                List<TutorSlot> slots = new java.util.ArrayList<>();
                long id = 100L;
                for (TutorSlot slot : (Iterable<TutorSlot>) invocation.getArgument(0)) {
                    slot.setId(id++);
                    slots.add(slot);
                }
                return slots;
            });

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(8, 0)),
                    new TutorSlotRequest("MIERCOLES", LocalTime.of(15, 0))));

            List<TutorSlotResponse> response = tutorSlotService.saveMySlots("user@elpoli.edu.co", request);

            verify(tutorSlotRepository).deleteByTutorId(10L);
            verify(tutorSlotRepository).saveAll(anyIterable());

            assertEquals(2, response.size());
            assertEquals("LUNES", response.get(0).getDiaSemana());
            assertEquals("MIERCOLES", response.get(1).getDiaSemana());
        }

        @Test
        @DisplayName("Reemplaza el grid completo incluso con lista vacia")
        void shouldReplaceWithEmptyList() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            tutorSlotService.saveMySlots("user@elpoli.edu.co", buildRequest(List.of()));

            verify(tutorSlotRepository).deleteByTutorId(10L);
            verify(tutorSlotRepository).saveAll(anyIterable());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando el dia no es valido")
        void shouldThrowConflictWhenInvalidDay() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNESDAY", LocalTime.of(8, 0))));

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", request));
            verify(tutorSlotRepository, never()).saveAll(anyIterable());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando la hora esta fuera del rango 8-18")
        void shouldThrowConflictWhenHourOutOfRange() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(7, 0))));

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", request));

            TutorSlotsRequest requestTarde = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(18, 0))));

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", requestTarde));
            verify(tutorSlotRepository, never()).saveAll(anyIterable());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando hay bloques duplicados")
        void shouldThrowConflictWhenDuplicatedSlot() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(8, 0)),
                    new TutorSlotRequest("LUNES", LocalTime.of(8, 0))));

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", request));
            verify(tutorSlotRepository, never()).saveAll(anyIterable());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no es tutor")
        void shouldThrowNotFoundWhenNotTutor() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", buildRequest(List.of())));
            verify(tutorSlotRepository, never()).deleteByTutorId(any());
        }
    }

    private TutorSlotsRequest buildRequest(List<TutorSlotRequest> slots) {
        return TutorSlotsRequest.builder().slots(slots).build();
    }

    private Tutor buildTutor() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .correoElectronico("user@elpoli.edu.co")
                .nombreCompleto("Usuario Prueba")
                .rol(Rol.TUTOR)
                .verificado(true)
                .activo(true)
                .build();

        return Tutor.builder()
                .id(10L)
                .usuario(usuario)
                .biografia("Soy tutor de matematicas")
                .build();
    }

    private TutorSlot buildSlot(Long id, DiaSemana dia, LocalTime hora) {
        return TutorSlot.builder()
                .id(id)
                .tutor(buildTutor())
                .diaSemana(dia)
                .horaInicio(hora)
                .build();
    }
}
