import { httpClient } from '@/lib/httpClient';
import type { TutorSlot, TutorSlotsRequest } from '../types';

export function fetchMySlots(): Promise<TutorSlot[]> {
  return httpClient.get<TutorSlot[]>('/tutors/me/slots', { auth: true });
}

export function saveMySlots(data: TutorSlotsRequest): Promise<TutorSlot[]> {
  return httpClient.put<TutorSlot[]>('/tutors/me/slots', data, { auth: true });
}
