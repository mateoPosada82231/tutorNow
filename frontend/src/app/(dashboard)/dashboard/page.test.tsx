import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatUnreadSync } from '@/features/chat/hooks/useChatUnreadSync';
import { fetchChats } from '@/features/chat/api/chatApi';
import { useChatUnreadStore } from '@/features/chat/stores/useChatUnreadStore';
import type { ChatResumen } from '@/features/chat/types';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/chat/api/chatApi', () => ({
  fetchChats: vi.fn(),
}));

function buildChat(overrides: Partial<ChatResumen> = {}): ChatResumen {
  return {
    asesoriaId: 10,
    contraparte: { id: 5, fullName: 'Carlos Gomez' },
    materia: 'Matematicas II',
    tema: 'Derivadas',
    estado: 'PENDIENTE',
    permiteEscritura: true,
    ultimoMensaje: 'Hola, quedamos a las 3pm',
    ultimoMensajeAt: '2026-11-01T10:00:00',
    noLeidos: 3,
    ...overrides,
  };
}

function DashboardWithUnreadSync() {
  useChatUnreadSync();
  return <DashboardPage />;
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatUnreadStore.setState({ unreadCounts: {} });
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

  it('muestra el banner de mensajes sin leer y enlaza a los chats', async () => {
    setState('ESTUDIANTE');
    vi.mocked(fetchChats).mockResolvedValue([buildChat({ asesoriaId: 10, noLeidos: 3 })]);
    render(<DashboardWithUnreadSync />);

    expect(await screen.findByText('Tienes 3 mensajes sin leer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver mensajes/i })).toHaveAttribute(
      'href',
      '/tutoring/chats',
    );
    expect(screen.getByText(/correo simulado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bandeja de entrada/i })).toHaveAttribute(
      'href',
      '/dev/inbox',
    );
    await waitFor(() => expect(useChatUnreadStore.getState().getTotal()).toBe(3));
  });

  it('no muestra el banner cuando todos los hilos estan leidos', async () => {
    setState('ESTUDIANTE');
    vi.mocked(fetchChats).mockResolvedValue([buildChat({ asesoriaId: 10, noLeidos: 0 })]);
    render(<DashboardWithUnreadSync />);

    expect(await screen.findByRole('heading', { name: /hola/i })).toBeInTheDocument();
    expect(screen.queryByText(/mensaje sin leer/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver mensajes/i })).not.toBeInTheDocument();
    await waitFor(() => expect(fetchChats).toHaveBeenCalledTimes(1));
  });

  it('ignora silenciosamente un fallo de sincronizacion y conserva la bandeja como estaba', async () => {
    setState('ESTUDIANTE');
    vi.mocked(fetchChats).mockRejectedValue(new Error('503'));
    render(<DashboardWithUnreadSync />);

    await waitFor(() => expect(fetchChats).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/mensaje sin leer/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver mensajes/i })).not.toBeInTheDocument();
    expect(useChatUnreadStore.getState().getTotal()).toBe(0);
  });
});
