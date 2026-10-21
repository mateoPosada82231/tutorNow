import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRequireAuth } from './useRequireAuth';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

const fetchMyProfileMock = vi.fn();

vi.mock('@/features/profile/api/profileApi', () => ({
  fetchMyProfile: () => fetchMyProfileMock(),
}));

const sesionValida = {
  token: 'token-123',
  user: { id: 1, email: 'ana@elpoli.edu.co', fullName: 'Ana Perez', role: 'ESTUDIANTE' },
  isAuthenticated: true,
};

describe('useRequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  });

  it('redirige a login cuando no hay token guardado', async () => {
    const { result } = renderHook(() => useRequireAuth());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
    expect(result.current).toBe(false);
  });

  it('valida la sesion contra el backend y habilita el dashboard', async () => {
    useAuthStore.setState(sesionValida);
    fetchMyProfileMock.mockResolvedValue({
      id: 1,
      email: 'ana@elpoli.edu.co',
      fullName: 'Ana Perez',
      role: 'TUTOR',
      carrera: null,
      semestre: null,
      isTutor: true,
    });

    const { result } = renderHook(() => useRequireAuth());

    await waitFor(() => expect(result.current).toBe(true));
    expect(replaceMock).not.toHaveBeenCalled();
    expect(fetchMyProfileMock).toHaveBeenCalled();
    expect(useAuthStore.getState().user?.role).toBe('TUTOR');
  });

  it('cierra la sesion y redirige a login cuando el token ya no es valido', async () => {
    useAuthStore.setState(sesionValida);
    fetchMyProfileMock.mockRejectedValue(new HttpError(401, 'No autenticado'));

    const { result } = renderHook(() => useRequireAuth());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(result.current).toBe(false);
  });

  it('conserva la sesion cuando el backend no responde', async () => {
    useAuthStore.setState(sesionValida);
    fetchMyProfileMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useRequireAuth());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
    expect(useAuthStore.getState().token).toBe('token-123');
    expect(result.current).toBe(false);
  });
});
