import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequestCard } from './RequestCard';
import type { TutoringRequest } from '../types';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function buildRequest(overrides: Partial<TutoringRequest> = {}): TutoringRequest {
  return {
    id: 7,
    tema: 'Ecuaciones diferenciales',
    modalidad: 'VIRTUAL',
    disponibilidad: 'Lunes y miercoles 2-4pm, sabados manana',
    descripcion: null,
    estado: 'PUBLICADA',
    materia: { id: 1, label: 'Matematicas II' },
    estudiante: { id: 2, fullName: 'Ana Perez' },
    propuestasCount: 3,
    isOwner: false,
    isProfileMatch: null,
    propuestas: [],
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('RequestCard', () => {
  it('renderiza los datos principales de la solicitud', () => {
    render(<RequestCard request={buildRequest()} />);

    expect(screen.getByText('Ecuaciones diferenciales')).toBeInTheDocument();
    expect(screen.getByText('Matematicas II')).toBeInTheDocument();
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('Virtual')).toBeInTheDocument();
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
    expect(screen.getByText('3 propuestas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalle/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/7',
    );
  });

  it('muestra el badge de perfil solo cuando isProfileMatch es true', () => {
    const { rerender } = render(<RequestCard request={buildRequest()} />);
    expect(screen.queryByText(/ajusta a tu perfil/i)).not.toBeInTheDocument();

    rerender(<RequestCard request={buildRequest({ isProfileMatch: true })} />);
    expect(screen.getByText(/ajusta a tu perfil/i)).toBeInTheDocument();
  });

  it('no muestra el badge Mia (el listado del estudiante solo contiene las suyas)', () => {
    render(<RequestCard request={buildRequest({ isOwner: true })} />);

    expect(screen.queryByText('Mia')).not.toBeInTheDocument();
  });

  it('muestra singular de propuestas con un solo propuesta', () => {
    render(<RequestCard request={buildRequest({ propuestasCount: 1 })} />);

    expect(screen.getByText('1 propuesta')).toBeInTheDocument();
  });
});
