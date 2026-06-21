interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} aria-hidden="true" />
      ))}
    </>
  );
}

export function MovieCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  return (
    <div className={`movie-card movie-card--${variant}`} aria-hidden="true">
      <div className="movie-card__media skeleton skeleton--poster" />
      <div className="movie-card__content">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--short" />
      </div>
    </div>
  );
}

export function CinemaCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  return (
    <div className={`cinema-card cinema-card--${variant}`} aria-hidden="true">
      <div className="cinema-card__media skeleton skeleton--thumbnail" />
      <div className="cinema-card__content">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--short" />
      </div>
    </div>
  );
}

export function ShowtimeListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="showtime-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="showtime-card skeleton-showtime" />
      ))}
    </div>
  );
}
