import { parseLanguageFlags, has3D, getFlagBadges } from '../../utils/flags';
import type { Show } from '../../api/types';

interface ShowtimeCardProps {
  show: Show;
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

export function ShowtimeCard({ show }: ShowtimeCardProps) {
  const time = formatTime(show.beginning?.timestamp);
  const soon = isStartingSoon(show.beginning?.timestamp);
  const { languageLabel } = parseLanguageFlags(show.flags);
  const badges = getFlagBadges(show.flags);
  const is3D = has3D(show.flags);

  const handleClick = () => {
    if (show.detailUrl?.url) {
      window.open(show.detailUrl.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      className={`showtime-card${show.isSoldOut ? ' is-sold-out' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      aria-label={`Vorstellung um ${time} Uhr`}
    >
      <div className="showtime-card__main">
        <div className="showtime-card__time">
          {soon && <span className="showtime-card__soon">Gleich</span>}
          <span className="showtime-card__clock">{time}</span>
        </div>

        <div className="showtime-card__badges">
          <span className="showtime-card__badge showtime-card__badge--language">
            {languageLabel}
          </span>
          {is3D && (
            <span className="showtime-card__badge showtime-card__badge--format">
              3D
            </span>
          )}
          {badges
            .filter((b) => b !== languageLabel && b !== '3D')
            .map((badge) => (
              <span key={badge} className="showtime-card__badge">
                {badge}
              </span>
            ))}
        </div>
      </div>

      <div className="showtime-card__info">
        {show.auditorium?.name && (
          <span className="showtime-card__auditorium">{show.auditorium.name}</span>
        )}
        {show.isSoldOut && (
          <span className="showtime-card__sold-out">Ausverkauft</span>
        )}
      </div>

      <button
        type="button"
        className="btn btn--primary showtime-card__action"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        disabled={show.isSoldOut}
      >
        Tickets
      </button>
    </article>
  );
}
