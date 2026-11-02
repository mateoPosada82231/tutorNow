import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/stores/useAuthStore';

const pushMock = vi.fn();

vi.mock('@/features/chat/api/chatApi', () => ({
  fetchChats: vi.fn().mockResolvedValue([]),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    useAuthStore.setState({
      token: 'token',
      user: { id: 1, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
  });

  it('muestra la marca, el botón de menú principal y el toggle de tema', () => {
    render(<Navbar />);

    expect(screen.getByText('tutorNow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /menú principal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cambiar a tema oscuro/i })).toBeInTheDocument();
  });

  it('abre el menu de usuario con sus datos, accesos y cierra sesion', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByTestId('user-menu-button'));
    expect(await screen.findByText('ana@elpoli.edu.co')).toBeInTheDocument();
    expect(screen.getByText('Estudiante')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /mi perfil/i })).toHaveAttribute(
      'href',
      '/profile',
    );

    await user.click(await screen.findByRole('menuitem', { name: /cerrar sesión/i }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('cierra el menu al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <span>Fuera</span>
        <Navbar />
      </div>,
    );

    await user.click(screen.getByTestId('user-menu-button'));
    expect(await screen.findByText('ana@elpoli.edu.co')).toBeInTheDocument();

    await user.click(screen.getByText('Fuera'));
    expect(screen.queryByText('ana@elpoli.edu.co')).not.toBeInTheDocument();
  });

  it('oculta el enlace del panel de tutor a estudiantes', () => {
    render(<Navbar />);

    expect(screen.queryByRole('link', { name: /panel de tutor/i })).not.toBeInTheDocument();
  });

  it('muestra el enlace del panel de tutor cuando el usuario es tutor', () => {
    useAuthStore.setState({
      token: 'token',
      user: { id: 2, email: 'tutor@elpoli.edu.co', fullName: 'Tutor User', role: 'TUTOR' },
      isAuthenticated: true,
    });
    render(<Navbar />);

    // Open main menu dropdown via hover on the menu button (group hover)
    const menuButton = screen.getByRole('button', { name: /menú principal/i });
    fireEvent.mouseEnter(menuButton);

    expect(screen.getByRole('link', { name: /panel de tutor/i })).toHaveAttribute(
      'href',
      '/tutoring',
    );
  });
});