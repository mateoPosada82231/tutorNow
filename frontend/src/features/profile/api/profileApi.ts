import { httpClient } from '@/lib/httpClient';
import type {
  CatalogItem,
  TutorProfile,
  TutorProfileRequest,
  UpdateProfileRequest,
  UserProfile,
} from '../types';

export function fetchMyProfile(): Promise<UserProfile> {
  return httpClient.get<UserProfile>('/users/me', { auth: true });
}

export function updateMyProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return httpClient.put<UserProfile>('/users/me', data, { auth: true });
}

export function becomeTutor(data: TutorProfileRequest): Promise<TutorProfile> {
  return httpClient.post<TutorProfile>('/tutors/me', data, { auth: true });
}

export function fetchMyTutorProfile(): Promise<TutorProfile> {
  return httpClient.get<TutorProfile>('/tutors/me', { auth: true });
}

export function updateMyTutorProfile(data: TutorProfileRequest): Promise<TutorProfile> {
  return httpClient.put<TutorProfile>('/tutors/me', data, { auth: true });
}

export function fetchMaterias(): Promise<CatalogItem[]> {
  return httpClient.get<CatalogItem[]>('/catalogs/materias');
}
