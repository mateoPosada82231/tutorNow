import { describe, expect, it } from 'vitest';
import { estadoCiclo } from './estadoCiclo';
import type { Asesoria, TutoringRequest } from '../types';

function buildRequest(
  estado: TutoringRequest['estado'],
  asesoria: Asesoria | null = null,
): TutoringRequest {
  return {
    id: 1,
    tema: 'Derivadas',
    modalidad: 'VIRTUAL',
    disponibilidad: 'Lunes 8-10am',
    descripcion: null,
    estado,
    materia: { id: 1, label: 'Calculo' },
    estudiante: { id: 1, fullName: 'Joseph Rojas' },
    propuestasCount: 0,
    isOwner: true,
    isProfileMatch: null,
    propuestas: [],
    asesoria,
    createdAt: '2026-10-01T10:00:00',
  };
}

function buildAsesoria(estado: Asesoria['estado']): Asesoria {
  return {
    id: 1,
    solicitudId: 1,
    propuestaId: 1,
    estado,
    confirmadaEstudiante: false,
    confirmadaTutor: false,
    finalizadaAt: null,
    tutor: { id: 1, fullName: 'Andres', biografia: '', materias: [] },
    createdAt: '2026-10-01T10:00:00',
  };
}

describe('estadoCiclo', () => {
  it('etiqueta las solicitudes sin asesoria', () => {
    expect(estadoCiclo(buildRequest('PUBLICADA')).label).toBe('Publicada');
    expect(estadoCiclo(buildRequest('EN_PROCESO')).label).toBe('Con propuestas');
    expect(estadoCiclo(buildRequest('CONFIRMADA')).label).toBe('En coordinación');
  });

  it('etiqueta las asesorias en coordinacion como confirmadas', () => {
    const request = buildRequest('CONFIRMADA', buildAsesoria('PENDIENTE'));

    expect(estadoCiclo(request).label).toBe('En coordinación');
  });

  it('muestra la finalizacion y la evaluacion', () => {
    expect(estadoCiclo(buildRequest('CONFIRMADA', buildAsesoria('FINALIZADA'))).label).toBe(
      'Finalizada',
    );
    expect(estadoCiclo(buildRequest('CONFIRMADA', buildAsesoria('EVALUADA'))).label).toBe(
      'Evaluada',
    );
  });

  it('prioriza cancelada sobre cualquier otro estado', () => {
    expect(estadoCiclo(buildRequest('CANCELADA')).label).toBe('Cancelada');
    expect(
      estadoCiclo(buildRequest('CONFIRMADA', buildAsesoria('CANCELADA'))).label,
    ).toBe('Cancelada');
    expect(
      estadoCiclo(buildRequest('CANCELADA', buildAsesoria('CANCELADA'))).label,
    ).toBe('Cancelada');
  });
});
