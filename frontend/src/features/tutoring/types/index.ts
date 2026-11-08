import type { CatalogItem } from '@/features/auth/types';

export type { CatalogItem };

export type Modalidad = 'VIRTUAL' | 'PRESENCIAL';

export type SolicitudEstado = 'PUBLICADA' | 'EN_PROCESO' | 'CONFIRMADA' | 'CANCELADA';

export type PropuestaEstado = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export type AsesoriaEstado = 'PENDIENTE' | 'FINALIZADA' | 'EVALUADA' | 'CANCELADA';

export type EstadoEvaluacion = 'PENDIENTE' | 'ESPERANDO_CONTRAPARTE' | 'COMPLETA';

export type RolAutorResena = 'ESTUDIANTE' | 'TUTOR';

export type VistaSolicitudes = 'abiertas' | 'coordinacion' | 'historial';

export interface Resena {
  id: number;
  rolAutor: RolAutorResena;
  rating: number;
  comentario: string;
  createdAt: string;
}

export interface TutorResena {
  id: number;
  rating: number;
  comentario: string;
  createdAt: string;
}

export interface Asesoria {
  id: number;
  solicitudId: number;
  propuestaId: number;
  estado: AsesoriaEstado;
  confirmadaEstudiante: boolean;
  confirmadaTutor: boolean;
  finalizadaAt: string | null;
  estadoEvaluacion?: EstadoEvaluacion;
  miResena?: Resena | null;
  resenaContraparte?: Resena | null;
  tutor: {
    id: number;
    fullName: string;
    biografia: string;
    materias: CatalogItem[];
  };
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
  promedioRating?: number | null;
  totalResenas?: number;
  resenas: TutorResena[];
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

export interface ResenaRequest {
  rating: number;
  comentario: string;
}

export interface ResenaPendiente {
  asesoriaId: number;
  solicitudId: number;
  tema: string;
  contraparte: string;
  finalizadaAt: string;
}

export interface ResenaRecibida {
  id: number;
  rating: number;
  comentario: string;
  createdAt: string;
}

export interface MisResenas {
  promedioRating: number | null;
  totalResenas: number;
  resenasRecibidas: ResenaRecibida[];
  pendientes: ResenaPendiente[];
}

export interface TutoringRequestFilters {
  materiaId?: number;
  modalidad?: Modalidad;
  estado?: SolicitudEstado | AsesoriaEstado;
  vista?: VistaSolicitudes;
  q?: string;
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
