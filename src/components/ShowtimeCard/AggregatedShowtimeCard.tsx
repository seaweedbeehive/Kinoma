import { useNavigate } from 'react-router-dom';
import { parseLanguageFlags, has3D, getFlagBadges } from '../../utils/flags';
import type { EnrichedShow } from './types';

interface AggregatedShowtimeCardProps {
  show: EnrichedShow;
  variant?: 'grid' | 'list';
  onSelect?: (movieId: string) => void;
}

const STARTING_SOON_MINUTES = 120;

function formatTime(timestamp?: number): string {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp * 1000);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function isStartingSoon(timestamp?: number): boolean {
  if (!timestamp) return false;
  const diff = (timestamp * 1000 - Date.now()) / 60000;
  return diff > 0 && diff <= STARTING_SOON_MINUTES;
}

function getMoviePoster(show: EnrichedShow): string {
  if (show.movie?.thumb?.url) return show.movie.thumb.url;
  if (show.movie?.heroImage?.url) return show.movie.heroImage.url;
  const title = encodeURIComponent(show.movie?.title || 'Film');
  return `https://placehold.co/400x600/1a1a1a/e50914?text=${title}`;
}

export function AggregatedShowtimeCard({
  show,
  variant = 'grid',
  onSelect,
}: AggregatedShowtimeCardProps) {
  const navigate = useNavigate();
  const time = formatTime(show.beginning?.timestamp);
  const soon = isStartingSoon(show.beginning?.timestamp);
  const { languageLabel } = parseLanguageFlags(show.flags);
  const badges = getFlagBadges(show.flags);
  const is3D = has3D(show.flags);
  const movieId = show.movie?.id;

  const handleCardClick = () => {
    if (!movieId) return;
    if (onSelect) {
      onSelect(movieId);
      return;
    }
    navigate(`/movies/${movieId}`);
  };

  const handleTicketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (show.detailUrl?.url) {
      window.open(show.detailUrl.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`showtime-aggregator-card showtime-aggregator-card--${variant}${
        show.isSoldOut ? ' is-sold-out' : ''
      }`}
      onClick={handleCardClick}
      tabIndex={movieId ? 0 : undefined}
      onKeyDown={
        movieId
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleCardClick();
            }
          : undefined
      }
      aria-label={
        movieId ? `${show.movie?.title || show.name} ansehen` : undefined
      }
      role="group"
    >
      <div className="showtime-aggregator-card__media">
        <img
          src={getMoviePoster(show)}
          alt={show.movie?.title || show.name}
          className="showtime-aggregator-card__poster"
          loading="lazy"
        />
        {soon && <span className="showtime-aggregator-card__soon">Gleich</span>}
      </div>

      <div className="showtime-aggregator-card__content">
        <div className="showtime-aggregator-card__header">
          <h3 className="showtime-aggregator-card__title">
            {show.movie?.title || show.name}
          </h3>
          <span className="showtime-aggregator-card__time">{time}</span>
        </div>

        <p className="showtime-aggregator-card__cinema">{show.cinemaName}</p>

        {show.movie?.productionYear && (
          <p className="showtime-aggregator-card__year">
            {show.movie.productionYear}
          </p>
        )}

        {show.auditorium?.name && (
          <p className="showtime-aggregator-card__auditorium">
            {show.auditorium.name}
          </p>
        )}

        <div className="showtime-aggregator-card__badges">
          <span className="card__badge card__badge--language">{languageLabel}</span>
          {is3D && <span className="card__badge card__badge--format">3D</span>}
          {badges
            .filter((b) => b !== languageLabel && b !== '3D')
            .map((badge) => (
              <span key={badge} className="card__badge">
                {badge}
              </span>
            ))}
        </div>

        <div className="showtime-aggregator-card__footer">
          {show.isSoldOut ? (
            <span className="showtime-aggregator-card__sold-out">Ausverkauft</span>
          ) : (
            <button
              type="button"
              className="btn btn--primary showtime-aggregator-card__ticket"
              onClick={handleTicketClick}
            >
              Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
