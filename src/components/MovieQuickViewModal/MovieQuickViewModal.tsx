import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Modal } from '../Modal';
import { DateScroller } from '../DateScroller';
import { ShowtimeCard } from '../ShowtimeCard';
import { CollapsibleFilterGroup } from '../CollapsibleFilterGroup';
import { useMovie } from '../../hooks/useMovie';
import { useCinemas } from '../../hooks/useCinemas';
import { useFavorites } from '../../hooks/useFavorites';
import { getShows } from '../../api/endpoints';
import { parseLanguageFlags } from '../../utils/flags';
import type { Cinema, Show } from '../../api/types';

interface MovieQuickViewModalProps {
  movieId: string;
  isOpen: boolean;
  onClose: () => void;
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getShowDateKey(show: Show): string | null {
  if (!show.beginning?.timestamp) return null;
  return formatDateKey(new Date(show.beginning.timestamp * 1000));
}

function filterShowsByDate(shows: Show[], selectedDate: string): Show[] {
  return shows.filter((show) => getShowDateKey(show) === selectedDate);
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
  return `https://placehold.co/600x900/1a1a1a/e50914?text=${title}`;
}

function showMatchesLanguage(show: Show, activeLanguages: string[]): boolean {
  if (activeLanguages.length === 0) return true;
  const { isOV, isOmU, isOmeU, isSubtitled, isDubbed } = parseLanguageFlags(
    show.flags
  );
  return activeLanguages.some((lang) => {
    switch (lang.toUpperCase()) {
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
  return (
    <section className="cinema-section">
      <div className="cinema-section__header">
        <div className="cinema-section__info">
          <h3 className="cinema-section__name">{cinema.name}</h3>
          <p className="cinema-section__meta">
            {cinema.street}
            {cinema.street && cinema.city?.name && ' · '}
            {cinema.city?.name}
          </p>
        </div>
        <span className="cinema-section__count">{shows.length} Vorstellungen</span>
      </div>
      <div className="cinema-section__body">
        <div className="showtime-list">
          {shows.map((show) => (
            <ShowtimeCard key={show.id} show={show} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function MovieQuickViewModal({
  movieId,
  isOpen,
  onClose,
}: MovieQuickViewModalProps) {
  const { data: movie, isLoading: movieLoading } = useMovie(movieId);
  const { data: cinemas } = useCinemas();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);

  const showQueries = useQueries({
    queries:
      (cinemas || []).map((cinema) => ({
        queryKey: ['shows-quick', cinema.id, movieId, selectedDate, 7],
        queryFn: () =>
          getShows({
            cinemaId: cinema.id,
            movieId,
            date: selectedDate,
            days: 7,
          }),
        enabled: Boolean(cinema.id && movieId && isOpen),
        staleTime: 1000 * 60 * 5,
      })) || [],
  });

  const cinemaShows = useMemo(() => {
    if (!cinemas) return [];
    return cinemas
      .map((cinema, index) => {
        const result = showQueries[index];
        const shows = filterShowsByDate(
          (result.data || []).filter((show) =>
            showMatchesLanguage(show, activeLanguages)
          ),
          selectedDate
        );
        return { cinema, shows };
      })
      .filter((entry) => entry.shows.length > 0);
  }, [cinemas, showQueries, activeLanguages, selectedDate]);

  const toggleLanguage = (lang: string) => {
    const normalized = lang.toUpperCase();
    setActiveLanguages((prev) =>
      prev.includes(normalized)
        ? prev.filter((l) => l !== normalized)
        : [...prev, normalized]
    );
  };

  const title = movie?.title || 'Filmdetails';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {movieLoading || !movie ? (
        <div className="loading-state loading-state--compact">
          <div className="spinner" aria-hidden="true" />
          <p>Film wird geladen…</p>
        </div>
      ) : (
        <div className="movie-modal__layout">
          <div className="movie-modal__media">
            <img
              src={getHeroImage(movie)}
              alt={movie.title}
              loading="lazy"
            />
          </div>
          <div className="movie-modal__info">
            <div className="movie-modal__meta">
              {movie.productionYear && <span>{movie.productionYear}</span>}
              {formatDuration(movie.duration) && (
                <span>{formatDuration(movie.duration)}</span>
              )}
              {(movie.genres || []).map((g) => (
                <span key={g.name} className="movie-modal__detail">
                  {g.name}
                </span>
              ))}
            </div>

            <h2 className="movie-modal__title">{movie.title}</h2>

            {typeof movie.imdbRating === 'number' && (
              <div className="movie-modal__rating">
                <StarIcon />
                <span>{movie.imdbRating.toFixed(1)}</span>
              </div>
            )}

            {movie.description && (
              <p className="movie-modal__synopsis">{movie.description}</p>
            )}

            <div className="movie-modal__details">
              {(movie.directors || []).map((d) =>
                d.name ? (
                  <span key={d.name} className="movie-modal__detail">
                    Regie: {d.name}
                  </span>
                ) : null
              )}
            </div>

            <div className="movie-hero__actions">
              <button
                type="button"
                className={`btn${
                  isFavorite(movie.id) ? ' btn--primary' : ' btn--ghost'
                }`}
                onClick={() => toggleFavorite(movie.id, 'movie')}
              >
                <HeartIcon filled={isFavorite(movie.id)} />
                {isFavorite(movie.id) ? 'In Merkliste' : 'Zur Merkliste'}
              </button>
              <Link
                to={`/movies/${movieId}`}
                className="btn btn--primary"
                onClick={onClose}
              >
                Filmseite öffnen
              </Link>
            </div>

            <div className="showtimes-section showtimes-section--in-modal">
              <h3 className="showtimes-section__title">Vorstellungen</h3>
              <DateScroller
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                days={7}
              />

              <CollapsibleFilterGroup
                title="Sprache:"
                variant="row"
                activeCount={activeLanguages.length}
              >
                {['OV', 'OmU', 'OmeU', 'Subtitled', 'Dubbed'].map((lang) => {
                  const active = activeLanguages.includes(lang.toUpperCase());
                  return (
                    <button
                      key={lang}
                      type="button"
                      className={`preset-chip${active ? ' is-active' : ''}`}
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                    </button>
                  );
                })}
              </CollapsibleFilterGroup>

              {cinemaShows.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <p className="empty-state__title">Keine Vorstellungen gefunden</p>
                  <p className="empty-state__hint">
                    Probiere einen anderen Tag oder passe die Sprachfilter an.
                  </p>
                </div>
              ) : (
                <div className="cinema-showtimes cinema-showtimes--in-modal">
                  {cinemaShows.map(({ cinema, shows }) => (
                    <CinemaSection key={cinema.id} cinema={cinema} shows={shows} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
