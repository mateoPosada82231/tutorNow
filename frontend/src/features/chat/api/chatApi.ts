import { httpClient } from '@/lib/httpClient';
import type { ChatResumen, MensajesPage, EnviarMensajeRequest, MarcarLeidoRequest } from '../types';

export async function fetchChats(): Promise<ChatResumen[]> {
  return httpClient.get<ChatResumen[]>('/chats', { auth: true });
}

export async function fetchChatMessages(
  asesoriaId: number,
  before?: number,
  size?: number,
): Promise<MensajesPage> {
  const params = new URLSearchParams();
  if (before !== undefined) params.set('before', String(before));
  if (size !== undefined) params.set('size', String(size));
  const query = params.toString() ? `?${params.toString()}` : '';
  return httpClient.get<MensajesPage>(`/chats/${asesoriaId}/messages${query}`, { auth: true });
}

export async function sendMessage(
  asesoriaId: number,
  data: EnviarMensajeRequest,
): Promise<MensajesPage['data'][0]> {
  return httpClient.post<MensajesPage['data'][0]>(`/chats/${asesoriaId}/messages`, data, { auth: true });
}

export async function markAsRead(
  asesoriaId: number,
  data: MarcarLeidoRequest,
): Promise<void> {
  return httpClient.patch<void>(`/chats/${asesoriaId}/read`, data, { auth: true });
}