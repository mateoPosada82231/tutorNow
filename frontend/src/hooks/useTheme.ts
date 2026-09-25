import { useEffect, useState } from 'react';
import {
  applyTheme,
  getStoredTheme,
  persistTheme,
  readCurrentTheme,
  type Theme,
} from '@/lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readCurrentTheme());
    setMounted(true);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const next = event.matches ? 'dark' : 'light';
        setTheme(next);
        applyTheme(next);
      }
    };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      applyTheme(next);
      return next;
    });
  }

  return { theme, toggleTheme, mounted };
}
