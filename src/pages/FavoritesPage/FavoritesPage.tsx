import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { MovieCard } from '../../components/MovieCard';
import { CinemaCard } from '../../components/CinemaCard';
import { ErrorState } from '../../components/ErrorState';
import { useFavorites } from '../../hooks/useFavorites';
import { getMovie, getCinema } from '../../api/endpoints';
import type { Movie, Cinema } from '../../api/types';

type Tab = 'movies' | 'cinemas';

const HeartEmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

function EmptyFavorites({ type }: { type: Tab }) {
  return (
    <div className="empty-state empty-state--favorites">
      <div className="empty-state__icon">
        <HeartEmptyIcon />
      </div>
      <p className="empty-state__title">
        Noch keine {type === 'movies' ? 'Filme' : 'Kinos'} in der Merkliste
      </p>
      <p className="empty-state__hint">
        {type === 'movies'
          ? 'Füge Filme über das Herz-Symbol hinzu.'
          : 'Füge Kinos über das Herz-Symbol hinzu.'}
      </p>
      <div className="empty-state__actions">
        <Link
          to={type === 'movies' ? '/movies' : '/cinemas'}
          className="btn btn--primary"
        >
          {type === 'movies' ? 'Filme entdecken' : 'Kinos entdecken'}
        </Link>
      </div>
    </div>
  );
}

function MovieFavorites({ ids }: { ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['movie', id],
      queryFn: () => getMovie(id),
      enabled: Boolean(id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const firstError = queries.find((q) => q.error)?.error;
  const movies = queries
    .map((q) => q.data)
    .filter((m): m is Movie => Boolean(m));

  if (ids.length === 0) return <EmptyFavorites type="movies" />;
  if (isLoading) return <div className="loading-state"><div className="spinner" /></div>;
  if (firstError) {
    return (
      <ErrorState
        error={firstError}
        message="Favorisierte Filme konnten nicht geladen werden."
        onRetry={() => queries.forEach((q) => q.refetch())}
      />
    );
  }

  return (
    <section className="results-grid" aria-label="Favorisierte Filme">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </section>
  );
}

function CinemaFavorites({ ids }: { ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['cinema', id],
      queryFn: () => getCinema(id),
      enabled: Boolean(id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const firstError = queries.find((q) => q.error)?.error;
  const cinemas = queries
    .map((q) => q.data)
    .filter((c): c is Cinema => Boolean(c));

  if (ids.length === 0) return <EmptyFavorites type="cinemas" />;
  if (isLoading) return <div className="loading-state"><div className="spinner" /></div>;
  if (firstError) {
    return (
      <ErrorState
        error={firstError}
        message="Favorisierte Kinos konnten nicht geladen werden."
        onRetry={() => queries.forEach((q) => q.refetch())}
      />
    );
  }

  return (
    <section className="results-grid" aria-label="Favorisierte Kinos">
      {cinemas.map((cinema) => (
        <CinemaCard key={cinema.id} cinema={cinema} />
      ))}
    </section>
  );
}

export function FavoritesPage() {
  const { movieIds, cinemaIds } = useFavorites();
  const [activeTab, setActiveTab] = useState<Tab>('movies');

  return (
    <div className="favorites-page">
      <h1 className="favorites-page__title">Merkliste</h1>

      <div className="tabs" role="tablist" aria-label="Merkliste Kategorien">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'movies'}
          aria-controls="movies-panel"
          id="movies-tab"
          className={`tab${activeTab === 'movies' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          Filme
          {movieIds.length > 0 && (
            <span className="tab__count">{movieIds.length}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cinemas'}
          aria-controls="cinemas-panel"
          id="cinemas-tab"
          className={`tab${activeTab === 'cinemas' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('cinemas')}
        >
          Kinos
          {cinemaIds.length > 0 && (
            <span className="tab__count">{cinemaIds.length}</span>
          )}
        </button>
      </div>

      <div className="favorites-page__content">
        {activeTab === 'movies' && (
          <div id="movies-panel" role="tabpanel" aria-labelledby="movies-tab">
            <MovieFavorites ids={movieIds} />
          </div>
        )}
        {activeTab === 'cinemas' && (
          <div id="cinemas-panel" role="tabpanel" aria-labelledby="cinemas-tab">
            <CinemaFavorites ids={cinemaIds} />
          </div>
        )}
      </div>
    </div>
  );
}
