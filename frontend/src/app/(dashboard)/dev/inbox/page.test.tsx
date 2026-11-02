import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DevInboxPage from './page';
import { httpClient } from '@/lib/httpClient';
import type { CorreoSimulado } from './page';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

function buildCorreo(overrides: Partial<CorreoSimulado> = {}): CorreoSimulado {
  return {
    to: 'ana@elpoli.edu.co',
    subject: 'Ana Perez te envio un mensaje',
    content: 'Hola, quedamos a las 3pm en la biblioteca.',
    link: '/tutoring/chats?chat=10',
    kind: 'new_message',
    createdAt: '2026-11-01T10:00:00',
    ...overrides,
  };
}

describe('DevInboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el estado de carga mientras consulta la bandeja', () => {
    vi.mocked(httpClient.get).mockReturnValue(new Promise(() => {}));
    render(<DevInboxPage />);

    expect(screen.getByLabelText(/cargando bandeja simulada/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /bandeja simulada/i })).not.toBeInTheDocument();
  });

  it('muestra el estado vacio cuando no hay correos simulados', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([]);
    render(<DevInboxPage />);

    expect(await screen.findByRole('heading', { level: 1, name: /bandeja simulada/i })).toBeInTheDocument();
    expect(screen.getByText(/tu bandeja esta vacia/i)).toBeInTheDocument();
    expect(screen.getByText(/envio es simulado/i)).toBeInTheDocument();
  });

  it('muestra el error y permite reintentar', async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('500'));
    render(<DevInboxPage />);

    expect(await screen.findByText(/no se pudieron cargar los correos/i)).toBeInTheDocument();

    const retry = screen.getByRole('button', { name: /reintentar/i });
    vi.mocked(httpClient.get).mockResolvedValue([]);
    await userEvent.click(retry);

    expect(await screen.findByText(/tu bandeja esta vacia/i)).toBeInTheDocument();
    await waitFor(() => expect(httpClient.get).toHaveBeenCalledTimes(2));
  });

  it('renderiza los correos con chip, destinatario y enlace a la conversacion', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([buildCorreo()]);
    render(<DevInboxPage />);

    expect(await screen.findByText('Ana Perez te envio un mensaje')).toBeInTheDocument();
    expect(screen.getByText(/para:/i)).toBeInTheDocument();
    expect(screen.getByText('ana@elpoli.edu.co')).toBeInTheDocument();
    expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir conversación/i })).toHaveAttribute(
      'href',
      '/tutoring/chats',
    );
  });

  it('enlaza los correos sin conversacion como abiertos en una pestaña nueva', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([
      buildCorreo({
        kind: 'verification',
        link: 'http://localhost:3000/verify-email?token=abc',
      }),
    ]);
    render(<DevInboxPage />);

    expect(await screen.findByText('Verificación de correo')).toBeInTheDocument();
    const external = screen.getByRole('link', { name: /ver correo/i });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute(
      'href',
      'http://localhost:3000/verify-email?token=abc',
    );
  });
});
