'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-pressed={isDark}
      title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-brand-poli/10 hover:text-brand-poli focus:outline-none focus:ring-2 focus:ring-brand-poli"
    >
      {mounted ? (
        isDark ? (
          <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
        ) : (
          <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45" />
        )
      ) : (
        <span className="block h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
