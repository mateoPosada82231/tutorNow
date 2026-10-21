import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProposalCard } from './ProposalCard';
import type { Proposal } from '../types';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function buildProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 10,
    solicitudId: 7,
    mensaje: 'Puedo ayudarte, tuve la materia el semestre pasado con nota 4.5',
    estado: 'PENDIENTE',
    tutor: {
      id: 3,
      fullName: 'Carlos Gomez',
      biografia: 'Tutor de matematicas con dos semestres de experiencia',
      materias: [
        { id: 1, label: 'Matematicas II' },
        { id: 2, label: 'Calculo I' },
      ],
    },
    isMine: false,
    createdAt: '2026-10-02T10:00:00',
    ...overrides,
  };
}

describe('ProposalCard', () => {
  it('renderiza los datos del tutor, el mensaje y el estado', () => {
    render(<ProposalCard proposal={buildProposal()} canDecide={false} />);

    expect(screen.getByText('Carlos Gomez')).toBeInTheDocument();
    expect(screen.getByText(/tuve la materia el semestre pasado/i)).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /materias del tutor/i })).toBeInTheDocument();
    expect(screen.getByText('Matematicas II')).toBeInTheDocument();
  });

  it('muestra los botones de decision cuando la propuesta esta pendiente y el viewer puede decidir', async () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(
      <ProposalCard proposal={buildProposal()} canDecide onAccept={onAccept} onReject={onReject} />,
    );

    await user.click(screen.getByRole('button', { name: /aceptar/i }));
    await user.click(screen.getByRole('button', { name: /rechazar/i }));

    expect(onAccept).toHaveBeenCalledWith(10);
    expect(onReject).toHaveBeenCalledWith(10);
  });

  it('no muestra los botones cuando el viewer no puede decidir', () => {
    render(<ProposalCard proposal={buildProposal()} canDecide={false} />);

    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it('no muestra los botones aunque el viewer pueda decidir si la propuesta no esta pendiente', () => {
    render(
      <ProposalCard
        proposal={buildProposal({ estado: 'ACEPTADA' })}
        canDecide
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText('Aceptada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it('muestra el badge de mi propuesta cuando isMine es true', () => {
    render(<ProposalCard proposal={buildProposal({ isMine: true })} canDecide={false} />);

    expect(screen.getByText('Mi propuesta')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver perfil/i })).not.toBeInTheDocument();
  });

  it('muestra el enlace de ver perfil hacia el perfil del tutor cuando puede decidir', () => {
    render(<ProposalCard proposal={buildProposal()} canDecide />);

    const link = screen.getByRole('link', { name: /ver perfil/i });
    expect(link).toHaveAttribute(
      'href',
      '/tutoring/tutors/3?solicitud=7&proposal=10',
    );
  });

  it('muestra el enlace de ver perfil sin query params cuando la propuesta ya no esta pendiente', () => {
    render(
      <ProposalCard proposal={buildProposal({ estado: 'ACEPTADA' })} canDecide={false} />,
    );

    const link = screen.getByRole('link', { name: /ver perfil/i });
    expect(link).toHaveAttribute('href', '/tutoring/tutors/3');
  });
});
