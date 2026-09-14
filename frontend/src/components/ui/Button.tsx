interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2 text-base font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const variants = {
    primary: 'bg-brand-poli text-white hover:bg-brand-poli-hover',
    secondary: 'bg-brand-accent text-text-main hover:brightness-95',
    ghost: 'bg-transparent text-brand-poli hover:bg-brand-poli/10',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
