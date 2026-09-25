import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutorPanelPage from '@/app/(dashboard)/tutoring/page';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('TutorPanelPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: null,
      isAuthenticated: false,
    });
  });

  it('muestra una invitacion a ser tutor cuando el usuario no lo es', () => {
    useAuthStore.setState({
      user: { id: 1, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
    });
    render(<TutorPanelPage />);

    expect(screen.getByText(/aun no eres tutor/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a mi perfil/i })).toHaveAttribute(
      'href',
      '/profile',
    );
  });

  it('muestra las herramientas de tutor cuando el rol es TUTOR', () => {
    useAuthStore.setState({
      user: { id: 2, email: 'tutor@elpoli.edu.co', fullName: 'Tutor User', role: 'TUTOR' },
    });
    render(<TutorPanelPage />);

    expect(screen.getByRole('heading', { name: /panel de tutor/i })).toBeInTheDocument();
    expect(screen.getByText(/solicitudes recibidas/i)).toBeInTheDocument();
    expect(screen.getByText(/mi agenda/i)).toBeInTheDocument();
    expect(screen.getByText(/mis resenas/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /editar perfil de tutor/i }),
    ).toHaveAttribute('href', '/profile');
  });
});
