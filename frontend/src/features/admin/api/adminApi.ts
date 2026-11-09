import { httpClient } from '@/lib/httpClient';
import type {
  AdminPublication,
  AdminReport,
  AdminReportDetail,
  AdminReview,
  AdminUser,
  AdminPublicationsFilters,
  AdminReportsFilters,
  AdminReviewsFilters,
  AdminUsersFilters,
  PageResponse,
} from '../types';

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'string' || typeof value === 'number') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function listAdminUsers(filters: AdminUsersFilters = {}): Promise<PageResponse<AdminUser>> {
  return httpClient.get<PageResponse<AdminUser>>(
    `/admin/users${buildQuery(filters)}`,
    { auth: true },
  );
}

export function revokeTutor(userId: number): Promise<AdminUser> {
  return httpClient.put<AdminUser>(`/admin/users/${userId}/revoke-tutor`, undefined, { auth: true });
}

export function restoreTutor(userId: number): Promise<AdminUser> {
  return httpClient.put<AdminUser>(`/admin/users/${userId}/restore-tutor`, undefined, { auth: true });
}

export function deactivateUser(userId: number): Promise<AdminUser> {
  return httpClient.put<AdminUser>(`/admin/users/${userId}/deactivate`, undefined, { auth: true });
}

export function activateUser(userId: number): Promise<AdminUser> {
  return httpClient.put<AdminUser>(`/admin/users/${userId}/activate`, undefined, { auth: true });
}

export function promoteAdmin(userId: number): Promise<AdminUser> {
  return httpClient.put<AdminUser>(`/admin/users/${userId}/promote-admin`, undefined, { auth: true });
}

export function listAdminPublications(
  filters: AdminPublicationsFilters = {},
): Promise<PageResponse<AdminPublication>> {
  return httpClient.get<PageResponse<AdminPublication>>(
    `/admin/publications${buildQuery(filters)}`,
    { auth: true },
  );
}

export function withdrawPublication(publicationId: number): Promise<AdminPublication> {
  return httpClient.put<AdminPublication>(`/admin/publications/${publicationId}/withdraw`, undefined, {
    auth: true,
  });
}

export function listAdminReviews(
  filters: AdminReviewsFilters = {},
): Promise<PageResponse<AdminReview>> {
  return httpClient.get<PageResponse<AdminReview>>(
    `/admin/reviews${buildQuery(filters)}`,
    { auth: true },
  );
}

export function withdrawReview(reviewId: number): Promise<AdminReview> {
  return httpClient.put<AdminReview>(`/admin/reviews/${reviewId}/withdraw`, undefined, {
    auth: true,
  });
}

export function listAdminReports(
  filters: AdminReportsFilters = {},
): Promise<PageResponse<AdminReport>> {
  return httpClient.get<PageResponse<AdminReport>>(
    `/admin/reports${buildQuery(filters)}`,
    { auth: true },
  );
}

export function fetchAdminReport(reportId: number): Promise<AdminReportDetail> {
  return httpClient.get<AdminReportDetail>(`/admin/reports/${reportId}`, { auth: true });
}

export function resolveReport(data: {
  reportId: number;
  resolucion: string;
}): Promise<AdminReport> {
  return httpClient.put<AdminReport>(`/admin/reports/${data.reportId}/resolve`, { resolucion: data.resolucion }, {
    auth: true,
  });
}

export function dismissReport(data: {
  reportId: number;
  resolucion: string;
}): Promise<AdminReport> {
  return httpClient.put<AdminReport>(`/admin/reports/${data.reportId}/dismiss`, { resolucion: data.resolucion }, {
    auth: true,
  });
}
