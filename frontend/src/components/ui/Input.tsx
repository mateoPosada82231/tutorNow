import { forwardRef } from 'react';
import { Check } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  valid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, valid, id, className = '', ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-text-main">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`min-h-[44px] w-full rounded-lg border bg-bg-surface px-3 py-2 pr-10 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
              error
                ? 'border-error'
                : valid
                  ? 'border-success'
                  : 'border-border-color focus:border-brand-poli'
            } ${className}`}
            {...props}
          />
          {valid && !error && (
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-success">
              <Check className="h-5 w-5" strokeWidth={3} />
            </span>
          )}
        </div>
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
