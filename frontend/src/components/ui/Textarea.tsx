import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-text-main">
          {label}
        </label>
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`min-h-[44px] w-full resize-y rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
            error ? 'border-error' : 'border-border-color focus:border-brand-poli'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
