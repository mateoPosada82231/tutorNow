import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutoringRequestsPage from './page';
import * as tutoringApi from '@/features/tutoring/api/tutoringApi';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Asesoria, TutoringRequest } from '@/features/tutoring/types';

const { searchParamsMock } = vi.hoisted(() => ({
  searchParamsMock: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
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
  fetchTutoringRequests: vi.fn(),
}));

function buildAsesoria(overrides: Partial<Asesoria> = {}): Asesoria {
  return {
    id: 20,
    solicitudId: 1,
    propuestaId: 7,
    estado: 'PENDIENTE',
    confirmadaEstudiante: false,
    confirmadaTutor: false,
    finalizadaAt: null,
    tutor: { id: 5, fullName: 'Carlos Gomez', biografia: '', materias: [] },
    createdAt: '2026-10-02T10:00:00',
    ...overrides,
  };
}

function buildRequest(overrides: Partial<TutoringRequest> = {}): TutoringRequest {
  return {
    id: 7,
    tema: 'Ecuaciones diferenciales',
    modalidad: 'VIRTUAL',
    disponibilidad: 'Lunes y miercoles 2-4pm',
    descripcion: null,
    estado: 'PUBLICADA',
    materia: { id: 1, label: 'Matematicas II' },
    estudiante: { id: 2, fullName: 'Ana Perez' },
    propuestasCount: 1,
    isOwner: true,
    isProfileMatch: null,
    propuestas: [],
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('TutoringRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.current = new URLSearchParams();
    vi.mocked(tutoringApi.fetchTutoringRequests).mockResolvedValue({
      data: [buildRequest()],
      pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
    });
  });

  it('titula "Mis asesorias" con copy de gestion para estudiantes', async () => {
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
    render(<TutoringRequestsPage />);

    expect(await screen.findByRole('heading', { level: 1, name: /mis asesorias/i })).toBeInTheDocument();
    expect(screen.getByText(/gestiona las asesorias que publicaste/i)).toBeInTheDocument();
  });

  it('titula "Asesorias" con copy de feed global priorizado para tutores', async () => {
    useAuthStore.setState({
      token: 'token',
      user: { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role: 'TUTOR' },
      isAuthenticated: true,
    });
    render(<TutoringRequestsPage />);

    expect(await screen.findByRole('heading', { level: 1, name: /^asesorias$/i })).toBeInTheDocument();
    expect(
      screen.getByText(/aqui van primero las que ajustan a tu perfil/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /publicar demanda/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/new',
    );
    expect(screen.queryByRole('link', { name: /por aceptar/i })).not.toBeInTheDocument();
    await waitFor(() => expect(tutoringApi.fetchTutoringRequests).toHaveBeenCalledWith({}));
  });

  it('muestra el estado vacio propio cuando el estudiante no ha publicado', async () => {
    vi.mocked(tutoringApi.fetchTutoringRequests).mockResolvedValue({
      data: [],
      pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0 },
    });
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
    render(<TutoringRequestsPage />);

    expect(await screen.findByText(/todavia no has publicado asesorias/i)).toBeInTheDocument();
  });

  it('muestra las tabs del estudiante y carga por aceptar por defecto', async () => {
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
    render(<TutoringRequestsPage />);

    expect(await screen.findByRole('link', { name: /por aceptar/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /en coordinación/i })).toHaveAttribute(
      'href',
      '/tutoring/requests?vista=coordinacion',
    );
    expect(screen.getByRole('link', { name: /historial/i })).toHaveAttribute(
      'href',
      '/tutoring/requests?vista=historial',
    );
    await waitFor(() =>
      expect(tutoringApi.fetchTutoringRequests).toHaveBeenCalledWith({
        vista: 'abiertas',
        size: 20,
      }),
    );
  });

  it('carga la vista de coordinacion con las acciones de la asesoria', async () => {
    searchParamsMock.current = new URLSearchParams({ vista: 'coordinacion' });
    vi.mocked(tutoringApi.fetchTutoringRequests).mockResolvedValue({
      data: [
        buildRequest({
          id: 1,
          estado: 'CONFIRMADA',
          asesoria: buildAsesoria(),
        }),
      ],
      pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
    });
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
    render(<TutoringRequestsPage />);

    expect(await screen.findByText('Carlos Gomez')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /en coordinación/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: /confirmar finalización/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar asesoría/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver asesoría/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/1?from=requests&vista=coordinacion',
    );
    await waitFor(() =>
      expect(tutoringApi.fetchTutoringRequests).toHaveBeenCalledWith({
        vista: 'coordinacion',
        size: 20,
      }),
    );
  });

  it('carga el historial en solo lectura y enlaza de vuelta a esa vista', async () => {
    searchParamsMock.current = new URLSearchParams({ vista: 'historial' });
    vi.mocked(tutoringApi.fetchTutoringRequests).mockResolvedValue({
      data: [
        buildRequest({
          id: 9,
          estado: 'CONFIRMADA',
          asesoria: buildAsesoria({
            estado: 'FINALIZADA',
            finalizadaAt: '2026-10-20T10:00:00',
          }),
        }),
      ],
      pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
    });
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
    render(<TutoringRequestsPage />);

    expect(await screen.findByText(/asesoría finalizada el/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /historial/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('button', { name: /confirmar finalización/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar asesoría/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalle/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/9?from=requests&vista=historial',
    );
    await waitFor(() =>
      expect(tutoringApi.fetchTutoringRequests).toHaveBeenCalledWith({
        vista: 'historial',
        size: 20,
      }),
    );
  });
});
