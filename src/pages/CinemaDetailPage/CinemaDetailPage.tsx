import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCinema } from '../../hooks/useCinema';
import { useShows } from '../../hooks/useShows';
import { useFavorites } from '../../hooks/useFavorites';
import { DateScroller } from '../../components/DateScroller';
import { ErrorState } from '../../components/ErrorState';
import { groupByDate, getRelativeDateLabel } from '../../utils/dateHelpers';
import { parseLanguageFlags, has3D } from '../../utils/flags';
import type { Show } from '../../api/types';

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

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
  </svg>
);

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp * 1000);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function getMoviePoster(show: Show): string {
  if (show.movie?.thumb?.url) return show.movie.thumb.url;
  if (show.movie?.heroImage?.url) return show.movie.heroImage.url;
  const title = encodeURIComponent(show.movie?.title || 'Film');
  return `https://placehold.co/120x180/1a1a1a/e50914?text=${title}`;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

type SortOption = 'time-asc' | 'time-desc';

interface ShowFilters {
  search: string;
  languages: {
    ov: boolean;
    omu: boolean;
    omeu: boolean;
    subtitled: boolean;
    dubbed: boolean;
  };
  only3D: boolean;
  hideSoldOut: boolean;
}

function showMatchesFilters(show: Show, filters: ShowFilters): boolean {
  if (filters.search) {
    const haystack = normalize(show.movie?.title || show.name || '');
    if (!haystack.includes(normalize(filters.search))) return false;
  }

  const { isOV, isOmU, isOmeU, isSubtitled, isDubbed } = parseLanguageFlags(
    show.flags
  );
  const activeLangs = filters.languages;
  const anyLanguageSelected = Object.values(activeLangs).some(Boolean);

  if (anyLanguageSelected) {
    const matches =
      (activeLangs.ov && isOV) ||
      (activeLangs.omu && isOmU) ||
      (activeLangs.omeu && isOmeU) ||
      (activeLangs.subtitled && isSubtitled) ||
      (activeLangs.dubbed && isDubbed);
    if (!matches) return false;
  }

  if (filters.only3D && !has3D(show.flags)) return false;
  if (filters.hideSoldOut && show.isSoldOut) return false;

  return true;
}

function sortShows(shows: Show[], sortBy: SortOption): Show[] {
  const sorted = [...shows];
  sorted.sort((a, b) => {
    const aTime = a.beginning?.timestamp || 0;
    const bTime = b.beginning?.timestamp || 0;
    if (sortBy === 'time-asc') return aTime - bTime;
    return bTime - aTime;
  });
  return sorted;
}

function CinemaShowtimeCard({ show }: { show: Show }) {
  const { languageLabel } = parseLanguageFlags(show.flags);
  const is3D = has3D(show.flags);

  return (
    <article
      className={`showtime-card cinema-showtime-card${
        show.isSoldOut ? ' is-sold-out' : ''
      }`}
    >
      <div className="cinema-showtime-card__movie">
        <img
          src={getMoviePoster(show)}
          alt={show.movie?.title || show.name}
          className="cinema-showtime-card__poster"
          loading="lazy"
        />
        <div className="cinema-showtime-card__info">
          <h4 className="cinema-showtime-card__title">
            {show.movie?.title || show.name}
          </h4>
          {show.movie?.duration && (
            <p className="cinema-showtime-card__duration">
              {formatDuration(show.movie.duration)}
            </p>
          )}
          {show.auditorium?.name && (
            <p className="cinema-showtime-card__auditorium">
              {show.auditorium.name}
            </p>
          )}
        </div>
      </div>

      <div className="cinema-showtime-card__details">
        <span className="cinema-showtime-card__time">
          {formatTime(show.beginning?.timestamp)}
        </span>
        <div className="cinema-showtime-card__badges">
          <span className="showtime-card__badge showtime-card__badge--language">
            {languageLabel}
          </span>
          {is3D && (
            <span className="showtime-card__badge showtime-card__badge--format">
              3D
            </span>
          )}
        </div>
        {show.isSoldOut && (
          <span className="showtime-card__sold-out">Ausverkauft</span>
        )}
      </div>

      {show.detailUrl?.url && (
        <a
          href={show.detailUrl.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--primary showtime-card__action"
        >
          Tickets
        </a>
      )}
    </article>
  );
}

export function CinemaDetailPage() {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const { data: cinema, isLoading, error } = useCinema(cinemaId || '');
  const { isFavorite, toggleFavorite } = useFavorites();

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(new Date())
  );
  const [sortBy, setSortBy] = useState<SortOption>('time-asc');
  const [filters, setFilters] = useState<ShowFilters>({
    search: '',
    languages: { ov: false, omu: false, omeu: false, subtitled: false, dubbed: false },
    only3D: false,
    hideSoldOut: false,
  });

  const { data: shows, isLoading: showsLoading } = useShows({
    cinemaId: cinemaId || '',
    date: selectedDate,
    days: 7,
  });

  const filteredShows = useMemo(() => {
    if (!shows) return [];
    return shows.filter((show) => showMatchesFilters(show, filters));
  }, [shows, filters]);

  const sortedShows = useMemo(
    () => sortShows(filteredShows, sortBy),
    [filteredShows, sortBy]
  );

  const groupedShows = useMemo(
    () =>
      groupByDate(sortedShows, (show) =>
        show.beginning?.timestamp ? show.beginning.timestamp * 1000 : 0
      ),
    [sortedShows]
  );

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" aria-hidden="true" />
        <p>Kino wird geladen…</p>
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <ErrorState
        error={error}
        message={!cinema && !error ? 'Das Kino konnte nicht geladen werden.' : undefined}
      >
        <Link to="/cinemas" className="btn btn--primary">
          <ArrowLeftIcon />
          Zurück zu den Kinos
        </Link>
      </ErrorState>
    );
  }

  const favorited = isFavorite(cinema.id);
  const heroImage =
    cinema.heroImage?.url ||
    cinema.thumbnail?.url ||
    `https://placehold.co/1200x400/1a1a1a/e50914?text=${encodeURIComponent(
      cinema.name
    )}`;

  const toggleLanguage = (key: keyof ShowFilters['languages']) => {
    setFilters((prev) => ({
      ...prev,
      languages: { ...prev.languages, [key]: !prev.languages[key] },
    }));
  };

  return (
    <div className="cinema-detail">
      <Link to="/cinemas" className="back-link">
        <ArrowLeftIcon />
        Zurück zu den Kinos
      </Link>

      <div className="cinema-hero">
        <div className="cinema-hero__media">
          <img
            src={heroImage}
            alt={cinema.name}
            className="cinema-hero__image"
            loading="lazy"
          />
        </div>
        <div className="cinema-hero__content">
          <h1 className="cinema-hero__title">{cinema.name}</h1>

          <div className="cinema-hero__address">
            <MapPinIcon />
            <span>
              {cinema.street}
              {cinema.street && cinema.postcode && `, ${cinema.postcode}`}
              {cinema.city?.name && ` ${cinema.city.name}`}
            </span>
          </div>

          {cinema.phonenumber && (
            <a href={`tel:${cinema.phonenumber}`} className="cinema-hero__phone">
              <PhoneIcon />
              {cinema.phonenumber}
            </a>
          )}

          {cinema.coordinates && (
            <p className="cinema-hero__coords">
              {cinema.coordinates.latitude.toFixed(5)},{' '}
              {cinema.coordinates.longitude.toFixed(5)}
            </p>
          )}

          <div className="cinema-hero__actions">
            <button
              type="button"
              className={`btn${favorited ? ' btn--primary' : ' btn--ghost'}`}
              onClick={() => toggleFavorite(cinema.id, 'cinema')}
            >
              <HeartIcon filled={favorited} />
              {favorited ? 'In Merkliste' : 'Zur Merkliste'}
            </button>
            {cinema.detailUrl?.url && (
              <a
                href={cinema.detailUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
              >
                <ExternalLinkIcon />
                Kinoheld
              </a>
            )}
          </div>
        </div>
      </div>

      <section className="showtimes-section">
        <h2 className="showtimes-section__title">Vorstellungen</h2>

        <DateScroller
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          days={7}
        />

        <div className="showtimes-toolbar">
          <div className="content-bar__search">
            <label htmlFor="showSearch" className="sr-only">
              Film suchen
            </label>
            <input
              id="showSearch"
              type="search"
              className="search-input"
              placeholder="Film suchen…"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          <div className="content-bar__controls">
            <label htmlFor="sortSelect" className="sr-only">
              Sortieren
            </label>
            <select
              id="sortSelect"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="time-asc">Zeit: Früh → Spät</option>
              <option value="time-desc">Zeit: Spät → Früh</option>
            </select>
          </div>
        </div>

        <div className="language-filter-bar">
          <span className="language-filter-bar__label">Sprache:</span>
          {[
            { key: 'ov', label: 'OV' },
            { key: 'omu', label: 'OmU' },
            { key: 'omeu', label: 'OmeU' },
            { key: 'subtitled', label: 'Untertitel' },
            { key: 'dubbed', label: 'Deutsch' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`preset-chip${
                filters.languages[key as keyof ShowFilters['languages']]
                  ? ' is-active'
                  : ''
              }`}
              onClick={() =>
                toggleLanguage(key as keyof ShowFilters['languages'])
              }
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className={`preset-chip${filters.only3D ? ' is-active' : ''}`}
            onClick={() =>
              setFilters((prev) => ({ ...prev, only3D: !prev.only3D }))
            }
          >
            3D
          </button>
          <button
            type="button"
            className={`preset-chip${filters.hideSoldOut ? ' is-active' : ''}`}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                hideSoldOut: !prev.hideSoldOut,
              }))
            }
          >
            Ausverkaufte ausblenden
          </button>
        </div>

        {showsLoading ? (
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <p>Vorstellungen werden geladen…</p>
          </div>
        ) : sortedShows.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">Keine Vorstellungen gefunden</p>
            <p className="empty-state__hint">
              Probiere einen anderen Tag oder passe die Filter an.
            </p>
          </div>
        ) : (
          <div className="showtime-date-groups">
            {Object.entries(groupedShows).map(([dateKey, dateShows]) => (
              <section key={dateKey} className="date-group">
                <h3 className="date-group__title">
                  {getRelativeDateLabel(dateKey)}
                </h3>
                <div className="showtime-list">
                  {dateShows.map((show) => (
                    <CinemaShowtimeCard key={show.id} show={show} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
