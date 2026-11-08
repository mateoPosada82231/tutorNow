import { StarRating } from './StarRating';
import type { ResenaRecibida } from '../types';

interface StudentRatingSummaryProps {
  promedio: number | null;
  total: number;
  resenas: ResenaRecibida[];
}

export function StudentRatingSummary({
  promedio,
  total,
  resenas,
}: StudentRatingSummaryProps) {
  return (
    <section
      aria-label="Mi calificación como estudiante"
      className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6"
    >
      <h2 className="text-lg font-semibold text-text-main">Mi calificación como estudiante</h2>
      <p className="mt-1 text-sm text-text-muted">
        Este promedio es privado: solo tú puedes verlo.
      </p>

      {promedio == null || total === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border-color bg-bg-primary p-4 text-sm text-text-muted">
          Aún no tienes reseñas de tutores.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <StarRating rating={promedio} size="md" />
            <span className="text-lg font-semibold text-text-main">{promedio.toFixed(1)}</span>
            <span className="text-text-muted">
              ({total} {total === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>

          <ul aria-label="Reseñas recibidas de tutores" className="mt-4 flex flex-col gap-3">
            {resenas.map((resena) => (
              <li
                key={resena.id}
                className="rounded-lg border border-border-color bg-bg-primary p-3 text-sm text-text-main"
              >
                <div className="flex items-center gap-2">
                  <StarRating rating={resena.rating} />
                  <span className="text-xs font-semibold">{resena.rating}/5</span>
                </div>
                <p className="mt-2">{resena.comentario}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
