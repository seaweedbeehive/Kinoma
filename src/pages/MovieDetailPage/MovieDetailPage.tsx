import { useMemo, useState } from 'react';
import {
  useParams,
  Link,
  useSearchParams,
} from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useMovie } from '../../hooks/useMovie';
import { useCinemas } from '../../hooks/useCinemas';
import { useFavorites } from '../../hooks/useFavorites';
import { getShows } from '../../api/endpoints';
import { DateScroller } from '../../components/DateScroller';
import { ShowtimeCard } from '../../components/ShowtimeCard';
import { Modal } from '../../components/Modal';
import { ErrorState } from '../../components/ErrorState';
import { parseLanguageFlags } from '../../utils/flags';
import type { Cinema, Show } from '../../api/types';

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

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function getHeroImage(movie: NonNullable<ReturnType<typeof useMovie>['data']>): string {
  if (movie.heroImage?.url) return movie.heroImage.url;
  if (movie.thumb?.url) return movie.thumb.url;
  const title = encodeURIComponent(movie.title || 'Film');
  return `https://placehold.co/1200x600/1a1a1a/e50914?text=${title}`;
}

function getActiveLanguages(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get('lang');
  if (!raw) return [];
  return raw.split(',').map((l) => l.trim().toUpperCase()).filter(Boolean);
}

function showMatchesLanguage(show: Show, activeLanguages: string[]): boolean {
  if (activeLanguages.length === 0) return true;
  const { isOV, isOmU, isOmeU, isSubtitled, isDubbed } = parseLanguageFlags(
    show.flags
  );
  return activeLanguages.some((lang) => {
    switch (lang) {
      case 'OV':
        return isOV;
      case 'OMU':
        return isOmU;
      case 'OMEU':
        return isOmeU;
      case 'SUBTITLED':
        return isSubtitled;
      case 'DUBBED':
      case 'DF':
        return isDubbed;
      default:
        return false;
    }
  });
}

interface CinemaSectionProps {
  cinema: Cinema;
  shows: Show[];
}

function CinemaSection({ cinema, shows }: CinemaSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="cinema-section">
      <button
        type="button"
        className="cinema-section__header"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="cinema-section__info">
          <h3 className="cinema-section__name">{cinema.name}</h3>
          <p className="cinema-section__meta">
            {cinema.street}
            {cinema.street && cinema.city?.name && ' · '}
            {cinema.city?.name}
            {cinema.distance !== undefined && ` · ${cinema.distance.toFixed(1)} km`}
          </p>
        </div>
        <span className="cinema-section__count">{shows.length} Vorstellungen</span>
        <span className="cinema-section__chevron" aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded && (
        <div className="cinema-section__body">
          {shows.length === 0 ? (
            <p className="cinema-section__empty">
              Keine Vorstellungen an diesem Tag.
            </p>
          ) : (
            <div className="showtime-list">
              {shows.map((show) => (
                <ShowtimeCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: movie, isLoading, error } = useMovie(movieId || '');
  const { data: cinemas } = useCinemas();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [modalShow, setModalShow] = useState<Show | null>(null);

  const activeLanguages = useMemo(
    () => getActiveLanguages(searchParams),
    [searchParams]
  );

  const showQueries = useQueries({
    queries:
      (cinemas || []).map((cinema) => ({
        queryKey: ['shows', cinema.id, movieId, selectedDate, 7],
        queryFn: () =>
          getShows({
            cinemaId: cinema.id,
            movieId,
            date: selectedDate,
            days: 7,
          }),
        enabled: Boolean(cinema.id && movieId),
        staleTime: 1000 * 60 * 5,
      })) || [],
  });

  const cinemaShows = useMemo(() => {
    if (!cinemas) return [];
    return cinemas
      .map((cinema, index) => {
        const result = showQueries[index];
        const shows = (result.data || []).filter((show) =>
          showMatchesLanguage(show, activeLanguages)
        );
        return { cinema, shows };
      })
      .filter((entry) => entry.shows.length > 0);
  }, [cinemas, showQueries, activeLanguages]);

  const toggleLanguageFilter = (lang: string) => {
    const normalized = lang.toUpperCase();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = getActiveLanguages(next);
      if (current.includes(normalized)) {
        const updated = current.filter((l) => l !== normalized);
        if (updated.length === 0) next.delete('lang');
        else next.set('lang', updated.join(','));
      } else {
        next.set('lang', [...current, normalized].join(','));
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" aria-hidden="true" />
        <p>Film wird geladen…</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <ErrorState
        error={error}
        message={!movie && !error ? 'Der Film konnte nicht geladen werden.' : undefined}
      >
        <Link to="/" className="btn btn--primary">
          <ArrowLeftIcon />
          Zurück zu den Vorstellungen
        </Link>
      </ErrorState>
    );
  }

  const duration = formatDuration(movie.duration);
  const genres = (movie.genres || []).map((g) => g.name).join(', ');
  const directors = (movie.directors || []).map((d) => d.name).filter(Boolean).join(', ');
  const actors = (movie.actors || []).map((a) => a.name).filter(Boolean).join(', ');
  const favorited = isFavorite(movie.id);

  return (
    <div className="movie-detail">
      <Link to="/" className="back-link">
        <ArrowLeftIcon />
        Zurück zu den Vorstellungen
      </Link>

      <div className="movie-hero">
        <div className="movie-hero__media">
          <img
            src={getHeroImage(movie)}
            alt={`Poster: ${movie.title}`}
            className="movie-hero__image"
            loading="lazy"
          />
        </div>
        <div className="movie-hero__content">
          <div className="movie-hero__meta">
            {movie.productionYear && <span>{movie.productionYear}</span>}
            {duration && <span>{duration}</span>}
            {genres && <span>{genres}</span>}
          </div>
          <h1 className="movie-hero__title">{movie.title}</h1>
          {directors && (
            <p className="movie-hero__directors">Regie: {directors}</p>
          )}
          {actors && <p className="movie-hero__actors">Mit: {actors}</p>}

          {typeof movie.imdbRating === 'number' && (
            <div className="movie-hero__imdb">
              <StarIcon />
              <span>{movie.imdbRating.toFixed(1)}</span>
              {typeof movie.imdbVotes === 'number' && (
                <span className="movie-hero__votes">
                  ({movie.imdbVotes.toLocaleString('de-DE')} votes)
                </span>
              )}
            </div>
          )}

          <div className="movie-hero__actions">
            <button
              type="button"
              className={`btn${favorited ? ' btn--primary' : ' btn--ghost'}`}
              onClick={() => toggleFavorite(movie.id, 'movie')}
            >
              <HeartIcon filled={favorited} />
              {favorited ? 'In Merkliste' : 'Zur Merkliste'}
            </button>
          </div>
        </div>
      </div>

      {movie.description && (
        <section className="movie-description">
          <h2>Handlung</h2>
          <p>{movie.description}</p>
        </section>
      )}

      <section className="showtimes-section">
        <div className="showtimes-section__header">
          <h2 className="showtimes-section__title">
            <CalendarIcon />
            Vorstellungen
          </h2>
        </div>

        <DateScroller
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          days={7}
        />

        <div className="language-filter-bar">
          <span className="language-filter-bar__label">Sprache:</span>
          {['OV', 'OmU', 'OmeU', 'Subtitled', 'Dubbed'].map((lang) => {
            const active = activeLanguages.includes(lang.toUpperCase());
            return (
              <button
                key={lang}
                type="button"
                className={`preset-chip${active ? ' is-active' : ''}`}
                onClick={() => toggleLanguageFilter(lang)}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {cinemaShows.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">Keine Vorstellungen gefunden</p>
            <p className="empty-state__hint">
              Probiere einen anderen Tag oder passe die Sprachfilter an.
            </p>
          </div>
        ) : (
          <div className="cinema-showtimes">
            {cinemaShows.map(({ cinema, shows }) => (
              <CinemaSection key={cinema.id} cinema={cinema} shows={shows} />
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={Boolean(modalShow)}
        onClose={() => setModalShow(null)}
        title={modalShow?.name}
      >
        {modalShow && (
          <div className="showtime-modal">
            <p>
              <strong>Zeit:</strong> {modalShow.beginning?.formatted}
            </p>
            <p>
              <strong>Saal:</strong> {modalShow.auditorium?.name}
            </p>
            {modalShow.detailUrl?.url && (
              <a
                href={modalShow.detailUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                Tickets buchen
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
