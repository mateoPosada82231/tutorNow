import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublishRequestForm } from './PublishRequestForm';
import * as tutoringApi from '../api/tutoringApi';

// Independent verifier probe for S2 (T2): optional tutor audience selector.
// Written by the verifier, not by the feature author.

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

describe('T2VerifierProbe PublishRequestForm audiencia opcional', () => {
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

  it('S2.1/S2.2: el selector es opcional y sin abrirlo el submit envia tutorIds vacio', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    const boton = await screen.findByRole('button', { name: /elegir tutores/i });
    expect(boton).toHaveTextContent(/opcional/i);
    // cerrado por defecto: no hay grupo de seleccion
    expect(screen.queryByRole('group', { name: /tutores que podran ver/i })).toBeNull();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith(
        expect.objectContaining({ tutorIds: [] }),
      );
    });
    // nunca se abrio el selector: no se pidio la lista de tutores
    expect(tutoringApi.fetchTutores).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/tutoring/requests');
  });

  it('S2.1: al abrir el selector se piden los tutores y se muestran nombre y materias', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await screen.findByLabelText(/asignatura/i);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));

    const grupo = await screen.findByRole('group', { name: /tutores que podran ver/i });
    expect(grupo).toBeInTheDocument();
    expect(tutoringApi.fetchTutores).toHaveBeenCalledTimes(1);
    expect(within(grupo).getByText('Laura Gomez')).toBeInTheDocument();
    expect(within(grupo).getByText('Pedro Ruiz')).toBeInTheDocument();
    expect(within(grupo).getByText('Matematicas II')).toBeInTheDocument();
    expect(within(grupo).getByText('Calculo I')).toBeInTheDocument();
    expect(within(grupo).getByText(/todos los tutores podran ver tu publicacion/i)).toBeInTheDocument();
    // abrir el selector no publica nada
    expect(tutoringApi.createTutoringRequest).not.toHaveBeenCalled();
  });

  it('S2.1: enviar con un tutor seleccionado lo incluye en tutorIds', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));
    await user.click(await screen.findByRole('checkbox', { name: /laura gomez/i }));
    expect(screen.getByText('1 de 2 tutores seleccionados')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith(
        expect.objectContaining({ tutorIds: [10] }),
      );
    });
    expect(pushMock).toHaveBeenCalledWith('/tutoring/requests');
  });

  it('S2.1: permite seleccionar mas de un tutor (uno o mas)', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));
    await user.click(await screen.findByRole('checkbox', { name: /laura gomez/i }));
    await user.click(await screen.findByRole('checkbox', { name: /pedro ruiz/i }));
    expect(screen.getByText('2 de 2 tutores seleccionados')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith(
        expect.objectContaining({ tutorIds: [10, 11] }),
      );
    });
  });
  it('S2.1: deseleccionar vuelve la audiencia a vacio antes de enviar', async () => {
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));
    const checkbox = await screen.findByRole('checkbox', { name: /laura gomez/i });
    await user.click(checkbox);
    expect(screen.getByText('1 de 2 tutores seleccionados')).toBeInTheDocument();
    await user.click(checkbox);
    expect(screen.getByText('0 de 2 tutores seleccionados')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /publicar asesoria/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar y publicar/i }));

    await waitFor(() => {
      expect(tutoringApi.createTutoringRequest).toHaveBeenCalledWith(
        expect.objectContaining({ tutorIds: [] }),
      );
    });
  });

  it('S2.1: si falla la carga de tutores se muestra error reintentable', async () => {
    vi.mocked(tutoringApi.fetchTutores).mockRejectedValue(new Error('red caida'));
    const user = userEvent.setup();
    render(<PublishRequestForm />);

    await screen.findByLabelText(/asignatura/i);
    await user.click(screen.getByRole('button', { name: /elegir tutores/i }));

    expect(await screen.findByText(/no pudimos cargar los tutores/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});