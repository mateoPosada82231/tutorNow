import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BecomeTutorModal } from './BecomeTutorModal';
import * as profileApi from '../api/profileApi';
import type { CatalogItem, TutorProfile } from '../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('../api/profileApi', () => ({
  becomeTutor: vi.fn(),
}));

const materias: CatalogItem[] = [
  { id: 1, label: 'Calculo Diferencial' },
  { id: 2, label: 'Fisica I' },
  { id: 3, label: 'Programacion I' },
];

const tutorProfile: TutorProfile = {
  id: 10,
  biografia: 'Me encanta ensenar matematicas',
  materias: [materias[0]],
  createdAt: '2026-09-25T00:00:00',
};

describe('BecomeTutorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando open es false', () => {
    render(
      <BecomeTutorModal open={false} onClose={vi.fn()} onSuccess={vi.fn()} materias={materias} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra error cuando la biografia es demasiado corta', async () => {
    const user = userEvent.setup();
    render(
      <BecomeTutorModal open onClose={vi.fn()} onSuccess={vi.fn()} materias={materias} />,
    );

    await user.type(screen.getByLabelText(/biografia/i), 'Hola');
    await user.click(screen.getByRole('button', { name: /convertirme en tutor/i }));

    expect(
      await screen.findByText(/la biografia debe tener al menos 10 caracteres/i),
    ).toBeInTheDocument();
    expect(profileApi.becomeTutor).not.toHaveBeenCalled();
  });

  it('selecciona materias y envia con los ids correctos', async () => {
    vi.mocked(profileApi.becomeTutor).mockResolvedValue(tutorProfile);
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <BecomeTutorModal open onClose={vi.fn()} onSuccess={onSuccess} materias={materias} />,
    );

    await user.type(screen.getByLabelText(/biografia/i), 'Me encanta ensenar matematicas');
    await user.click(screen.getByRole('checkbox', { name: /calculo diferencial/i }));
    await user.click(screen.getByRole('checkbox', { name: /programacion i/i }));
    await user.click(screen.getByRole('button', { name: /convertirme en tutor/i }));

    await waitFor(() => {
      expect(profileApi.becomeTutor).toHaveBeenCalledWith({
        biografia: 'Me encanta ensenar matematicas',
        materiaIds: [1, 3],
      });
    });
    expect(onSuccess).toHaveBeenCalledWith(tutorProfile);
  });

  it('exige al menos una materia seleccionada', async () => {
    const user = userEvent.setup();
    render(
      <BecomeTutorModal open onClose={vi.fn()} onSuccess={vi.fn()} materias={materias} />,
    );

    await user.type(screen.getByLabelText(/biografia/i), 'Me encanta ensenar matematicas');
    await user.click(screen.getByRole('button', { name: /convertirme en tutor/i }));

    expect(
      await screen.findByText(/selecciona al menos una materia/i),
    ).toBeInTheDocument();
    expect(profileApi.becomeTutor).not.toHaveBeenCalled();
  });
});
