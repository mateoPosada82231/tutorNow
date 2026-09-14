export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-4' };
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`${sizes[size]} animate-spin rounded-full border-border-color border-t-brand-poli`}
    />
  );
}
