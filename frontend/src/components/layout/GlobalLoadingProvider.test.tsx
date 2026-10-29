import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalLoadingProvider } from './GlobalLoadingProvider';
import { resetGlobalLoading } from '@/lib/globalLoading';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('GlobalLoadingProvider', () => {
  beforeEach(() => {
    resetGlobalLoading();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la rueda de carga al abrir un enlace interno', () => {
    render(
      <GlobalLoadingProvider>
        <a href="/tutoring/requests" onClick={(event) => event.preventDefault()}>
          Asesorias
        </a>
      </GlobalLoadingProvider>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Asesorias' }));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('no muestra la rueda de carga en enlaces externos', () => {
    render(
      <GlobalLoadingProvider>
        <a href="https://example.com" onClick={(event) => event.preventDefault()}>
          Externo
        </a>
      </GlobalLoadingProvider>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Externo' }));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('no muestra la rueda de carga para acciones instantaneas', () => {
    render(<GlobalLoadingProvider>contenido</GlobalLoadingProvider>);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });
});
