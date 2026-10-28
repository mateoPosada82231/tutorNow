import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HistoryCard } from './HistoryCard';
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
    id: 9,
    tema: 'Integrales por partes',
    modalidad: 'PRESENCIAL',
    disponibilidad: 'Viernes 10-12am',
    descripcion: null,
    estado: 'CONFIRMADA',
    materia: { id: 2, label: 'Calculo Integral' },
    estudiante: { id: 4, fullName: 'Laura Ramirez' },
    propuestasCount: 2,
    isOwner: true,
    isProfileMatch: null,
    propuestas: [],
    asesoria: {
      id: 20,
      solicitudId: 9,
      propuestaId: 7,
      estado: 'FINALIZADA',
      confirmadaEstudiante: true,
      confirmadaTutor: true,
      finalizadaAt: '2026-10-20T10:00:00Z',
      tutor: { id: 5, fullName: 'Tutor User', biografia: '', materias: [] },
      createdAt: '2026-10-02T10:00:00Z',
    },
    createdAt: '2026-10-01T10:00:00',
    ...overrides,
  };
}

describe('HistoryCard', () => {
  it('muestra una asesoria finalizada en solo lectura', () => {
    render(<HistoryCard request={buildRequest()} />);

    expect(screen.getByText('Integrales por partes')).toBeInTheDocument();
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
    expect(screen.getByText(/^tutor:$/i)).toBeInTheDocument();
    expect(screen.getByText('Tutor User')).toBeInTheDocument();
    expect(screen.getByText(/asesoría finalizada el/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalle/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/9',
    );
  });

  it('enlaza de vuelta al historial cuando se indica', () => {
    render(
      <HistoryCard
        request={buildRequest()}
        detailHref="/tutoring/requests/9?from=requests&vista=historial"
      />,
    );

    expect(screen.getByRole('link', { name: /ver detalle/i })).toHaveAttribute(
      'href',
      '/tutoring/requests/9?from=requests&vista=historial',
    );
  });

  it('muestra una asesoria cancelada sin acciones', () => {
    render(
      <HistoryCard
        request={buildRequest({
          estado: 'CANCELADA',
          asesoria: {
            ...buildRequest().asesoria!,
            estado: 'CANCELADA',
            finalizadaAt: null,
          },
        })}
      />,
    );

    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.getByText('Esta asesoría fue cancelada.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra la cancelacion aunque no haya tutor asignado', () => {
    render(<HistoryCard request={buildRequest({ estado: 'CANCELADA', asesoria: null })} />);

    expect(screen.getByText('Sin tutor asignado')).toBeInTheDocument();
    expect(
      screen.getByText('Esta solicitud fue cancelada antes de asignar un tutor.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('para el tutor muestra al estudiante', () => {
    render(<HistoryCard request={buildRequest({ isOwner: false })} />);

    expect(screen.getByText(/^estudiante:$/i)).toBeInTheDocument();
    expect(screen.getByText('Laura Ramirez')).toBeInTheDocument();
    expect(screen.queryByText(/^tutor:$/i)).not.toBeInTheDocument();
  });
});
