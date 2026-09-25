'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Circle, Eye, EyeOff } from 'lucide-react';

interface PasswordRequirement {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

interface PasswordRequirementsProps {
  value?: string;
  requirements?: PasswordRequirement[];
  visible?: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirement[] = [
  { key: 'min8', label: 'Minimo 8 caracteres', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Al menos una mayuscula (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Al menos una minuscula (a-z)', test: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Al menos un numero (0-9)', test: (v) => /\d/.test(v) },
];

function PasswordRequirements({
  value = '',
  requirements = DEFAULT_REQUIREMENTS,
  visible = false,
}: PasswordRequirementsProps) {
  const [show, setShow] = useState(false);
  const firstRender = useRef(true);
  const prevMet = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) {
      setShow(true);
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => setShow(false), 200);
    return () => clearTimeout(t);
  }, [visible]);

  if (!requirements.length) return null;

  return (
    <div
      aria-live="polite"
      className={`overflow-hidden transition-all duration-200 ease-out ${
        show ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
      }`}
    >
      <ul className="space-y-1 rounded-xl border border-border-color/40 bg-bg-surface/50 px-3.5 py-2.5">
        {requirements.map((req) => {
          const met = Boolean(req.test(value));
          const wasMet = prevMet.current[req.key];
          if (met && !wasMet) prevMet.current[req.key] = true;
          const justMet = met && !wasMet;

          return (
            <li
              key={req.key}
              className={`flex items-start gap-2 text-xs transition-colors duration-200 ${
                met ? 'text-success' : 'text-text-muted'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-200 ${
                  justMet ? 'scale-110' : ''
                }`}
              >
                {met ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <Circle className="h-2.5 w-2.5 opacity-40" />
                )}
              </span>
              <span
                className={`transition-all duration-300 ease-out ${
                  met ? 'line-through opacity-60' : 'no-underline opacity-100'
                }`}
              >
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  valid?: boolean;
  placeholder?: string;
  autoComplete?: string;
  showRequirements?: boolean;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  valid,
  placeholder,
  autoComplete,
  showRequirements = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text-main">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`min-h-[44px] w-full rounded-lg border bg-bg-surface px-3 py-2 pr-11 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
            error
              ? 'border-error'
              : valid
                ? 'border-success'
                : 'border-border-color focus:border-brand-poli'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:text-text-main"
          aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      {showRequirements && <PasswordRequirements value={value} visible={value.length > 0} />}
    </div>
  );
}
