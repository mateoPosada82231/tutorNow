import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutoringRequestsPage from './page';
import * as tutoringApi from '@/features/tutoring/api/tutoringApi';
import { useAuthStore } from '@/stores/useAuthStore';
import type { TutoringRequest } from '@/features/tutoring/types';

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
    expect(screen.queryByRole('link', { name: /publicar asesoria/i })).not.toBeInTheDocument();
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
});
