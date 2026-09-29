import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AvailabilityGrid,
  buildSlotKey,
} from '@/features/schedule/components/AvailabilityGrid';

describe('AvailabilityGrid', () => {
  const cell = (name: string) => screen.getByRole('gridcell', { name: new RegExp(name, 'i') });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los dias de la semana con sus fechas y las horas', () => {
    render(<AvailabilityGrid available={new Set()} readOnly />);

    expect(screen.getByRole('grid', { name: /cuadricula de disponibilidad/i })).toBeInTheDocument();
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach((dia) => {
      expect(screen.getByText(dia)).toBeInTheDocument();
    });
    expect(cell(/lun 08:00/)).toBeInTheDocument();
    expect(cell(/dom 17:00/)).toBeInTheDocument();
    expect(screen.queryByText('18:00')).not.toBeInTheDocument();
  });

  it('marca un bloque como disponible al hacer clic una vez y lo desmarca al volver a hacer clic', () => {
    const onToggle = vi.fn();
    const available = new Set([buildSlotKey('LUNES', 8)]);
    const { rerender } = render(
      <AvailabilityGrid available={available} onToggle={onToggle} />,
    );

    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.pointerDown(cell(/lun 08:00/));
    expect(onToggle).toHaveBeenCalledWith('LUNES', 8, false);

    rerender(<AvailabilityGrid available={new Set()} onToggle={onToggle} />);
    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'false');
    fireEvent.pointerDown(cell(/lun 08:00/));
    expect(onToggle).toHaveBeenCalledWith('LUNES', 8, true);
  });

  it('arrastra desde un bloque hasta otro marcando todos con el mismo valor', () => {
    const onToggle = vi.fn();
    render(<AvailabilityGrid available={new Set()} onToggle={onToggle} />);

    fireEvent.pointerDown(cell(/lun 08:00/));
    expect(onToggle).toHaveBeenLastCalledWith('LUNES', 8, true);

    fireEvent.pointerEnter(cell(/mar 08:00/));
    expect(onToggle).toHaveBeenLastCalledWith('MARTES', 8, true);

    fireEvent.pointerEnter(cell(/mié 09:00/i));
    expect(onToggle).toHaveBeenLastCalledWith('MIERCOLES', 9, true);

    fireEvent.pointerUp(window);

    fireEvent.pointerEnter(cell(/jue 09:00/));
    expect(onToggle).toHaveBeenCalledTimes(3);
  });

  it('al arrastrar desde un bloque disponible lo desmarca en todo el recorrido', () => {
    const onToggle = vi.fn();
    render(
      <AvailabilityGrid
        available={new Set([buildSlotKey('LUNES', 8), buildSlotKey('MARTES', 8)])}
        onToggle={onToggle}
      />,
    );

    fireEvent.pointerDown(cell(/lun 08:00/));
    expect(onToggle).toHaveBeenLastCalledWith('LUNES', 8, false);

    fireEvent.pointerEnter(cell(/mar 08:00/));
    expect(onToggle).toHaveBeenLastCalledWith('MARTES', 8, false);
  });

  it('no permite marcar bloques en modo de solo lectura', () => {
    const onToggle = vi.fn();
    render(<AvailabilityGrid available={new Set()} readOnly onToggle={onToggle} />);

    fireEvent.pointerDown(cell(/lun 08:00/));
    fireEvent.pointerEnter(cell(/mar 08:00/));

    expect(onToggle).not.toHaveBeenCalled();
  });
});
