import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AcceptedRequestCard } from './AcceptedRequestCard';
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
    id: 3,
    tema: 'Integrales por partes',
    modalidad: 'PRESENCIAL',
    disponibilidad: 'Viernes 10-12am',
    descripcion: null,
    estado: 'CONFIRMADA',
    materia: { id: 2, label: 'Calculo Integral' },
    estudiante: { id: 4, fullName: 'Laura Ramirez' },
    propuestasCount: 2,
    isOwner: false,
    isProfileMatch: null,
    propuestas: [],
    asesoria: {
      id: 20,
      solicitudId: 3,
      propuestaId: 9,
      estado: 'PENDIENTE',
      tutor: { id: 5, fullName: 'Tutor User', biografia: '', materias: [] },
      createdAt: '2026-10-20T10:00:00Z',
    },
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('AcceptedRequestCard', () => {
  it('renderiza los datos de la asesoria aceptada', () => {
    render(<AcceptedRequestCard request={buildRequest()} />);

    expect(screen.getByText('Integrales por partes')).toBeInTheDocument();
    expect(screen.getByText('Calculo Integral')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Presencial')).toBeInTheDocument();
    expect(screen.getByText('Laura Ramirez')).toBeInTheDocument();
    expect(screen.getByText('Viernes 10-12am')).toBeInTheDocument();
    expect(screen.getByText(/aceptada el:/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver asesor/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/3',
    );
  });

  it('muestra la descripcion solo cuando existe', () => {
    const { rerender } = render(<AcceptedRequestCard request={buildRequest()} />);
    expect(screen.queryByText(/tarea 3/i)).not.toBeInTheDocument();

    rerender(
      <AcceptedRequestCard request={buildRequest({ descripcion: 'Necesito ayuda con la tarea 3' })} />,
    );
    expect(screen.getByText('Necesito ayuda con la tarea 3')).toBeInTheDocument();
  });

  it('usa la fecha de la solicitud si falta la asesoria', () => {
    render(<AcceptedRequestCard request={buildRequest({ asesoria: null })} />);

    expect(screen.getByText(/aceptada el:/i)).toBeInTheDocument();
  });
});
