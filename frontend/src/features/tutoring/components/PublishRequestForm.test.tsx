import { render, screen, waitFor, within } from '@testing-library/react';
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
  fetchMisResenas: vi.fn(),
  fetchTutores: vi.fn(),
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
    vi.mocked(tutoringApi.fetchMisResenas).mockResolvedValue({
      promedioRating: null,
      totalResenas: 0,
      resenasRecibidas: [],
      pendientes: [],
    });
    vi.mocked(tutoringApi.fetchTutores).mockResolvedValue([
      { id: 10, nombre: 'Laura Gomez', materias: [{ id: 1, label: 'Matematicas II' }] },
      { id: 11, nombre: 'Pedro Ruiz', materias: [{ id: 2, label: 'Calculo I' }] },
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
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith({
        materiaId: 1,
        tema: 'Ecuaciones diferenciales',
        modalidad: 'VIRTUAL',
        disponibilidad: 'Lunes y miercoles 2-4pm, sabados manana',
        descripcion: undefined,
        tutorIds: [],
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
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

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
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    expect(await screen.findByText(/error interno del servidor/i)).toBeInTheDocument();
  });

  it('muestra un modal con los detalles de la asesoria antes de publicar', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));

    expect(
      await screen.findByRole('heading', { name: /confirma los detalles de tu asesoria/i }),
    ).toBeInTheDocument();
    const dialogo = screen.getByRole('dialog', { name: /confirma los detalles de tu asesoria/i });
    expect(within(dialogo).getByText('Matematicas II')).toBeInTheDocument();
    expect(within(dialogo).getByText('Ecuaciones diferenciales')).toBeInTheDocument();
    expect(within(dialogo).getByText('Virtual')).toBeInTheDocument();
    expect(
      within(dialogo).getByText('Lunes y miercoles 2-4pm, sabados manana'),
    ).toBeInTheDocument();
    expect(tutoringApi.createTutoringRequest).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('cancelar la confirmacion vuelve al formulario sin publicar', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    await user.click(await screen.findByRole('button', { name: /seguir editando/i }));

    expect(
      screen.queryByRole('heading', { name: /confirma los detalles de tu asesoria/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^tema/i)).toBeInTheDocument();
    expect(tutoringApi.createTutoringRequest).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    expect(
      await screen.findByRole('heading', { name: /confirma los detalles de tu asesoria/i }),
    ).toBeInTheDocument();
  });

  it('permite abrir la seleccion opcional de tutores sin enviar nada al abrir', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await screen.findByLabelText(/asignatura/i);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));

    expect(await screen.findByRole('group', { name: /tutores que podran ver/i })).toBeInTheDocument();
    expect(await screen.findByText('Laura Gomez')).toBeInTheDocument();
    expect(screen.getByText(/todos los tutores podran ver tu publicacion/i)).toBeInTheDocument();
    expect(tutoringApi.createTutoringRequest).not.toHaveBeenCalled();
  });

  it('envia los tutores seleccionados en la publicacion', async () => {
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
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));
    await user.click(await screen.findByRole('checkbox', { name: /laura gomez/i }));
    expect(screen.getByText(/1 de 2 tutores seleccionados/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith(
        expect.objectContaining({ tutorIds: [10] }),
      );
    });
    expect(pushMock).toHaveBeenCalledWith('/tutoring/requests');
  });

  it('permite deseleccionar un tutor antes de publicar', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));
    const checkbox = await screen.findByRole('checkbox', { name: /laura gomez/i });
    await user.click(checkbox);
    await user.click(checkbox);
    expect(screen.getByText(/0 de 2 tutores seleccionados/i)).toBeInTheDocument();
  });
});
