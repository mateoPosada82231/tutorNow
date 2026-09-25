import type { CatalogItem } from '@/features/auth/types';

export type { CatalogItem };

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: string;
  carrera: CatalogItem | null;
  semestre: CatalogItem | null;
  isTutor: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
  carreraId: number;
  semestreId: number;
}

export interface TutorProfile {
  id: number;
  biografia: string;
  materias: CatalogItem[];
  createdAt: string;
}

export interface TutorProfileRequest {
  biografia: string;
  materiaIds: number[];
}
