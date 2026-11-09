import { httpClient } from '@/lib/httpClient';
import type { CreateReportRequest, ReportResponse } from '../types';

export function createReport(request: CreateReportRequest): Promise<ReportResponse> {
  return httpClient.post<ReportResponse>('/reports', request, { auth: true });
}
