import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import TutorProfilePage from './page';
import * as tutoringApi from '@/features/tutoring/api/tutoringApi';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Proposal, TutorProfile, TutoringRequest } from '@/features/tutoring/types';

const pushMock = vi.fn();
let mockQuery: Record<string, string> = {};

vi.mock('next/navigation', () => ({
  useParams: () => ({ tutorId: '5' }),
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: (key: string) => mockQuery[key] ?? null }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/tutoring/api/tutoringApi', () => ({
  fetchTutorProfile: vi.fn(),
  fetchTutoringRequest: vi.fn(),
  acceptProposal: vi.fn(),
  rejectProposal: vi.fn(),
}));

function buildProfile(overrides: Partial<TutorProfile> = {}): TutorProfile {
  return {
    id: 5,
    fullName: 'Carlos Gomez',
    biografia: 'Tutor de matematicas con dos semestres de experiencia',
    materias: [
      { id: 1, label: 'Matematicas II' },
      { id: 2, label: 'Calculo I' },
    ],
    disponibilidad: [
      { id: 20, diaSemana: 'LUNES', horaInicio: '10:00:00' },
      { id: 21, diaSemana: 'MIERCOLES', horaInicio: '14:00:00' },
    ],
    resenas: [],
    ...overrides,
  };
}

function buildProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 10,
    solicitudId: 7,
    mensaje: 'Puedo ayudarte con la tarea 3',
    estado: 'PENDIENTE',
    tutor: {
      id: 5,
      fullName: 'Carlos Gomez',
      biografia: 'Tutor de matematicas',
      materias: [{ id: 1, label: 'Matematicas II' }],
    },
    isMine: false,
    createdAt: '2026-10-02T10:00:00',
    ...overrides,
  };
}

function buildSolicitud(overrides: Partial<TutoringRequest> = {}): TutoringRequest {
  return {
    id: 7,
    tema: 'Ecuaciones diferenciales',
    modalidad: 'VIRTUAL',
    disponibilidad: 'Lunes y miercoles 2-4pm',
    descripcion: null,
    estado: 'EN_PROCESO',
    materia: { id: 1, label: 'Matematicas II' },
    estudiante: { id: 2, fullName: 'Ana Perez' },
    propuestasCount: 1,
    isOwner: true,
    isProfileMatch: null,
    propuestas: [buildProposal()],
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('TutorProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = { solicitud: '7', proposal: '10' };
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    mockQuery = {};
  });

  it('renderiza el perfil del tutor con materias, reseñas vacias y acciones habilitadas', async () => {
    vi.mocked(tutoringApi.fetchTutorProfile).mockResolvedValue(buildProfile());
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(buildSolicitud());
    render(<TutorProfilePage />);

    expect(await screen.findByRole('heading', { name: /carlos gomez/i })).toBeInTheDocument();
    expect(screen.getByText(/tutor de matematicas con dos semestres/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /materias que asesora/i })).toBeInTheDocument();

    expect(screen.getByText(/no tiene rese\W/i)).toBeInTheDocument();
    expect(screen.getByText(/puedo ayudarte con la tarea 3/i)).toBeInTheDocument();
    expect(screen.getByText(/mensaje del tutor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeEnabled();
  });

  it('muestra la disponibilidad como mini cuadricula compacta de solo lectura', async () => {
    vi.mocked(tutoringApi.fetchTutorProfile).mockResolvedValue(buildProfile());
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(buildSolicitud());
    render(<TutorProfilePage />);

    expect(await screen.findByRole('grid', { name: /cuadricula de disponibilidad/i })).toBeInTheDocument();

    const disponibles = screen.getAllByRole('gridcell').filter(
      (item) => item.getAttribute('aria-pressed') === 'true',
    );
    expect(disponibles.length).toBe(2);
    expect(screen.getByRole('gridcell', { name: /lun 10:00 disponible/i })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /mié 14:00 disponible/i })).toBeInTheDocument();
  });

  it('al aceptar la propuesta redirige al detalle de la asesoria', async () => {
    const user = userEvent.setup();
    vi.mocked(tutoringApi.fetchTutorProfile).mockResolvedValue(buildProfile());
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(buildSolicitud());
    vi.mocked(tutoringApi.acceptProposal).mockResolvedValue(buildSolicitud());
    render(<TutorProfilePage />);

    await user.click(await screen.findByRole('button', { name: /aceptar/i }));

    expect(tutoringApi.acceptProposal).toHaveBeenCalledWith(10);
    expect(pushMock).toHaveBeenCalledWith('/tutoring/requests/7');
  });

  it('al rechazar la propuesta desde el perfil redirige al detalle de la asesoria', async () => {
    const user = userEvent.setup();
    vi.mocked(tutoringApi.fetchTutorProfile).mockResolvedValue(buildProfile());
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(buildSolicitud());
    vi.mocked(tutoringApi.rejectProposal).mockResolvedValue(buildProposal());
    render(<TutorProfilePage />);

    await user.click(await screen.findByRole('button', { name: /rechazar/i }));

    expect(tutoringApi.rejectProposal).toHaveBeenCalledWith(10);
    expect(pushMock).toHaveBeenCalledWith('/tutoring/requests/7');
  });

  it('sin propuesta en contexto solo muestra la informacion del perfil', async () => {
    mockQuery = {};
    vi.mocked(tutoringApi.fetchTutorProfile).mockResolvedValue(buildProfile());
    render(<TutorProfilePage />);

    expect(await screen.findByRole('heading', { name: /carlos gomez/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/desde una propuesta recibida/i),
    ).toBeInTheDocument();
  });

  it('deshabilita las acciones si la propuesta ya fue procesada', async () => {
    vi.mocked(tutoringApi.fetchTutorProfile).mockResolvedValue(buildProfile());
    vi.mocked(tutoringApi.fetchTutoringRequest).mockResolvedValue(
      buildSolicitud({
        estado: 'CONFIRMADA',
        propuestas: [buildProposal({ estado: 'ACEPTADA' })],
      }),
    );
    render(<TutorProfilePage />);

    expect(await screen.findByRole('button', { name: /aceptar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeDisabled();
    expect(screen.getByText(/esta propuesta ya fue procesada/i)).toBeInTheDocument();
  });

  it('muestra el error del backend cuando falla la carga del perfil', async () => {
    vi.mocked(tutoringApi.fetchTutorProfile).mockRejectedValue(
      new HttpError(404, 'Tutor no encontrado'),
    );
    render(<TutorProfilePage />);

    expect(await screen.findByText(/tutor no encontrado/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reintentar/i }),
    ).toBeInTheDocument();
  });
});
