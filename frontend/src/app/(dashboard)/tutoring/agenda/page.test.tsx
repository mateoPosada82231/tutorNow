import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutorAgendaPage from '@/app/(dashboard)/tutoring/agenda/page';
import { fetchMySlots, saveMySlots } from '@/features/schedule/api/scheduleApi';
import { fetchAcceptedTutoringRequests } from '@/features/tutoring/api/tutoringApi';
import { useAuthStore } from '@/stores/useAuthStore';
import type { TutoringRequest } from '@/features/tutoring/types';

vi.mock('@/features/schedule/api/scheduleApi', () => ({
  fetchMySlots: vi.fn(),
  saveMySlots: vi.fn(),
}));

vi.mock('@/features/tutoring/api/tutoringApi', () => ({
  fetchAcceptedTutoringRequests: vi.fn(),
  cancelTutoringRequest: vi.fn(),
  finishAsesoria: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function buildAcceptedRequest(overrides: Partial<TutoringRequest> = {}): TutoringRequest {
  return {
    id: 1,
    tema: 'Derivadas parciales',
    modalidad: 'VIRTUAL',
    disponibilidad: 'Lunes y miercoles 2-4pm',
    descripcion: 'Necesito ayuda con la tarea 3',
    estado: 'CONFIRMADA',
    materia: { id: 1, label: 'Calculo Diferencial' },
    estudiante: { id: 2, fullName: 'Ana Perez' },
    propuestasCount: 1,
    isOwner: false,
    isProfileMatch: null,
    propuestas: [],
    asesoria: {
      id: 20,
      solicitudId: 1,
      propuestaId: 7,
      estado: 'PENDIENTE',
      confirmadaEstudiante: false,
      confirmadaTutor: false,
      finalizadaAt: null,
      tutor: { id: 5, fullName: 'Tutor User', biografia: '', materias: [] },
      createdAt: '2026-10-20T10:00:00Z',
    },
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('TutorAgendaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMySlots).mockResolvedValue([]);
    vi.mocked(saveMySlots).mockResolvedValue([]);
    vi.mocked(fetchAcceptedTutoringRequests).mockResolvedValue({
      data: [],
      pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0 },
    });
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'tutor@elpoli.edu.co', fullName: 'Tutor User', role: 'TUTOR' },
      isAuthenticated: true,
    });
  });

  it('muestra la invitacion a ser tutor cuando el usuario no lo es', async () => {
    useAuthStore.setState({
      user: { id: 1, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
    });
    render(<TutorAgendaPage />);

    expect(screen.getByText(/aun no eres tutor/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a mi perfil/i })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(fetchMySlots).not.toHaveBeenCalled();
  });

  it('carga y muestra la cuadricula con el modo de solo lectura', async () => {
    vi.mocked(fetchMySlots).mockResolvedValue([
      { id: 1, diaSemana: 'LUNES', horaInicio: '08:00:00' },
    ]);
    render(<TutorAgendaPage />);

    await waitFor(() => expect(fetchMySlots).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('grid', { name: /cuadricula de disponibilidad/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /modificar horario/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: /lun 08:00/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.queryByText(/aun no has configurado tu disponibilidad/i),
    ).not.toBeInTheDocument();
  });

  it('muestra el estado vacio cuando no hay bloques configurados', async () => {
    render(<TutorAgendaPage />);

    expect(await screen.findByText(/aun no has configurado tu disponibilidad/i)).toBeInTheDocument();
  });

  it('permite marcar un bloque en modo edicion y guardar los cambios', async () => {
    render(<TutorAgendaPage />);

    const editButton = await screen.findByRole('button', { name: /modificar horario/i });
    fireEvent.click(editButton);

    expect(screen.getByText(/arrastra sobre varios bloques/i)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
    expect(saveButton).toBeDisabled();

    const cell = screen.getByRole('gridcell', { name: /lun 08:00/i });
    fireEvent.pointerDown(cell);
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    await waitFor(() => expect(saveMySlots).toHaveBeenCalledTimes(1));
    expect(saveMySlots).toHaveBeenCalledWith({
      slots: [{ diaSemana: 'LUNES', horaInicio: '08:00' }],
    });

    expect(await screen.findByText(/tu horario se ha guardado correctamente/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /modificar horario/i }),
    ).toBeInTheDocument();
  });

  it('cancela los cambios sin guardar', async () => {
    vi.mocked(fetchMySlots).mockResolvedValue([
      { id: 1, diaSemana: 'LUNES', horaInicio: '08:00:00' },
    ]);
    render(<TutorAgendaPage />);

    fireEvent.click(await screen.findByRole('button', { name: /modificar horario/i }));

    const cell = screen.getByRole('gridcell', { name: /lun 08:00/i });
    expect(cell).toHaveAttribute('aria-pressed', 'true');

    fireEvent.pointerDown(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.getByRole('gridcell', { name: /lun 08:00/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(saveMySlots).not.toHaveBeenCalled();
  });

  it('muestra un error cuando falla el guardado', async () => {
    vi.mocked(saveMySlots).mockRejectedValue(new Error('No se pudo guardar'));
    render(<TutorAgendaPage />);

    fireEvent.click(await screen.findByRole('button', { name: /modificar horario/i }));
    fireEvent.pointerDown(screen.getByRole('gridcell', { name: /lun 08:00/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await screen.findByText(/no se pudo guardar/i)).toBeInTheDocument();
  });

  it('titula la pagina como disponibilidad y asesorias', async () => {
    render(<TutorAgendaPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /disponibilidad y asesor/i }),
    ).toBeInTheDocument();
    expect(fetchAcceptedTutoringRequests).toHaveBeenCalledTimes(1);
  });

  it('muestra las asesorias aceptadas debajo de la disponibilidad', async () => {
    vi.mocked(fetchAcceptedTutoringRequests).mockResolvedValue({
      data: [buildAcceptedRequest()],
      pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
    });
    render(<TutorAgendaPage />);

    expect(
      await screen.findByRole('heading', { name: /asesorías aceptadas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Derivadas parciales')).toBeInTheDocument();
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
    expect(screen.getByText('Calculo Diferencial')).toBeInTheDocument();
    expect(screen.getByText(/necesito ayuda con la tarea 3/i)).toBeInTheDocument();
    expect(screen.getByText('En coordinación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar finalización/i })).toBeInTheDocument();
    expect(screen.getByText('1 asesoría')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver asesor/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/1?from=agenda',
    );
  });

  it('muestra el estado vacio cuando no hay asesorias aceptadas', async () => {
    render(<TutorAgendaPage />);

    expect(
      await screen.findByText(/aún no tienes asesorías aceptadas/i),
    ).toBeInTheDocument();
  });

  it('no consulta las asesorias aceptadas si el usuario no es tutor', async () => {
    useAuthStore.setState({
      user: { id: 1, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
    });
    render(<TutorAgendaPage />);

    expect(screen.getByText(/aun no eres tutor/i)).toBeInTheDocument();
    expect(fetchAcceptedTutoringRequests).not.toHaveBeenCalled();
  });
});
