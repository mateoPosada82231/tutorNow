import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewTutoringRequestPage from './page';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/tutoring/api/tutoringApi', () => ({
  fetchCatalogoMaterias: vi.fn().mockResolvedValue([{ id: 1, label: 'Matematicas II' }]),
  createTutoringRequest: vi.fn(),
}));

describe('NewTutoringRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setState(role: 'ESTUDIANTE' | 'TUTOR') {
    useAuthStore.setState({
      token: 'token',
      user:
        role === 'TUTOR'
          ? { id: 3, email: 'tutor@elpoli.edu.co', fullName: 'Carlos Gomez', role }
          : { id: 2, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role },
      isAuthenticated: true,
    });
  }

  it('muestra el formulario de publicacion para estudiantes', async () => {
    setState('ESTUDIANTE');
    render(<NewTutoringRequestPage />);

    expect(screen.getByRole('heading', { name: /publicar asesoria/i })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /publicar asesoria/i })).toBeEnabled(),
    );
  });

  it('permita a un tutor publicar una demanda cuando necesita ayuda', async () => {
    setState('TUTOR');
    render(<NewTutoringRequestPage />);

    expect(screen.getByRole('heading', { name: /publicar demanda/i })).toBeInTheDocument();
    expect(
      screen.getByText(/tambien puedes necesitar ayuda en materias que no manejas/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /publicar asesoria/i })).toBeEnabled(),
    );
  });
});
