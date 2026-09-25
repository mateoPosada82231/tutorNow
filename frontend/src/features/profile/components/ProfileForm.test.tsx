import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from './ProfileForm';
import * as profileApi from '../api/profileApi';
import { fetchCarreras, fetchSemestres } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserProfile } from '../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/features/auth/api/authApi', () => ({
  fetchCarreras: vi.fn(),
  fetchSemestres: vi.fn(),
}));

vi.mock('../api/profileApi', () => ({
  updateMyProfile: vi.fn(),
}));

const profile: UserProfile = {
  id: 1,
  email: 'test@elpoli.edu.co',
  fullName: 'Test User',
  role: 'ESTUDIANTE',
  carrera: { id: 1, label: 'Ingenieria de Software' },
  semestre: { id: 2, label: 'Segundo semestre' },
  isTutor: false,
};

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: 'token',
      user: { id: 1, email: 'test@elpoli.edu.co', fullName: 'Test User', role: 'ESTUDIANTE' },
      isAuthenticated: true,
    });
    vi.mocked(fetchCarreras).mockResolvedValue([
      { id: 1, label: 'Ingenieria de Software' },
      { id: 2, label: 'Derecho' },
    ]);
    vi.mocked(fetchSemestres).mockResolvedValue([
      { id: 1, label: 'Primer semestre' },
      { id: 2, label: 'Segundo semestre' },
    ]);
  });

  it('renderiza el perfil con los valores actuales', async () => {
    render(<ProfileForm profile={profile} onSaved={vi.fn()} />);

    const nameInput = await screen.findByLabelText(/nombre completo/i);
    expect(nameInput).toHaveValue('Test User');
    expect(screen.getByText('test@elpoli.edu.co')).toBeInTheDocument();
    expect(screen.getByText('ESTUDIANTE')).toBeInTheDocument();
    expect(await screen.findByLabelText(/carrera/i)).toHaveValue('1');
    expect(screen.getByLabelText(/semestre/i)).toHaveValue('2');
  });

  it('guarda cambios llamando updateMyProfile y updateUser', async () => {
    const updated: UserProfile = { ...profile, fullName: 'Nuevo Nombre' };
    vi.mocked(profileApi.updateMyProfile).mockResolvedValue(updated);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<ProfileForm profile={profile} onSaved={onSaved} />);

    const nameInput = await screen.findByLabelText(/nombre completo/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Nuevo Nombre');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(profileApi.updateMyProfile).toHaveBeenCalledWith({
        fullName: 'Nuevo Nombre',
        carreraId: 1,
        semestreId: 2,
      });
    });
    expect(useAuthStore.getState().user?.fullName).toBe('Nuevo Nombre');
    expect(onSaved).toHaveBeenCalledWith(updated);
    expect(
      await screen.findByText(/tu perfil se actualizo correctamente/i),
    ).toBeInTheDocument();
  });

  it('muestra error de validacion si el nombre es invalido', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={profile} onSaved={vi.fn()} />);

    const nameInput = await screen.findByLabelText(/nombre completo/i);
    await user.clear(nameInput);
    await user.type(nameInput, '123');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(
      await screen.findByText(/el nombre solo debe contener letras/i),
    ).toBeInTheDocument();
    expect(profileApi.updateMyProfile).not.toHaveBeenCalled();
  });

  it('maneja usuarios legacy sin carrera ni semestre y exige seleccionarlos', async () => {
    const legacy: UserProfile = { ...profile, carrera: null, semestre: null };
    const user = userEvent.setup();
    render(<ProfileForm profile={legacy} onSaved={vi.fn()} />);

    const carreraSelect = await screen.findByLabelText(/carrera/i);
    expect(carreraSelect).toHaveValue('');
    expect(screen.getByLabelText(/semestre/i)).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await screen.findByText(/selecciona una carrera/i)).toBeInTheDocument();
    expect(screen.getByText(/selecciona un semestre/i)).toBeInTheDocument();
    expect(profileApi.updateMyProfile).not.toHaveBeenCalled();

    await user.selectOptions(carreraSelect, '2');
    await user.selectOptions(screen.getByLabelText(/semestre/i), '1');
    expect(carreraSelect).toHaveValue('2');
    expect(screen.getByLabelText(/semestre/i)).toHaveValue('1');
  });
});
