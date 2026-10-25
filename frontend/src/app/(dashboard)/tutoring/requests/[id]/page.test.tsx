import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutoringRequestDetailPage from './page';
import * as tutoringApi from '@/features/tutoring/api/tutoringApi';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';
import type { TutoringRequest } from '@/features/tutoring/types';

const pushMock = vi.fn();
const { searchParamsMock } = vi.hoisted(() => ({
  searchParamsMock: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: '1' }),
  useSearchParams: () => searchParamsMock.current,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/tutoring/api/tutoringApi', () => ({
  fetchTutoringRequest: vi.fn(),
  cancelTutoringRequest: vi.fn(),
  finishAsesoria: vi.fn(),
  createProposal: vi.fn(),
  acceptProposal: vi.fn(),
  rejectProposal: vi.fn(),
}));

function buildRequest(overrides: Partial<TutoringRequest> = {}): TutoringRequest {
  return {
    id: 1,
    tema: 'Ecuaciones diferenciales',
    modalidad: 'VIRTUAL',
    disponibilidad: 'Lunes y miercoles 2-4pm',
    descripcion: 'Necesito ayuda con la tarea 3',
    estado: 'PUBLICADA',
    materia: { id: 1, label: 'Matematicas II' },
    estudiante: { id: 2, fullName: 'Ana Perez' },
    propuestasCount: 0,
    isOwner: true,
    isProfileMatch: null,
    propuestas: [],
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('TutoringRequestDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    searchParamsMock.current = new URLSearchParams();
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
  });

  it('deshabilita el chat hasta que la asesoria este confirmada', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({ estado: 'EN_PROCESO' }),
    );
    render(<TutoringRequestDetailPage />);

    const chatButton = await screen.findByRole('button', { name: /entrar al chat/i });
    expect(chatButton).toBeDisabled();
  });

  it('habilita el chat en asesorias confirmadas y muestra el aviso al hacer clic', async () => {    const user = userEvent.setup();
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        propuestasCount: 1,
        propuestas: [
          {
            id: 10,
            solicitudId: 1,
            mensaje: 'Puedo ayudarte con la tarea 3',
            estado: 'ACEPTADA',
            tutor: {
              id: 3,
              fullName: 'Carlos Gomez',
              biografia: 'Tutor de matematicas',
              materias: [{ id: 1, label: 'Matematicas II' }],
            },
            isMine: false,
            createdAt: '2026-10-02T10:00:00',
          },
        ],
      }),
    );
    render(<TutoringRequestDetailPage />);

    const chatButton = await screen.findByRole('button', { name: /entrar al chat/i });
    expect(chatButton).toBeEnabled();

    await user.click(chatButton);
    expect(
      await screen.findByText(/el chat estara disponible proximamente/i),
    ).toBeInTheDocument();
  });

  it('muestra el badge de la asesoria creada en estado pendiente al confirmar', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        propuestasCount: 1,
        propuestas: [
          {
            id: 10,
            solicitudId: 1,
            mensaje: 'Puedo ayudarte con la tarea 3',
            estado: 'ACEPTADA',
            tutor: {
              id: 3,
              fullName: 'Carlos Gomez',
              biografia: 'Tutor de matematicas',
              materias: [{ id: 1, label: 'Matematicas II' }],
            },
            isMine: false,
            createdAt: '2026-10-02T10:00:00',
          },
        ],
        asesoria: {
          id: 11,
          solicitudId: 1,
          propuestaId: 10,
          estado: 'PENDIENTE',
          confirmadaEstudiante: false,
          confirmadaTutor: false,
          finalizadaAt: null,
          tutor: {
            id: 3,
            fullName: 'Carlos Gomez',
            biografia: 'Tutor de matematicas',
            materias: [{ id: 1, label: 'Matematicas II' }],
          },
          createdAt: '2026-10-02T11:00:00',
        },
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText(/asesoria #11/i)).toBeInTheDocument();
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });

  it('no muestra la propuesta aceptada a un tutor que no fue elegido', async () => {
    useAuthStore.setState({
      user: { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role: 'TUTOR' },
    });
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        isOwner: false,
        propuestasCount: 2,
        propuestas: [
          {
            id: 12,
            solicitudId: 1,
            mensaje: 'Mi propuesta que no fue elegida',
            estado: 'RECHAZADA',
            tutor: {
              id: 3,
              fullName: 'Carlos Gomez',
              biografia: 'Tutor de matematicas',
              materias: [{ id: 1, label: 'Matematicas II' }],
            },
            isMine: true,
            createdAt: '2026-10-02T10:00:00',
          },
        ],
        asesoria: null,
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByRole('heading', { name: /ecuaciones diferenciales/i })).toBeInTheDocument();
    expect(screen.queryByText(/propuesta aceptada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/asesoria #/i)).not.toBeInTheDocument();
  });

  it('muestra la propuesta aceptada al tutor que la gano', async () => {
    useAuthStore.setState({
      user: { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role: 'TUTOR' },
    });
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        isOwner: false,
        propuestasCount: 1,
        propuestas: [
          {
            id: 10,
            solicitudId: 1,
            mensaje: 'Puedo ayudarte con la tarea 3',
            estado: 'ACEPTADA',
            tutor: {
              id: 3,
              fullName: 'Carlos Gomez',
              biografia: 'Tutor de matematicas',
              materias: [{ id: 1, label: 'Matematicas II' }],
            },
            isMine: true,
            createdAt: '2026-10-02T10:00:00',
          },
        ],
        asesoria: {
          id: 11,
          solicitudId: 1,
          propuestaId: 10,
          estado: 'PENDIENTE',
          confirmadaEstudiante: false,
          confirmadaTutor: false,
          finalizadaAt: null,
          tutor: {
            id: 3,
            fullName: 'Carlos Gomez',
            biografia: 'Tutor de matematicas',
            materias: [{ id: 1, label: 'Matematicas II' }],
          },
          createdAt: '2026-10-02T11:00:00',
        },
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText(/propuesta aceptada/i)).toBeInTheDocument();
    expect(screen.getByText(/asesoria #11/i)).toBeInTheDocument();
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });

  it('muestra el boton de cancelar al dueno con la asesoria activa', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({ estado: 'PUBLICADA' }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByRole('button', { name: /cancelar asesoria/i })).toBeEnabled();
  });

  it('muestra las propuestas recibidas al dueno con opciones de decision', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'EN_PROCESO',
        propuestasCount: 1,
        propuestas: [
          {
            id: 10,
            solicitudId: 1,
            mensaje: 'Puedo ayudarte con la tarea 3',
            estado: 'PENDIENTE',
            tutor: {
              id: 3,
              fullName: 'Carlos Gomez',
              biografia: 'Tutor de matematicas',
              materias: [{ id: 1, label: 'Matematicas II' }],
            },
            isMine: false,
            createdAt: '2026-10-02T10:00:00',
          },
        ],
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText('Carlos Gomez')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeEnabled();
  });

  it('permite a un tutor dueño de la demanda aceptar propuestas', async () => {
    useAuthStore.setState({
      user: { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role: 'TUTOR' },
    });
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'EN_PROCESO',
        propuestasCount: 1,
        propuestas: [
          {
            id: 10,
            solicitudId: 1,
            mensaje: 'Puedo ayudarte con la tarea 3',
            estado: 'PENDIENTE',
            tutor: {
              id: 4,
              fullName: 'Laura Ruiz',
              biografia: 'Tutoria de quimica',
              materias: [{ id: 2, label: 'Quimica I' }],
            },
            isMine: false,
            createdAt: '2026-10-02T10:00:00',
          },
        ],
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText('Laura Ruiz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar/i })).toBeEnabled();
  });

  it('muestra el formulario de propuesta a un tutor que aun no ha propuesto', async () => {
    useAuthStore.setState({
      user: { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role: 'TUTOR' },
    });
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({ estado: 'PUBLICADA', isOwner: false }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByLabelText(/mensaje/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar propuesta/i })).toBeEnabled();
  });

  it('muestra el error del backend cuando el tutor ya propuso', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role: 'TUTOR' },
    });
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({ estado: 'PUBLICADA', isOwner: false }),
    );
    vi.mocked(tutoringApi.createProposal).mockRejectedValue(
      new HttpError(409, 'Conflicto'),
    );
    render(<TutoringRequestDetailPage />);

    await user.type(await screen.findByLabelText(/mensaje/i), 'Quiero proponerte mi ayuda aqui');
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(await screen.findByText(/ya enviaste una propuesta a esta asesoria/i)).toBeInTheDocument();
  });

  it('muestra acceso denegado ante un 403 (asoreria ajena) en vez de reintentar', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockRejectedValue(
      new HttpError(403, 'No tienes acceso a esta asesoria'),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText(/no tienes acceso a esta asesoria/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a asesorías/i })).toHaveAttribute(
      'href',
      '/tutoring/requests',
    );
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('vuelve a la agenda cuando la asesoria se abrio desde alli', async () => {
    searchParamsMock.current = new URLSearchParams('from=agenda');
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({ estado: 'EN_PROCESO' }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByRole('link', { name: /volver a la agenda/i })).toHaveAttribute(
      'href',
      '/tutoring/agenda',
    );
    expect(
      screen.queryByRole('link', { name: /volver a asesorías/i }),
    ).not.toBeInTheDocument();
  });

  it('permite al estudiante confirmar la finalizacion', async () => {
    const user = userEvent.setup();
    const request = buildRequest({
      estado: 'CONFIRMADA',
      asesoria: {
        id: 11,
        solicitudId: 1,
        propuestaId: 10,
        estado: 'PENDIENTE',
        confirmadaEstudiante: false,
        confirmadaTutor: false,
        finalizadaAt: null,
        tutor: { id: 3, fullName: 'Carlos Gomez', biografia: '', materias: [] },
        createdAt: '2026-10-02T11:00:00',
      },
    });
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(request);
    vi.mocked(tutoringApi.finishAsesoria).mockResolvedValue(request.asesoria!);
    render(<TutoringRequestDetailPage />);

    await user.click(
      await screen.findByRole('button', { name: /confirmar finalización/i }),
    );

    await waitFor(() => expect(tutoringApi.finishAsesoria).toHaveBeenCalledWith(11));
    await waitFor(() => expect(tutoringApi.fetchTutoringRequest).toHaveBeenCalledTimes(2));
  });

  it('muestra el resumen de confirmaciones y espera a la otra parte', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        asesoria: {
          id: 11,
          solicitudId: 1,
          propuestaId: 10,
          estado: 'PENDIENTE',
          confirmadaEstudiante: true,
          confirmadaTutor: false,
          finalizadaAt: null,
          tutor: { id: 3, fullName: 'Carlos Gomez', biografia: '', materias: [] },
          createdAt: '2026-10-02T11:00:00',
        },
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText('Confirmaste la finalización')).toBeInTheDocument();
    expect(screen.getByText('El tutor aún no confirma')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /esperando a la otra parte/i }),
    ).toBeDisabled();
  });

  it('muestra la asesoria finalizada con su fecha y sin acciones', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        asesoria: {
          id: 11,
          solicitudId: 1,
          propuestaId: 10,
          estado: 'FINALIZADA',
          confirmadaEstudiante: true,
          confirmadaTutor: true,
          finalizadaAt: '2026-10-25T10:00:00Z',
          tutor: { id: 3, fullName: 'Carlos Gomez', biografia: '', materias: [] },
          createdAt: '2026-10-02T11:00:00',
        },
      }),
    );
    render(<TutoringRequestDetailPage />);

    expect(await screen.findByText(/asesoría finalizada el/i)).toBeInTheDocument();
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirmar finalización/i }),
    ).not.toBeInTheDocument();
  });

  it('permite cancelar una asesoria en coordinacion', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildRequest({
        estado: 'CONFIRMADA',
        asesoria: {
          id: 11,
          solicitudId: 1,
          propuestaId: 10,
          estado: 'PENDIENTE',
          confirmadaEstudiante: false,
          confirmadaTutor: false,
          finalizadaAt: null,
          tutor: { id: 3, fullName: 'Carlos Gomez', biografia: '', materias: [] },
          createdAt: '2026-10-02T11:00:00',
        },
      }),
    );
    vi.mocked(tutoringApi.cancelTutoringRequest).mockResolvedValue(undefined);
    render(<TutoringRequestDetailPage />);

    await user.click(await screen.findByRole('button', { name: /cancelar asesoría/i }));

    await waitFor(() =>
      expect(tutoringApi.cancelTutoringRequest).toHaveBeenCalledWith(1),
    );
    await waitFor(() => expect(tutoringApi.fetchTutoringRequest).toHaveBeenCalledTimes(2));
  });
});
