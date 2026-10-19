import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutoringRequestDetailPage from './page';
import * as tutoringApi from '@/features/tutoring/api/tutoringApi';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';
import type { TutoringRequest } from '@/features/tutoring/types';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: '1' }),
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
    vi.clearAllMocks();
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

  it('habilita el chat en asesorias confirmadas y muestra el aviso al hacer clic', async () => {
    const user = userEvent.setup();
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
    expect(screen.getByRole('link', { name: /volver a asesorias/i })).toHaveAttribute(
      'href',
      '/tutoring/requests',
    );
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});
