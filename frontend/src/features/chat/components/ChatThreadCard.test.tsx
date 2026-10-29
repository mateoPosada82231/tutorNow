'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { ChatThreadCard } from './ChatThreadCard';
import type { ChatResumen } from '../types';

const mockThread: ChatResumen = {
  asesoriaId: 20,
  contraparte: { id: 2, fullName: 'Andres Tutor' },
  materia: 'Calculo Diferencial',
  tema: 'Derivadas',
  estado: 'PENDIENTE',
  permiteEscritura: true,
  ultimoMensaje: 'Hola, coordinemos',
  ultimoMensajeAt: '2026-10-28T15:30:00Z',
  noLeidos: 3,
};

describe('ChatThreadCard', () => {
  it('renderiza el nombre de la contraparte', () => {
    render(<ChatThreadCard thread={mockThread} />);
    expect(screen.getByText('Andres Tutor')).toBeInTheDocument();
  });

  it('renderiza materia y tema', () => {
    render(<ChatThreadCard thread={mockThread} />);
    expect(screen.getByText('Calculo Diferencial — Derivadas')).toBeInTheDocument();
  });

  it('renderiza el badge de no leidos', () => {
    render(<ChatThreadCard thread={mockThread} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renderiza el estado PENDIENTE como "En curso"', () => {
    render(<ChatThreadCard thread={mockThread} />);
    expect(screen.getByText('En curso')).toBeInTheDocument();
  });

  it('renderiza el ultimo mensaje', () => {
    render(<ChatThreadCard thread={mockThread} />);
    expect(screen.getByText('Hola, coordinemos')).toBeInTheDocument();
  });

  it('llama onClick al hacer click', () => {
    const handleClick = vi.fn();
    render(<ChatThreadCard thread={mockThread} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('muestra "Solo lectura" cuando no permite escritura', () => {
    const thread = { ...mockThread, permiteEscritura: false };
    render(<ChatThreadCard thread={thread} />);
    expect(screen.getByText('Solo lectura')).toBeInTheDocument();
  });

  it('muestra "Cancelada" cuando el estado es CANCELADA', () => {
    const thread = { ...mockThread, estado: 'CANCELADA' };
    render(<ChatThreadCard thread={thread} />);
    expect(screen.getAllByText('Cancelada')).toHaveLength(2);
  });

  it('no muestra badge de no leidos cuando es 0', () => {
    const thread = { ...mockThread, noLeidos: 0 };
    render(<ChatThreadCard thread={thread} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('aplica aria-pressed cuando isSelected true', () => {
    render(<ChatThreadCard thread={mockThread} isSelected={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});