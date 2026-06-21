import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import type { Cinema } from '../../api/types';

interface CinemaCardProps {
  cinema: Cinema;
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

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

function getThumbnailUrl(cinema: Cinema): string {
  if (cinema.thumbnail?.url) return cinema.thumbnail.url;
  if (cinema.heroImage?.url) return cinema.heroImage.url;
  const name = encodeURIComponent(cinema.name || 'Kino');
  return `https://placehold.co/400x300/1a1a1a/e50914?text=${name}`;
}

function getTypeBadges(cinema: Cinema): string[] {
  const badges: string[] = [];
  if (cinema.isOpenAirCinema) badges.push('Freiluftkino');
  if (cinema.isDriveInCinema) badges.push('Autokino');
  if (cinema.isStationaryCinema) badges.push('Stationär');
  return badges;
}

export function CinemaCard({ cinema, variant = 'grid' }: CinemaCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(cinema.id);
  const badges = getTypeBadges(cinema);

  const handleCardClick = () => {
    navigate(`/cinemas/${cinema.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(cinema.id, 'cinema');
  };

  return (
    <div
      className={`cinema-card cinema-card--${variant}`}
      onClick={handleCardClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCardClick();
      }}
      aria-label={`${cinema.name} ansehen`}
      role="group"
    >
      <div className="cinema-card__media">
        <img
          src={getThumbnailUrl(cinema)}
          alt={`${cinema.name}`}
          className="cinema-card__image"
          loading="lazy"
        />
        <button
          type="button"
          className={`cinema-card__favorite${favorited ? ' is-favorite' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={
            favorited ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'
          }
          title={favorited ? 'Favorit' : 'Favorit hinzufügen'}
        >
          <HeartIcon filled={favorited} />
        </button>
      </div>

      <div className="cinema-card__content">
        <h3 className="cinema-card__name">{cinema.name}</h3>

        <div className="cinema-card__address">
          <MapPinIcon />
          <span>
            {cinema.street}
            {cinema.street && cinema.city?.name && ', '}
            {cinema.city?.name}
          </span>
        </div>

        {cinema.distance !== undefined && (
          <p className="cinema-card__distance">
            {cinema.distance.toFixed(1)} km entfernt
          </p>
        )}

        {cinema.phonenumber && (
          <a
            href={`tel:${cinema.phonenumber}`}
            className="cinema-card__phone"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneIcon />
            {cinema.phonenumber}
          </a>
        )}

        {badges.length > 0 && (
          <div className="cinema-card__badges">
            {badges.map((badge) => (
              <span key={badge} className="cinema-card__badge">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
