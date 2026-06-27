import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import type { Movie } from '../../api/types';

const TicketIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);

interface MovieCardProps {
  movie: Movie;
  variant?: 'grid' | 'list';
}

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const StarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function getPosterUrl(movie: Movie): string {
  if (movie.thumb?.url) return movie.thumb.url;
  if (movie.heroImage?.url) return movie.heroImage.url;
  const title = encodeURIComponent(movie.title || 'Film');
  return `https://placehold.co/400x600/1a1a1a/e50914?text=${title}`;
}

export function MovieCard({ movie, variant = 'grid' }: MovieCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(movie.id);

  const handleCardClick = () => {
    navigate(`/movies/${movie.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(movie.id, 'movie');
  };

  const handleShowtimesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/showtimes?search=${encodeURIComponent(movie.title)}`);
  };

  const duration = formatDuration(movie.duration);
  const genres = (movie.genres || [])
    .map((g) => g.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={`movie-card movie-card--${variant}`}
      onClick={handleCardClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCardClick();
      }}
      aria-label={`${movie.title} ansehen`}
      role="group"
    >
      <div className="movie-card__media">
        <img
          src={getPosterUrl(movie)}
          alt={`Poster: ${movie.title}`}
          className="movie-card__poster"
          loading="lazy"
        />
        {typeof movie.imdbRating === 'number' && (
          <span className="movie-card__rating-badge">
            <StarIcon /> {movie.imdbRating.toFixed(1)}
          </span>
        )}
        <button
          type="button"
          className={`movie-card__favorite${favorited ? ' is-favorite' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={
            favorited ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'
          }
          title={favorited ? 'Favorit' : 'Favorit hinzufügen'}
        >
          <HeartIcon filled={favorited} />
        </button>
      </div>

      <div className="movie-card__content">
        <h3 className="movie-card__title">{movie.title}</h3>

        <div className="movie-card__meta">
          {movie.productionYear && <span>{movie.productionYear}</span>}
          {duration && <span>{duration}</span>}
        </div>

        {genres && <p className="movie-card__genres">{genres}</p>}

        <button
          type="button"
          className="movie-card__showtimes"
          onClick={handleShowtimesClick}
          aria-label={`Vorstellungen für ${movie.title}`}
        >
          <TicketIcon />
          Vorstellungen
        </button>

        {typeof movie.imdbRating === 'number' && (
          <div className="movie-card__imdb">
            <StarIcon />
            <span>{movie.imdbRating.toFixed(1)}</span>
            {typeof movie.imdbVotes === 'number' && (
              <span className="movie-card__votes">
                ({movie.imdbVotes.toLocaleString('de-DE')} votes)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
