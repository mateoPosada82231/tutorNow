import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalLoadingProvider } from './GlobalLoadingProvider';
import { resetGlobalLoading } from '@/lib/globalLoading';

const navigation = vi.hoisted(() => ({ path: '/tutoring/requests', search: '' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.path,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

function renderWithLink(href: string, label: string) {
  return render(
    <GlobalLoadingProvider>
      <a href={href} onClick={(event) => event.preventDefault()}>
        {label}
      </a>
    </GlobalLoadingProvider>,
  );
}

describe('GlobalLoadingProvider', () => {
  beforeEach(() => {
    resetGlobalLoading();
    navigation.path = '/tutoring/requests';
    navigation.search = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no muestra la rueda durante el primer segundo de navegacion', () => {
    renderWithLink('/dashboard', 'Panel');

    fireEvent.click(screen.getByRole('link', { name: 'Panel' }));
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('muestra la rueda si la vista tarda mas de un segundo en cargar', () => {
    renderWithLink('/dashboard', 'Panel');

    fireEvent.click(screen.getByRole('link', { name: 'Panel' }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('oculta la rueda cuando termina de cargar otra ruta', () => {
    const { rerender } = renderWithLink('/dashboard', 'Panel');

    fireEvent.click(screen.getByRole('link', { name: 'Panel' }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    navigation.path = '/dashboard';
    rerender(
      <GlobalLoadingProvider>
        <p>Panel cargado</p>
      </GlobalLoadingProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('oculta la rueda cuando solo cambia el query de la misma ruta', () => {
    const { rerender } = renderWithLink('/tutoring/requests?vista=historial', 'Historial');

    fireEvent.click(screen.getByRole('link', { name: 'Historial' }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    navigation.search = 'vista=historial';
    rerender(
      <GlobalLoadingProvider>
        <p>Historial cargado</p>
      </GlobalLoadingProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('no muestra la rueda en enlaces externos', () => {
    renderWithLink('https://example.com', 'Externo');

    fireEvent.click(screen.getByRole('link', { name: 'Externo' }));
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });
});
