'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { HttpError } from '@/lib/httpClient';
import { createAsesoriaResena } from '../api/tutoringApi';

interface AsesoriaReviewFormProps {
  asesoriaId: number;
  onSubmitted: () => void | Promise<void>;
}

export function AsesoriaReviewForm({ asesoriaId, onSubmitted }: AsesoriaReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError('Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    const texto = comentario.trim();
    if (texto.length < 5 || texto.length > 500) {
      setError('El comentario debe tener entre 5 y 500 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await createAsesoriaResena(asesoriaId, { rating, comentario: texto });
      await onSubmitted();
    } catch (err) {
      setError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos enviar tu reseña. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-4 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6"
      noValidate
    >
      <div>
        <h2 className="text-lg font-semibold text-text-main">Califica esta asesoría</h2>
        <p className="mt-1 text-sm text-text-muted">
          Tu reseña es anónima y solo se mostrará cuando ambas partes hayan calificado.
        </p>
      </div>

      <div>
        <p id="rating-label" className="text-sm font-medium text-text-main">
          Calificación
        </p>
        <div
          role="radiogroup"
          aria-labelledby="rating-label"
          className="mt-2 flex items-center gap-1"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
              onClick={() => {
                setRating(value);
                setError(null);
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors duration-200 hover:bg-brand-accent/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              <Star
                className={`h-8 w-8 ${
                  value <= rating ? 'fill-current text-brand-accent' : 'text-border-color'
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        id="comentario"
        label="Comentario"
        minLength={5}
        maxLength={500}
        rows={4}
        placeholder="Cuenta cómo fue la asesoría y qué te pareció el acompañamiento..."
        value={comentario}
        onChange={(e) => {
          setComentario(e.target.value);
          setError(null);
        }}
      />
      <p className="self-end text-xs text-text-muted" aria-live="polite">
        {comentario.length}/500
      </p>

      {error ? <Alert type="error">{error}</Alert> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? <Spinner size="sm" /> : 'Enviar reseña'}
      </Button>
    </form>
  );
}
