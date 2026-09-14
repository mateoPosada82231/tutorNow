interface AlertProps {
  type: 'success' | 'error' | 'info';
  children: React.ReactNode;
}

export function Alert({ type, children }: AlertProps) {
  const styles = {
    success: 'border-success bg-success/10 text-success',
    error: 'border-error bg-error/10 text-error',
    info: 'border-brand-poli bg-brand-poli/10 text-brand-poli',
  };
  return (
    <div role="alert" className={`rounded-lg border-l-4 px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
