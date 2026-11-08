import { MessageSquareQuote } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Asesoria, Resena } from '../types';

interface AsesoriaReviewListProps {
  asesoria: Asesoria;
}

function ReviewItem({ resena, label }: { resena: Resena; label: string }) {
  return (
    <li className="rounded-lg border border-border-color bg-bg-primary p-3 text-sm text-text-main">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating rating={resena.rating} />
        <span className="text-xs font-semibold">{resena.rating}/5</span>
        <span className="ml-auto text-xs font-medium text-text-muted">{label}</span>
      </div>
      <p className="mt-2">{resena.comentario}</p>
    </li>
  );
}

export function AsesoriaReviewList({ asesoria }: AsesoriaReviewListProps) {
  const miResena = asesoria.miResena ?? null;
  const resenaContraparte = asesoria.resenaContraparte ?? null;
  const completa =
    asesoria.estadoEvaluacion === 'COMPLETA' || asesoria.estado === 'EVALUADA';

  if (!miResena && !completa) return null;

  return (
    <section
      aria-label="Reseñas de la asesoría"
      className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6"
    >
      <div className="flex items-center gap-2">
        <MessageSquareQuote className="h-5 w-5 text-brand-poli" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-text-main">Reseñas de la asesoría</h2>
      </div>

      <ul className="flex flex-col gap-3">
        {miResena ? (
          <ReviewItem
            resena={miResena}
            label={`Tu reseña como ${
              miResena.rolAutor === 'ESTUDIANTE' ? 'estudiante' : 'tutor'
            }`}
          />
        ) : null}
        {completa && resenaContraparte ? (
          <ReviewItem
            resena={resenaContraparte}
            label={`Reseña del ${
              resenaContraparte.rolAutor === 'ESTUDIANTE' ? 'estudiante' : 'tutor'
            }`}
          />
        ) : null}
      </ul>

      {!completa && miResena ? (
        <p className="rounded-lg border border-dashed border-border-color bg-bg-primary p-3 text-sm text-text-muted">
          Tu reseña está guardada. Se mostrará cuando la otra parte envíe la suya.
        </p>
      ) : null}
    </section>
  );
}
