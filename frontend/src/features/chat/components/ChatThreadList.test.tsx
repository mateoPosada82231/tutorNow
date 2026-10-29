'use client';

import { render, screen, waitFor, act } from '@testing-library/react';
import { ChatThreadList } from './ChatThreadList';
import { fetchChats } from '../api/chatApi';
import { useChatUnreadStore } from '../stores/useChatUnreadStore';
import type { ChatResumen } from '../types';

vi.mock('../api/chatApi');
vi.mock('../stores/useChatUnreadStore');

const mockThreads: ChatResumen[] = [
  {
    asesoriaId: 20,
    contraparte: { id: 2, fullName: 'Andres Tutor' },
    materia: 'Calculo',
    tema: 'Derivadas',
    estado: 'PENDIENTE',
    permiteEscritura: true,
    ultimoMensaje: 'Hola',
    ultimoMensajeAt: '2026-10-28T15:30:00Z',
    noLeidos: 2,
  },
  {
    asesoriaId: 21,
    contraparte: { id: 3, fullName: 'Maria Tutor' },
    materia: 'Fisica',
    tema: 'Cinematica',
    estado: 'FINALIZADA',
    permiteEscritura: false,
    ultimoMensaje: 'Gracias',
    ultimoMensajeAt: '2026-10-27T10:00:00Z',
    noLeidos: 0,
  },
];

describe('ChatThreadList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatUnreadStore).mockReturnValue({
      unreadCounts: {},
      setCount: vi.fn(),
      getTotal: vi.fn(() => 2),
      increment: vi.fn(),
    });
  });

  it('muestra loading mientras carga', () => {
    vi.mocked(fetchChats).mockImplementation(() => new Promise(() => {}));
    render(<ChatThreadList />);
    expect(screen.getByText('Cargando chats...')).toBeInTheDocument();
  });

  it('renderiza la lista de hilos cuando carga exitosamente', async () => {
    vi.mocked(fetchChats).mockResolvedValue(mockThreads);
    render(<ChatThreadList />);
    await waitFor(() => expect(screen.getByText('Andres Tutor')).toBeInTheDocument());
    expect(screen.getByText('Maria Tutor')).toBeInTheDocument();
    expect(screen.getByText('Calculo — Derivadas')).toBeInTheDocument();
    expect(screen.getByText('Fisica — Cinematica')).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay hilos', async () => {
    vi.mocked(fetchChats).mockResolvedValue([]);
    render(<ChatThreadList />);
    await waitFor(() => expect(screen.getByText('No tienes chats activos')).toBeInTheDocument());
  });

  it('muestra error cuando la carga falla', async () => {
    vi.mocked(fetchChats).mockRejectedValue(new Error('Network error'));
    render(<ChatThreadList />);
    await waitFor(() => expect(screen.getByText('No se pudieron cargar los chats')).toBeInTheDocument());
  });

  it('sincroniza contadores de no leidos con el store', async () => {
    vi.mocked(fetchChats).mockResolvedValue(mockThreads);
    const setCount = vi.fn();
    vi.mocked(useChatUnreadStore).mockReturnValue({
      unreadCounts: { 20: 5 },
      setCount,
      getTotal: vi.fn(() => 5),
      increment: vi.fn(),
    });
    render(<ChatThreadList />);
    await waitFor(() => expect(setCount).toHaveBeenCalledWith(20, 2));
  });
});