export type ReportTargetType = 'PUBLICACION' | 'RESENA' | 'USUARIO';

export interface CreateReportRequest {
  tipo: ReportTargetType;
  targetId: number;
  motivo: string;
  descripcion?: string;
}

export interface ReportResponse {
  id: number;
  tipo: ReportTargetType;
  targetId: number;
  motivo: string;
  descripcion: string | null;
  estado: 'PENDIENTE' | 'RESUELTO' | 'DESCARTADO';
  createdAt: string;
}
