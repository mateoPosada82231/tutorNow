import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateMyProfile, becomeTutor, fetchMaterias, fetchMyProfile } from './profileApi';
import { useAuthStore } from '@/stores/useAuthStore';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

function okJson(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('profileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: 'token-123',
      user: { id: 1, email: 'test@elpoli.edu.co', fullName: 'Test', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
  });

  it('fetchMyProfile hace GET autenticado a /users/me', async () => {
    fetchMock.mockReturnValue(okJson({ id: 1, isTutor: false }));

    const result = await fetchMyProfile();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      }),
    );
    expect(result).toEqual({ id: 1, isTutor: false });
  });

  it('updateMyProfile hace PUT autenticado con el body', async () => {
    fetchMock.mockReturnValue(okJson({ id: 1 }));

    await updateMyProfile({ fullName: 'Nuevo Nombre', carreraId: 1, semestreId: 2 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
        body: JSON.stringify({ fullName: 'Nuevo Nombre', carreraId: 1, semestreId: 2 }),
      }),
    );
  });

  it('becomeTutor hace POST autenticado a /tutors/me', async () => {
    fetchMock.mockReturnValue(okJson({ id: 10 }, 201));

    await becomeTutor({ biografia: 'Me encanta ensenar', materiaIds: [1, 2] });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/tutors/me'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
        body: JSON.stringify({ biografia: 'Me encanta ensenar', materiaIds: [1, 2] }),
      }),
    );
  });

  it('fetchMaterias hace GET publico sin Authorization', async () => {
    fetchMock.mockReturnValue(okJson([{ id: 1, label: 'Calculo' }]));

    const result = await fetchMaterias();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
    expect(result).toEqual([{ id: 1, label: 'Calculo' }]);
  });
});
