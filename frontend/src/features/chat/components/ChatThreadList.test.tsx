'use client';

import { render, screen, waitFor } from '@testing-library/react';
import { ChatThreadList } from './ChatThreadList';
import type { ChatResumen } from '../types';

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
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista de hilos cuando recibe threads', () => {
    render(<ChatThreadList threads={mockThreads} selectedId={null} onSelect={onSelect} />);
    expect(screen.getByText('Andres Tutor')).toBeInTheDocument();
    expect(screen.getByText('Maria Tutor')).toBeInTheDocument();
    expect(screen.getByText('Calculo — Derivadas')).toBeInTheDocument();
    expect(screen.getByText('Fisica — Cinematica')).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay hilos', () => {
    render(<ChatThreadList threads={[]} selectedId={null} onSelect={onSelect} />);
    expect(screen.getByText('No tienes chats activos')).toBeInTheDocument();
  });

  it('llama onSelect al hacer click en un hilo', () => {
    render(<ChatThreadList threads={mockThreads} selectedId={null} onSelect={onSelect} />);
    const first = screen.getAllByRole('button')[0];
    first.click();
    expect(onSelect).toHaveBeenCalledWith(20);
  });

  it('aplica estilo seleccionado al hilo activo', () => {
    render(<ChatThreadList threads={mockThreads} selectedId={20} onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('no renderiza loading ni error (componente controlado)', () => {
    render(<ChatThreadList threads={mockThreads} selectedId={null} onSelect={onSelect} />);
    expect(screen.queryByText('Cargando chats...')).not.toBeInTheDocument();
    expect(screen.queryByText('No se pudieron cargar los chats')).not.toBeInTheDocument();
  });
});