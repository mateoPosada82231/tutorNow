import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import * as authApi from '../api/authApi';
import { HttpError } from '@/lib/httpClient';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('../api/authApi', () => ({
  loginUser: vi.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los campos de correo y contrasena', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/correo institucional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasena/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('hace login exitoso y redirige al dashboard', async () => {
    vi.mocked(authApi.loginUser).mockResolvedValue({
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      id: 1,
      email: 'test@elpoli.edu.co',
      fullName: 'Test',
      role: 'ESTUDIANTE',
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@elpoli.edu.co');
    await user.type(screen.getByLabelText(/contrasena/i), 'Pass123!');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(authApi.loginUser).toHaveBeenCalledWith({
        email: 'test@elpoli.edu.co',
        password: 'Pass123!',
      });
    });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra error 401 con credenciales incorrectas', async () => {
    vi.mocked(authApi.loginUser).mockRejectedValue(new HttpError(401, 'Unauthorized'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@elpoli.edu.co');
    await user.type(screen.getByLabelText(/contrasena/i), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByText(/correo o contrasena incorrectos/i)).toBeInTheDocument();
  });

  it('muestra aviso de correo no verificado con error 403', async () => {
    vi.mocked(authApi.loginUser).mockRejectedValue(new HttpError(403, 'Forbidden'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@elpoli.edu.co');
    await user.type(screen.getByLabelText(/contrasena/i), 'Pass123!');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByText(/debes confirmar tu correo/i)).toBeInTheDocument();
  });
});
