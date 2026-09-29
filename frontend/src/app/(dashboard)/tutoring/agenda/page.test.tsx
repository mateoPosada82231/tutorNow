import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutorAgendaPage from '@/app/(dashboard)/tutoring/agenda/page';
import { fetchMySlots, saveMySlots } from '@/features/schedule/api/scheduleApi';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('@/features/schedule/api/scheduleApi', () => ({
  fetchMySlots: vi.fn(),
  saveMySlots: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('TutorAgendaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMySlots).mockResolvedValue([]);
    vi.mocked(saveMySlots).mockResolvedValue([]);
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
});
