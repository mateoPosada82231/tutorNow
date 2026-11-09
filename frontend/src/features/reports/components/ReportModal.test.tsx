import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportModal } from './ReportModal';
import { createReport } from '../api/reportsApi';

vi.mock('../api/reportsApi', () => ({
  createReport: vi.fn(),
}));

const createReportMock = vi.mocked(createReport);

describe('ReportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando esta cerrado', () => {
    render(<ReportModal tipo="PUBLICACION" targetId={10} open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pide un motivo valido antes de enviar', async () => {
    const user = userEvent.setup();
    render(<ReportModal tipo="PUBLICACION" targetId={10} open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El motivo es obligatorio');
    expect(createReportMock).not.toHaveBeenCalled();
  });

  it('envia el reporte con motivo y descripcion', async () => {
    const user = userEvent.setup();
    createReportMock.mockResolvedValue({
      id: 1,
      tipo: 'PUBLICACION',
      targetId: 10,
      motivo: 'Contenido inapropiado',
      descripcion: 'El tema no corresponde',
      estado: 'PENDIENTE',
      createdAt: '2026-11-08T00:00:00Z',
    });

    render(<ReportModal tipo="PUBLICACION" targetId={10} open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/motivo/i), 'Contenido inapropiado');
    await user.type(screen.getByLabelText(/descripcion/i), 'El tema no corresponde');
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() =>
      expect(createReportMock).toHaveBeenCalledWith({
        tipo: 'PUBLICACION',
        targetId: 10,
        motivo: 'Contenido inapropiado',
        descripcion: 'El tema no corresponde',
      }),
    );
    expect(await screen.findByText(/gracias por tu reporte/i)).toBeInTheDocument();
  });

  it('muestra el error del servidor sin cerrar el modal', async () => {
    const user = userEvent.setup();
    createReportMock.mockRejectedValue(new Error('Ya reportaste este contenido'));

    render(<ReportModal tipo="RESENA" targetId={5} open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/motivo/i), 'Contenido inapropiado');
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    expect(await screen.findByText('Ya reportaste este contenido')).toBeInTheDocument();
  });
});
