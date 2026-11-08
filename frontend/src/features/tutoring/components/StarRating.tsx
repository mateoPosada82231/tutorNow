import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRating({ rating, size = 'sm', className = '' }: StarRatingProps) {
  const rounded = Math.round(rating);
  const dimension = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <span
      role="img"
      aria-label={`${rating} de 5 estrellas`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${dimension} ${
            value <= rounded ? 'fill-current text-brand-accent' : 'text-border-color'
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
