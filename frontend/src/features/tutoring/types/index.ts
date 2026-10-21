import type { CatalogItem } from '@/features/auth/types';

export type { CatalogItem };

export type Modalidad = 'VIRTUAL' | 'PRESENCIAL';

export type SolicitudEstado = 'PUBLICADA' | 'EN_PROCESO' | 'CONFIRMADA' | 'CANCELADA';

export type PropuestaEstado = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export type AsesoriaEstado = 'PENDIENTE';

export interface Asesoria {
  id: number;
  solicitudId: number;
  propuestaId: number;
  estado: AsesoriaEstado;
  tutor: {
    id: number;
    fullName: string;
    biografia: string;
    materias: CatalogItem[];
  };
  createdAt: string;
}

export interface Resena {
  id: number;
  rating: number;
  comentario: string;
  autor: string;
  createdAt: string;
}

export interface TutorSlot {
  id: number;
  diaSemana: string;
  horaInicio: string;
}

export interface TutorProfile {
  id: number;
  fullName: string;
  biografia: string;
  materias: CatalogItem[];
  disponibilidad: TutorSlot[];
  resenas: Resena[];
}

export interface Proposal {
  id: number;
  solicitudId: number;
  mensaje: string;
  estado: PropuestaEstado;
  tutor: {
    id: number;
    fullName: string;
    biografia: string;
    materias: CatalogItem[];
  };
  isMine: boolean;
  createdAt: string;
}

export interface TutoringRequest {
  id: number;
  tema: string;
  modalidad: Modalidad;
  disponibilidad: string;
  descripcion: string | null;
  estado: SolicitudEstado;
  materia: CatalogItem;
  estudiante: { id: number; fullName: string };
  propuestasCount: number;
  isOwner: boolean;
  isProfileMatch: boolean | null;
  propuestas: Proposal[];
  asesoria?: Asesoria | null;
  createdAt: string;
}

export interface TutoringRequestRequest {
  materiaId: number;
  tema: string;
  modalidad: Modalidad;
  disponibilidad: string;
  descripcion?: string;
}

export interface ProposalRequest {
  mensaje: string;
}

export interface TutoringRequestFilters {
  materiaId?: number;
  modalidad?: Modalidad;
  estado?: SolicitudEstado;
  page?: number;
  size?: number;
}

export interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  pagination: Pagination;
}
