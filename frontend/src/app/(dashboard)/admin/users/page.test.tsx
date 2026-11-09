import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsersPage from './page';
import { listAdminUsers, revokeTutor } from '@/features/admin/api/adminApi';

vi.mock('@/features/admin/api/adminApi', () => ({
  listAdminUsers: vi.fn(),
  revokeTutor: vi.fn(),
  restoreTutor: vi.fn(),
  deactivateUser: vi.fn(),
  activateUser: vi.fn(),
  promoteAdmin: vi.fn(),
}));

const listAdminUsersMock = vi.mocked(listAdminUsers);
const revokeTutorMock = vi.mocked(revokeTutor);

const tutor = {
  id: 7,
  email: 'tutor@elpoli.edu.co',
  fullName: 'Tutor Demo',
  role: 'TUTOR' as const,
  active: true,
  verified: true,
  hasTutorProfile: true,
  createdAt: '2026-11-01T00:00:00Z',
  tutorReviews: { averageRating: 1.5, reviewCount: 4 },
};

const estudianteSinPerfil = {
  id: 8,
  email: 'estudiante@elpoli.edu.co',
  fullName: 'Estudiante Demo',
  role: 'ESTUDIANTE' as const,
  active: true,
  verified: true,
  hasTutorProfile: false,
  createdAt: '2026-11-01T00:00:00Z',
  tutorReviews: null,
};

const tutorRevocado = {
  ...estudianteSinPerfil,
  id: 9,
  email: 'revocado@elpoli.edu.co',
  fullName: 'Tutor Revocado',
  hasTutorProfile: true,
};

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAdminUsersMock.mockResolvedValue({
      data: [tutor],
      pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1 },
    });
  });

  it('lista los usuarios con el resumen de resenas del tutor', async () => {
    render(<AdminUsersPage />);

    expect(await screen.findByText('Tutor Demo')).toBeInTheDocument();
    expect(screen.getByText(/Resenas: 1.5\/5 \(4\)/)).toBeInTheDocument();
    expect(listAdminUsersMock).toHaveBeenCalled();
  });

  it('revoca el estado de tutor desde la accion del usuario', async () => {
    const user = userEvent.setup();
    revokeTutorMock.mockResolvedValue({ ...tutor, role: 'ESTUDIANTE' });
    render(<AdminUsersPage />);

    await user.click(await screen.findByRole('button', { name: /revocar tutor/i }));

    await waitFor(() => expect(revokeTutorMock).toHaveBeenCalledWith(7));
  });

  it('muestra estado vacio cuando no hay usuarios', async () => {
    listAdminUsersMock.mockResolvedValue({
      data: [],
      pagination: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
    });

    render(<AdminUsersPage />);

    expect(await screen.findByText(/no hay usuarios que coincidan/i)).toBeInTheDocument();
  });

  it('no ofrece restaurar tutor a estudiantes sin perfil de tutor previo', async () => {
    listAdminUsersMock.mockResolvedValue({
      data: [estudianteSinPerfil],
      pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1 },
    });

    render(<AdminUsersPage />);

    expect(await screen.findByText('Estudiante Demo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restaurar tutor/i })).not.toBeInTheDocument();
  });

  it('ofrece restaurar tutor cuando el tutor fue revocado', async () => {
    listAdminUsersMock.mockResolvedValue({
      data: [tutorRevocado],
      pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1 },
    });

    render(<AdminUsersPage />);

    expect(await screen.findByText('Tutor Revocado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restaurar tutor/i })).toBeInTheDocument();
  });
});
