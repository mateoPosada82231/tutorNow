import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';
import * as authApi from '../api/authApi';
import { HttpError } from '@/lib/httpClient';

vi.mock('../api/authApi', () => ({
  registerUser: vi.fn(),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario de registro', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/correo institucional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contrasena/i)).toBeInTheDocument();
  });

  it('muestra error si el correo no es institucional', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@gmail.com');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    expect(await screen.findByText(/correo institucional @elpoli.edu.co/i)).toBeInTheDocument();
    expect(authApi.registerUser).not.toHaveBeenCalled();
  });

  it('muestra error si las contrasenas no coinciden', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@elpoli.edu.co');
    await user.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    await user.type(screen.getByLabelText(/^contrasena$/i), 'Pass123!');
    await user.type(screen.getByLabelText(/confirmar contrasena/i), 'OtraPass1!');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    expect(await screen.findByText(/las contrasenas no coinciden/i)).toBeInTheDocument();
    expect(authApi.registerUser).not.toHaveBeenCalled();
  });

  it('muestra mensaje de verificacion tras registro exitoso', async () => {
    vi.mocked(authApi.registerUser).mockResolvedValue({
      id: 1,
      email: 'test@elpoli.edu.co',
      fullName: 'Test User',
      role: 'ESTUDIANTE',
      requiresVerification: true,
      message: 'Registro exitoso',
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@elpoli.edu.co');
    await user.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    await user.type(screen.getByLabelText(/^contrasena$/i), 'Pass123!');
    await user.type(screen.getByLabelText(/confirmar contrasena/i), 'Pass123!');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    await waitFor(() => {
      expect(screen.getByText(/registro exitoso/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /ir a iniciar sesion/i })).toBeInTheDocument();
  });

  it('muestra error cuando el correo ya existe', async () => {
    vi.mocked(authApi.registerUser).mockRejectedValue(
      new HttpError(409, 'El correo electronico ya esta registrado'),
    );
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/correo institucional/i), 'test@elpoli.edu.co');
    await user.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    await user.type(screen.getByLabelText(/^contrasena$/i), 'Pass123!');
    await user.type(screen.getByLabelText(/confirmar contrasena/i), 'Pass123!');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    expect(await screen.findByText(/ya esta registrado/i)).toBeInTheDocument();
  });
});
