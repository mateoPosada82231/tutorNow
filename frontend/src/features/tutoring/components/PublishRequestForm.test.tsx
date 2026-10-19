import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublishRequestForm } from './PublishRequestForm';
import * as tutoringApi from '../api/tutoringApi';
import { HttpError } from '@/lib/httpClient';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('../api/tutoringApi', () => ({
  fetchCatalogoMaterias: vi.fn(),
  createTutoringRequest: vi.fn(),
}));

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByLabelText(/asignatura/i);
  await user.selectOptions(screen.getByLabelText(/asignatura/i), '1');
  await user.type(screen.getByLabelText(/^tema/i), 'Ecuaciones diferenciales');
  await user.selectOptions(screen.getByLabelText(/modalidad/i), 'VIRTUAL');
  await user.type(
    screen.getByLabelText(/disponibilidad/i),
    'Lunes y miercoles 2-4pm, sabados manana',
  );
}

describe('PublishRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tutoringApi.fetchCatalogoMaterias).mockResolvedValue([
      { id: 1, label: 'Matematicas II' },
      { id: 2, label: 'Calculo I' },
    ]);
  });

  it('renderiza todos los campos del formulario', async () => {
    render(<PublishRequestForm />);

    expect(await screen.findByLabelText(/asignatura/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^tema/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/modalidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/disponibilidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripcion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publicar asesoria/i })).toBeInTheDocument();
  });

  it('muestra errores de campos requeridos al enviar vacio', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await screen.findByLabelText(/asignatura/i);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));

    expect(
      await screen.findByText(/selecciona una asignatura/i, { selector: 'p[role="alert"]' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tema de la asesoria es obligatorio/i)).toBeInTheDocument();
    expect(
      screen.getByText(/selecciona una modalidad/i, { selector: 'p[role="alert"]' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/indica tu disponibilidad/i)).toBeInTheDocument();
    expect(tutoringApi.createTutoringRequest).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('muestra error cuando el tema es demasiado corto', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await screen.findByLabelText(/asignatura/i);
    await user.type(screen.getByLabelText(/^tema/i), 'abc');
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));

    expect(await screen.findByText(/al menos 5 caracteres/i)).toBeInTheDocument();
    expect(tutoringApi.createTutoringRequest).not.toHaveBeenCalled();
  });

  it('permite publicar dejando la descripcion vacia', async () => {
    vi.mocked(tutoringApi.createTutoringRequest).mockResolvedValue({
      id: 1,
      tema: 'Ecuaciones diferenciales',
      modalidad: 'VIRTUAL',
      disponibilidad: 'Lunes y miercoles 2-4pm, sabados manana',
      descripcion: null,
      estado: 'PUBLICADA',
      materia: { id: 1, label: 'Matematicas II' },
      estudiante: { id: 2, fullName: 'Ana Perez' },
      propuestasCount: 0,
      isOwner: true,
      isProfileMatch: null,
      propuestas: [],
      createdAt: '2026-10-10T10:00:00',
    });
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith({
        materiaId: 1,
        tema: 'Ecuaciones diferenciales',
        modalidad: 'VIRTUAL',
        disponibilidad: 'Lunes y miercoles 2-4pm, sabados manana',
        descripcion: undefined,
      });
    });
    expect(pushMock).toHaveBeenCalledWith('/tutoring/requests');
  });

  it('muestra el error por campo que devuelve el backend', async () => {
    vi.mocked(tutoringApi.createTutoringRequest).mockRejectedValue(
      new HttpError(400, 'Datos invalidos', { tema: 'Ya existe una asesoria con ese tema' }),
    );
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));

    expect(await screen.findByText(/ya existe una asesoria con ese tema/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('muestra el mensaje general del backend cuando no hay errores por campo', async () => {
    vi.mocked(tutoringApi.createTutoringRequest).mockRejectedValue(
      new HttpError(500, 'Error interno del servidor'),
    );
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));

    expect(await screen.findByText(/error interno del servidor/i)).toBeInTheDocument();
  });
});
