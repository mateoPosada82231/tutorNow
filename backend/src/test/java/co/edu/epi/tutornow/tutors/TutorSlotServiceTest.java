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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
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

    private static final LocalDate SEMANA_ACTUAL = LocalDate.of(2026, 11, 9);
    private static final LocalDate SEMANA_SIGUIENTE = LocalDate.of(2026, 11, 16);

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
        @DisplayName("Retorna los slots ordenados por semana, dia y hora con su semanaInicio")
        void shouldReturnSlotsSortedByWeekDayAndHour() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));
            when(tutorSlotRepository.findByTutorId(10L)).thenReturn(List.of(
                    buildSlot(1L, DiaSemana.MARTES, LocalTime.of(9, 0), SEMANA_SIGUIENTE),
                    buildSlot(2L, DiaSemana.LUNES, LocalTime.of(10, 0), SEMANA_ACTUAL),
                    buildSlot(3L, DiaSemana.LUNES, LocalTime.of(8, 0), SEMANA_ACTUAL),
                    buildSlot(4L, DiaSemana.LUNES, LocalTime.of(8, 0), SEMANA_SIGUIENTE)));

            List<TutorSlotResponse> response = tutorSlotService.getMySlots("user@elpoli.edu.co");

            assertEquals(4, response.size());
            assertEquals(SEMANA_ACTUAL, response.get(0).getSemanaInicio());
            assertEquals("LUNES", response.get(0).getDiaSemana());
            assertEquals(LocalTime.of(8, 0), response.get(0).getHoraInicio());
            assertEquals(SEMANA_ACTUAL, response.get(1).getSemanaInicio());
            assertEquals("LUNES", response.get(1).getDiaSemana());
            assertEquals(LocalTime.of(10, 0), response.get(1).getHoraInicio());
            assertEquals(SEMANA_SIGUIENTE, response.get(2).getSemanaInicio());
            assertEquals("LUNES", response.get(2).getDiaSemana());
            assertEquals(LocalTime.of(8, 0), response.get(2).getHoraInicio());
            assertEquals(SEMANA_SIGUIENTE, response.get(3).getSemanaInicio());
            assertEquals("MARTES", response.get(3).getDiaSemana());
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
        @DisplayName("Reemplaza solo la semana indicada con los nuevos slots")
        void shouldReplaceOnlyTheRequestedWeek() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(8, 0)),
                    new TutorSlotRequest("MIERCOLES", LocalTime.of(15, 0))), SEMANA_SIGUIENTE);

            List<TutorSlotResponse> response = tutorSlotService.saveMySlots("user@elpoli.edu.co", request);

            verify(tutorSlotRepository).deleteByTutorIdAndSemanaInicio(10L, SEMANA_SIGUIENTE);
            verify(tutorSlotRepository).saveAll(anyIterable());

            assertEquals(2, response.size());
            assertEquals("LUNES", response.get(0).getDiaSemana());
            assertEquals(SEMANA_SIGUIENTE, response.get(0).getSemanaInicio());
            assertEquals("MIERCOLES", response.get(1).getDiaSemana());
            assertEquals(SEMANA_SIGUIENTE, response.get(1).getSemanaInicio());
        }

        @Test
        @DisplayName("Reemplaza la semana indicada incluso con lista vacia")
        void shouldReplaceTheWeekWithEmptyList() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            tutorSlotService.saveMySlots("user@elpoli.edu.co",
                    buildRequest(List.of(), SEMANA_SIGUIENTE));

            verify(tutorSlotRepository).deleteByTutorIdAndSemanaInicio(10L, SEMANA_SIGUIENTE);
            verify(tutorSlotRepository).saveAll(anyIterable());
        }

        @Test
        @DisplayName("Normaliza semanaInicio no lunes al lunes de esa semana")
        void shouldNormalizeNonMondayToMonday() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            LocalDate miercoles = LocalDate.of(2026, 11, 18);
            List<TutorSlotResponse> response = tutorSlotService.saveMySlots("user@elpoli.edu.co",
                    buildRequest(List.of(new TutorSlotRequest("LUNES", LocalTime.of(8, 0))), miercoles));

            verify(tutorSlotRepository).deleteByTutorIdAndSemanaInicio(10L, SEMANA_SIGUIENTE);
            assertEquals(1, response.size());
            assertEquals(SEMANA_SIGUIENTE, response.get(0).getSemanaInicio());
        }

        @Test
        @DisplayName("Usa la semana actual cuando el request no trae semanaInicio")
        void shouldDefaultToCurrentWeekWhenSemanaInicioMissing() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            LocalDate semanaActual = LocalDate.now()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

            tutorSlotService.saveMySlots("user@elpoli.edu.co",
                    buildRequest(List.of(new TutorSlotRequest("LUNES", LocalTime.of(8, 0))), null));

            verify(tutorSlotRepository).deleteByTutorIdAndSemanaInicio(10L, semanaActual);
        }

        @Test
        @DisplayName("Lanza ConflictException cuando el dia no es valido")
        void shouldThrowConflictWhenInvalidDay() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNESDAY", LocalTime.of(8, 0))), SEMANA_ACTUAL);

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", request));
            verify(tutorSlotRepository, never()).saveAll(anyIterable());
            verify(tutorSlotRepository, never()).deleteByTutorIdAndSemanaInicio(any(), any());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando la hora esta fuera del rango 8-18")
        void shouldThrowConflictWhenHourOutOfRange() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(7, 0))), SEMANA_ACTUAL);

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", request));

            TutorSlotsRequest requestTarde = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(18, 0))), SEMANA_ACTUAL);

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", requestTarde));
            verify(tutorSlotRepository, never()).saveAll(anyIterable());
            verify(tutorSlotRepository, never()).deleteByTutorIdAndSemanaInicio(any(), any());
        }

        @Test
        @DisplayName("Lanza ConflictException cuando hay bloques duplicados")
        void shouldThrowConflictWhenDuplicatedSlot() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.of(buildTutor()));

            TutorSlotsRequest request = buildRequest(List.of(
                    new TutorSlotRequest("LUNES", LocalTime.of(8, 0)),
                    new TutorSlotRequest("LUNES", LocalTime.of(8, 0))), SEMANA_ACTUAL);

            assertThrows(ConflictException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co", request));
            verify(tutorSlotRepository, never()).saveAll(anyIterable());
            verify(tutorSlotRepository, never()).deleteByTutorIdAndSemanaInicio(any(), any());
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException cuando el usuario no es tutor")
        void shouldThrowNotFoundWhenNotTutor() {
            when(tutorRepository.findByUsuario_CorreoElectronico("user@elpoli.edu.co"))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> tutorSlotService.saveMySlots("user@elpoli.edu.co",
                            buildRequest(List.of(), SEMANA_ACTUAL)));
            verify(tutorSlotRepository, never()).deleteByTutorIdAndSemanaInicio(any(), any());
        }
    }

    private TutorSlotsRequest buildRequest(List<TutorSlotRequest> slots, LocalDate semanaInicio) {
        return TutorSlotsRequest.builder().slots(slots).semanaInicio(semanaInicio).build();
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

    private TutorSlot buildSlot(Long id, DiaSemana dia, LocalTime hora, LocalDate semanaInicio) {
        return TutorSlot.builder()
                .id(id)
                .tutor(buildTutor())
                .diaSemana(dia)
                .horaInicio(hora)
                .semanaInicio(semanaInicio)
                .build();
    }
}
