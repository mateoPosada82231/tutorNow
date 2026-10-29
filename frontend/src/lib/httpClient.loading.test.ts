import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from './httpClient';
import { isGlobalLoading, resetGlobalLoading } from './globalLoading';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

describe('httpClient global loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalLoading();
  });

  it('mantiene el estado de carga mientras la peticion esta en curso', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const request = httpClient.get<{ ok: boolean }>('/ping');
    expect(isGlobalLoading()).toBe(true);

    resolveFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await request;

    expect(isGlobalLoading()).toBe(false);
  });

  it('libera el estado de carga cuando la peticion falla', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));

    await expect(httpClient.get('/boom')).rejects.toThrow();

    expect(isGlobalLoading()).toBe(false);
  });
});
