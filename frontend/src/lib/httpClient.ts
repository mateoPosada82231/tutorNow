import { config } from './config';
import { useAuthStore } from '@/stores/useAuthStore';

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  errors?: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface RequestOptions {
  auth?: boolean;
}

async function parseError(response: Response): Promise<never> {
  let data: ApiError | null = null;
  try {
    data = await response.json();
  } catch {
  }
  throw new HttpError(
    response.status,
    data?.message ?? 'Ocurrio un error inesperado. Intenta de nuevo.',
    data?.errors,
  );
}

export const httpClient = {
  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${config.apiUrl}${path}`, {
      headers: buildHeaders(options.auth),
    });
    if (!response.ok) await parseError(response);
    return response.json() as Promise<T>;
  },

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers: buildHeaders(options.auth),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) await parseError(response);
    return response.json() as Promise<T>;
  },
};

function buildHeaders(withAuth = false): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = useAuthStore.getState().token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
