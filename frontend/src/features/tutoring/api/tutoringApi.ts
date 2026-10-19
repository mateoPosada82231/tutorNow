import { httpClient } from '@/lib/httpClient';
import type {
  CatalogItem,
  Page,
  Proposal,
  ProposalRequest,
  TutoringRequest,
  TutoringRequestFilters,
  TutoringRequestRequest,
} from '../types';

export function fetchTutoringRequests(
  filters: TutoringRequestFilters = {},
): Promise<Page<TutoringRequest>> {
  const params = new URLSearchParams();
  if (filters.materiaId) params.set('materiaId', String(filters.materiaId));
  if (filters.modalidad) params.set('modalidad', filters.modalidad);
  if (filters.estado) params.set('estado', filters.estado);
  params.set('page', String(filters.page ?? 0));
  params.set('size', String(filters.size ?? 10));
  return httpClient.get<Page<TutoringRequest>>(`/tutoring-requests?${params.toString()}`, {
    auth: true,
  });
}

export function fetchTutoringRequest(id: number): Promise<TutoringRequest> {
  return httpClient.get<TutoringRequest>(`/tutoring-requests/${id}`, { auth: true });
}

export function createTutoringRequest(data: TutoringRequestRequest): Promise<TutoringRequest> {
  return httpClient.post<TutoringRequest>('/tutoring-requests', data, { auth: true });
}

export function cancelTutoringRequest(id: number): Promise<void> {
  return httpClient.delete<void>(`/tutoring-requests/${id}`, { auth: true });
}

export function createProposal(solicitudId: number, data: ProposalRequest): Promise<Proposal> {
  return httpClient.post<Proposal>(`/tutoring-requests/${solicitudId}/proposals`, data, {
    auth: true,
  });
}

export function fetchProposals(solicitudId: number): Promise<Proposal[]> {
  return httpClient.get<Proposal[]>(`/tutoring-requests/${solicitudId}/proposals`, { auth: true });
}

export function acceptProposal(id: number): Promise<TutoringRequest> {
  return httpClient.put<TutoringRequest>(`/proposals/${id}/accept`, undefined, { auth: true });
}

export function rejectProposal(id: number): Promise<Proposal> {
  return httpClient.put<Proposal>(`/proposals/${id}/reject`, undefined, { auth: true });
}

export function fetchCatalogoMaterias(): Promise<CatalogItem[]> {
  return httpClient.get<CatalogItem[]>('/catalogs/materias');
}
