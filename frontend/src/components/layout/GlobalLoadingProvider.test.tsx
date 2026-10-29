import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalLoadingProvider } from './GlobalLoadingProvider';
import { resetGlobalLoading } from '@/lib/globalLoading';

const navigation = vi.hoisted(() => ({ path: '/dashboard' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.path,
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
    navigation.path = '/dashboard';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no muestra la rueda durante el primer segundo de navegacion', () => {
    renderWithLink('/tutoring/requests', 'Asesorias');

    fireEvent.click(screen.getByRole('link', { name: 'Asesorias' }));
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('muestra la rueda si la vista tarda mas de un segundo en cargar', () => {
    renderWithLink('/tutoring/requests', 'Asesorias');

    fireEvent.click(screen.getByRole('link', { name: 'Asesorias' }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('oculta la rueda cuando la vista siguiente ya cargo', () => {
    const { rerender } = renderWithLink('/tutoring/requests', 'Asesorias');

    fireEvent.click(screen.getByRole('link', { name: 'Asesorias' }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    navigation.path = '/tutoring/requests';
    rerender(
      <GlobalLoadingProvider>
        <p>Asesorias cargadas</p>
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
