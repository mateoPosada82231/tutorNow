import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPublicationsPage from './page';
import { listAdminPublications, withdrawPublication } from '@/features/admin/api/adminApi';

vi.mock('@/features/admin/api/adminApi', () => ({
  listAdminPublications: vi.fn(),
  withdrawPublication: vi.fn(),
}));

const listAdminPublicationsMock = vi.mocked(listAdminPublications);
const withdrawPublicationMock = vi.mocked(withdrawPublication);

const publicacion = {
  id: 11,
  tema: 'Publicacion abierta',
  descripcion: 'Descripcion de la publicacion',
  estado: 'PUBLICADA' as const,
  estadoModeracion: 'VISIBLE' as const,
  createdAt: '2026-11-01T00:00:00Z',
  materia: { id: 1, label: 'Calculo Diferencial' },
  estudiante: { id: 4, fullName: 'Estudiante Demo', email: 'estudiante@elpoli.edu.co' },
};

function mockList(data: typeof publicacion[]) {
  listAdminPublicationsMock.mockResolvedValue({
    data,
    pagination: { page: 0, size: 10, totalElements: data.length, totalPages: 1 },
  });
}

describe('AdminPublicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite retirar una publicacion que ya recibio propuestas', async () => {
    const user = userEvent.setup();
    mockList([{ ...publicacion, estado: 'EN_PROCESO' }]);
    withdrawPublicationMock.mockResolvedValue({ ...publicacion, estadoModeracion: 'RETIRADA' });

    render(<AdminPublicationsPage />);

    const button = await screen.findByRole('button', { name: /retirar publicacion/i });
    expect(button).toBeEnabled();

    await user.click(button);

    await waitFor(() => expect(withdrawPublicationMock).toHaveBeenCalledWith(11));
  });

  it('no permite retirar una publicacion de una asesoria ya confirmada', async () => {
    mockList([{ ...publicacion, estado: 'CONFIRMADA' }]);

    render(<AdminPublicationsPage />);

    const button = await screen.findByRole('button', { name: /retirar publicacion/i });
    expect(button).toBeDisabled();
  });
});
