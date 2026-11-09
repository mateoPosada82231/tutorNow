export type Rol = 'ESTUDIANTE' | 'TUTOR' | 'ADMIN';

export type EstadoModeracion = 'VISIBLE' | 'RETIRADA';

export type EstadoSolicitud = 'PUBLICADA' | 'EN_PROCESO' | 'CONFIRMADA' | 'CANCELADA';

export type EstadoReporte = 'PENDIENTE' | 'RESUELTO' | 'DESCARTADO';

export type TipoReporte = 'PUBLICACION' | 'RESENA' | 'USUARIO';

export interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface AdminUserRatingSummary {
  averageRating: number | null;
  reviewCount: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: Rol;
  active: boolean;
  verified: boolean;
  hasTutorProfile: boolean;
  createdAt: string;
  tutorReviews: AdminUserRatingSummary | null;
}

export interface AdminPublication {
  id: number;
  tema: string;
  descripcion: string | null;
  estado: EstadoSolicitud;
  estadoModeracion: EstadoModeracion;
  createdAt: string;
  materia: { id: number; label: string };
  estudiante: { id: number; fullName: string; email: string };
}

export interface AdminReview {
  id: number;
  asesoriaId: number;
  rolAutor: 'ESTUDIANTE' | 'TUTOR';
  rating: number;
  comentario: string;
  estadoModeracion: EstadoModeracion;
  createdAt: string;
  autor: { id: number; fullName: string; email: string };
}

export interface AdminReportActor {
  id: number;
  fullName: string;
  email: string;
}

export interface AdminReport {
  id: number;
  tipo: TipoReporte;
  targetId: number;
  motivo: string;
  descripcion: string | null;
  estado: EstadoReporte;
  reportador: AdminReportActor;
  resolucion: string | null;
  resueltoAt: string | null;
  resueltoPor: AdminReportActor | null;
  createdAt: string;
}

export interface AdminReportTarget {
  tema?: string;
  descripcion?: string | null;
  estado?: string;
  estadoModeracion?: string;
  rating?: number;
  comentario?: string;
  rolAutor?: string;
  rol?: string;
  activo?: boolean;
  materia?: { id: number; label: string };
  autor?: AdminReportActor;
  estudiante?: AdminReportActor;
}

export interface AdminReportDetail extends AdminReport {
  target: AdminReportTarget | null;
}

export interface AdminUsersFilters {
  rol?: string;
  activo?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminPublicationsFilters {
  estado?: string;
  moderacion?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminReviewsFilters {
  moderacion?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminReportsFilters {
  estado?: string;
  tipo?: string;
  page?: number;
  size?: number;
}
