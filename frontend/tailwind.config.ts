import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-surface': 'var(--bg-surface)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'brand-poli': 'var(--brand-poli)',
        'brand-poli-hover': 'var(--brand-poli-hover)',
        'brand-accent': 'var(--brand-accent)',
        'border-color': 'var(--border-color)',
        'error': 'var(--color-error)',
        'success': 'var(--color-success)',
      },
    },
  },
  plugins: [],
};

export default config;
