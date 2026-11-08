import { StarRating } from './StarRating';

interface TutorRatingSummaryProps {
  promedio: number | null | undefined;
  total: number | undefined;
}

export function TutorRatingSummary({ promedio, total }: TutorRatingSummaryProps) {
  const cantidad = total ?? 0;
  const tienePromedio = promedio != null && cantidad > 0;
  const valor = promedio ?? 0;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      {tienePromedio ? (
        <>
          <StarRating rating={valor} />
          <span className="font-semibold text-text-main">{valor.toFixed(1)}</span>
          <span className="text-text-muted">
            ({cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'})
          </span>
        </>
      ) : (
        <span className="text-text-muted">Sin calificaciones todavía</span>
      )}
    </div>
  );
}
