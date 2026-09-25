import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';
import { THEME_STORAGE_KEY } from '@/lib/theme';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
  });

  it('muestra el icono segun el tema actual tras montar', async () => {
    render(<ThemeToggle />);

    const button = await screen.findByRole('button', { name: /cambiar a tema oscuro/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('alterna a tema oscuro, lo aplica al documento y lo persiste', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(await screen.findByRole('button', { name: /cambiar a tema oscuro/i }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(
      screen.getByRole('button', { name: /cambiar a tema claro/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('respeta la preferencia guardada sobre la del sistema', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);

    expect(
      await screen.findByRole('button', { name: /cambiar a tema claro/i }),
    ).toBeInTheDocument();
  });
});
