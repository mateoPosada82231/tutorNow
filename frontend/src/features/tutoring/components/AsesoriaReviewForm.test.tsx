import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AsesoriaReviewForm } from './AsesoriaReviewForm';
import * as tutoringApi from '../api/tutoringApi';

vi.mock('../api/tutoringApi', () => ({
  createAsesoriaResena: vi.fn(),
}));

describe('AsesoriaReviewForm', () => {
  const onSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exige seleccionar una calificacion', async () => {
    const user = userEvent.setup();
    render(<AsesoriaReviewForm asesoriaId={20} onSubmitted={onSubmitted} />);

    await user.click(screen.getByRole('button', { name: /enviar reseña/i }));

    expect(screen.getByText(/selecciona una calificación/i)).toBeInTheDocument();
    expect(tutoringApi.createAsesoriaResena).not.toHaveBeenCalled();
  });

  it('exige un comentario de al menos 5 caracteres', async () => {
    const user = userEvent.setup();
    render(<AsesoriaReviewForm asesoriaId={20} onSubmitted={onSubmitted} />);

    await user.click(screen.getByRole('radio', { name: '5 estrellas' }));
    await user.type(screen.getByLabelText('Comentario'), 'Bien');
    await user.click(screen.getByRole('button', { name: /enviar reseña/i }));

    expect(screen.getByText(/entre 5 y 500 caracteres/i)).toBeInTheDocument();
    expect(tutoringApi.createAsesoriaResena).not.toHaveBeenCalled();
  });

  it('envia la calificacion y notifica al padre', async () => {
    const user = userEvent.setup();
    vi.mocked(tutoringApi.createAsesoriaResena).mockResolvedValue({} as never);
    render(<AsesoriaReviewForm asesoriaId={20} onSubmitted={onSubmitted} />);

    await user.click(screen.getByRole('radio', { name: '4 estrellas' }));
    await user.type(screen.getByLabelText('Comentario'), 'Muy buena asesoria');
    await user.click(screen.getByRole('button', { name: /enviar reseña/i }));

    await waitFor(() =>
      expect(tutoringApi.createAsesoriaResena).toHaveBeenCalledWith(20, {
        rating: 4,
        comentario: 'Muy buena asesoria',
      }),
    );
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });
});
