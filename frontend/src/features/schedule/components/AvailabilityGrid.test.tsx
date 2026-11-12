import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AvailabilityGrid,
  buildSlotKey,
  weekMondayISO,
} from '@/features/schedule/components/AvailabilityGrid';

describe('AvailabilityGrid', () => {
  const cell = (name: RegExp) => screen.getByRole('gridcell', { name: new RegExp(name, 'i') });

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

  it('los cuadrados no disponibles usan un fondo oscurecido para diferenciarse del fondo', () => {
    render(
      <AvailabilityGrid
        available={new Set([buildSlotKey('LUNES', 8)])}
        readOnly={false}
      />,
    );

    expect(cell(/lun 08:00/).className).toContain('bg-brand-poli');
    expect(cell(/mar 08:00/).className).toContain('bg-border-color');
    expect(cell(/mar 08:00/).className).not.toContain('bg-bg-primary');
  });

  it('los cuadrados no disponibles tambien se oscurecen en modo de solo lectura', () => {
    render(<AvailabilityGrid available={new Set([buildSlotKey('LUNES', 8)])} readOnly />);

    expect(cell(/lun 08:00/).className).toContain('bg-brand-poli');
    expect(cell(/mar 08:00/).className).toContain('bg-border-color');
  });

  it('muestra un selector de semana con el rango de la semana actual', () => {
    render(<AvailabilityGrid available={new Set()} readOnly />);

    expect(screen.getByRole('group', { name: /selector de semana/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /semana anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /semana siguiente/i })).toBeEnabled();
    expect(screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/)).toBeInTheDocument();
  });

  it('permite navegar hasta 2 semanas adelante y devolverse siempre entre 3 semanas', () => {
    render(<AvailabilityGrid available={new Set()} readOnly />);

    const rangoActual = screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/).textContent;

    fireEvent.click(screen.getByRole('button', { name: /semana siguiente/i }));
    const rangoSiguiente = screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/).textContent;
    expect(rangoSiguiente).not.toBe(rangoActual);
    expect(screen.getByRole('button', { name: /semana anterior/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /semana siguiente/i }));
    expect(screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/).textContent).not.toBe(rangoSiguiente);
    expect(screen.getByRole('button', { name: /semana siguiente/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /semana anterior/i }));
    fireEvent.click(screen.getByRole('button', { name: /semana anterior/i }));
    expect(screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/).textContent).toBe(rangoActual);
    expect(screen.getByRole('button', { name: /semana anterior/i })).toBeDisabled();
  });

  it('muestra el contenido de la semana que le pasa el padre (semanas independientes)', () => {
    const { rerender } = render(
      <AvailabilityGrid
        available={new Set([buildSlotKey('LUNES', 8)])}
        readOnly
        weekOffset={0}
        onWeekChange={vi.fn()}
      />,
    );

    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'true');

    rerender(
      <AvailabilityGrid available={new Set()} readOnly weekOffset={1} onWeekChange={vi.fn()} />,
    );
    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <AvailabilityGrid
        available={new Set([buildSlotKey('MARTES', 9)])}
        readOnly
        weekOffset={2}
        onWeekChange={vi.fn()}
      />,
    );
    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'false');
    expect(cell(/mar 09:00/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('en modo controlado notifica el cambio de semana al padre sin moverse solo', () => {
    const onWeekChange = vi.fn();
    render(
      <AvailabilityGrid
        available={new Set([buildSlotKey('LUNES', 8)])}
        readOnly
        weekOffset={0}
        onWeekChange={onWeekChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /semana siguiente/i }));

    expect(onWeekChange).toHaveBeenCalledWith(1);
    // The parent did not move the offset, so the grid must stay on week 0.
    expect(screen.getByRole('button', { name: /semana anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /semana siguiente/i })).toBeEnabled();
    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('weekMondayISO devuelve el lunes ISO de cada semana navegable', () => {
    expect(weekMondayISO(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${weekMondayISO(0)}T00:00:00`).getDay()).toBe(1);
    expect(weekMondayISO(1) > weekMondayISO(0)).toBe(true);
    expect(weekMondayISO(2) > weekMondayISO(1)).toBe(true);
  });

  it('en modo compacto (vista del estudiante) tambien se puede navegar entre semanas', () => {
    render(<AvailabilityGrid available={new Set()} compact readOnly />);

    expect(screen.getByRole('button', { name: /semana siguiente/i })).toBeEnabled();
    const rangoActual = screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/).textContent;
    fireEvent.click(screen.getByRole('button', { name: /semana siguiente/i }));
    expect(screen.getByText(/\d{1,2} \w+ - \d{1,2} \w+/).textContent).not.toBe(rangoActual);
  });

  it('en modo compacto las celdas son mas pequenas y se omiten las fechas', () => {
    render(<AvailabilityGrid available={new Set([buildSlotKey('LUNES', 8)])} compact readOnly />);

    expect(cell(/lun 08:00/).className).toContain('h-8');
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();

    expect(cell(/lun 08:00/)).toHaveAttribute('aria-pressed', 'true');
  });
});
