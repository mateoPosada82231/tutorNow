import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('DashboardPage', () => {
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

  it('enlaza la tarjeta de asesorias al tablero para estudiantes', () => {
    setState('ESTUDIANTE');
    render(<DashboardPage />);

    const card = screen.getByRole('link', { name: /publica lo que necesitas/i });
    expect(card).toHaveAttribute('href', '/tutoring/requests');
    expect(screen.queryByRole('link', { name: /panel de tutor/i })).not.toBeInTheDocument();
  });

  it('enlaza la tarjeta de asesorias al tablero tambien para tutores', () => {
    setState('TUTOR');
    render(<DashboardPage />);

    const panel = screen.getByRole('link', { name: /panel de tutor/i });
    expect(panel).toHaveAttribute('href', '/tutoring');

    expect(screen.getByRole('link', { name: /publica tus propias demandas/i })).toHaveAttribute(
      'href',
      '/tutoring/requests',
    );
  });
});
