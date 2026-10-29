import { config } from './config';
import { beginRequest } from './globalLoading';
import { endSession, redirectToLogin } from './session';
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

async function withGlobalLoading<T>(action: () => Promise<T>): Promise<T> {
  const release = beginRequest();
  try {
    return await action();
  } finally {
    release();
  }
}

async function parseError(response: Response, options: RequestOptions): Promise<never> {
  let data: ApiError | null = null;
  try {
    data = await response.json();
  } catch {
  }
  if (response.status === 401 && options.auth) {
    endSession();
    redirectToLogin();
  }
  throw new HttpError(
    response.status,
    data?.message ?? 'Ocurrio un error inesperado. Intenta de nuevo.',
    data?.errors,
  );
}

export const httpClient = {
  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return withGlobalLoading(async () => {
      const response = await fetch(`${config.apiUrl}${path}`, {
        headers: buildHeaders(options.auth),
      });
      if (!response.ok) await parseError(response, options);
      return response.json() as Promise<T>;
    });
  },

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return withGlobalLoading(async () => {
      const response = await fetch(`${config.apiUrl}${path}`, {
        method: 'POST',
        headers: buildHeaders(options.auth),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) await parseError(response, options);
      return response.json() as Promise<T>;
    });
  },

  async put<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return withGlobalLoading(async () => {
      const response = await fetch(`${config.apiUrl}${path}`, {
        method: 'PUT',
        headers: buildHeaders(options.auth),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) await parseError(response, options);
      return response.json() as Promise<T>;
    });
  },

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return withGlobalLoading(async () => {
      const response = await fetch(`${config.apiUrl}${path}`, {
        method: 'DELETE',
        headers: buildHeaders(options.auth),
      });
      if (!response.ok) await parseError(response, options);
      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    });
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
