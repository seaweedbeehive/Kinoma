import { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../components/Layout/useLayout';
import { MovieCard } from '../../components/MovieCard';
import { MovieCardSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { ViewToggle } from '../../components/ViewToggle';
import { FilterBar } from '../../components/FilterBar';
import { useMovies } from '../../hooks/useMovies';
import { useMoviePopularity } from '../../hooks/useMoviePopularity';
import { useFilterState } from '../../hooks/useFilterState';
import { hasTmdbKey, normalize, titleKey } from '../../api/tmdb';
import type { Movie } from '../../api/types';
import type { MoviePopularity } from '../../hooks/useMoviePopularity';

type MovieSortOption = 'rating' | 'title' | 'duration' | 'soonest' | 'trending';

const MOVIE_SORT_OPTIONS: MovieSortOption[] = [
  'rating',
  'title',
  'duration',
  'soonest',
  'trending',
];

function isMovieSortOption(value: string): value is MovieSortOption {
  return MOVIE_SORT_OPTIONS.includes(value as MovieSortOption);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function sortMovies(
  movies: Movie[],
  sortBy: MovieSortOption,
  popularityMap: Map<string, MoviePopularity>
): Movie[] {
  const sorted = [...movies];
  switch (sortBy) {
    case 'rating':
      sorted.sort(
        (a, b) =>
          (b.imdbRating || 0) - (a.imdbRating || 0) ||
          a.title.localeCompare(b.title)
      );
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'duration':
      sorted.sort(
        (a, b) =>
          (a.duration || 0) - (b.duration || 0) || a.title.localeCompare(b.title)
      );
      break;
    case 'soonest':
      sorted.sort(
        (a, b) =>
          Number(b.productionYear || 0) - Number(a.productionYear || 0) ||
          a.title.localeCompare(b.title)
      );
      break;
    case 'trending':
      sorted.sort((a, b) => {
        const aPop = popularityMap.get(titleKey(a.title))?.popularity ?? 0;
        const bPop = popularityMap.get(titleKey(b.title))?.popularity ?? 0;
        return (
          bPop - aPop ||
          (b.imdbRating || 0) - (a.imdbRating || 0) ||
          a.title.localeCompare(b.title)
        );
      });
      break;
  }
  return sorted;
}

function filterMovies(
  movies: Movie[],
  searchQuery: string,
  selectedGenres: string[]
): Movie[] {
  const terms = normalize(searchQuery).split(/\s+/).filter(Boolean);

  return movies.filter((movie) => {
    if (terms.length) {
      const haystack = normalize(
        `${movie.title} ${movie.description || ''} ${movie.additionalDescription || ''} ${
          (movie.genres || []).map((g) => g.name).join(' ')
        } ${(movie.directors || []).map((d) => d.name).join(' ')}`
      );
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    if (
      selectedGenres.length &&
      !selectedGenres.some((g) => movie.genres?.some((mg) => mg.name === g))
    ) {
      return false;
    }

    return true;
  });
}

export function MoviesPage() {
  const { setSidebar } = useLayout();
  const { data: movies, isLoading, error } = useMovies();
  const { filters, setPartial, resetFilters, activeFilterCount } = useFilterState();

  const filtered = useMemo(() => {
    if (!movies) return [];
    return filterMovies(movies, filters.search, filters.selectedGenres);
  }, [movies, filters.search, filters.selectedGenres]);

  const popularityMap = useMoviePopularity(filtered);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setPartial({ search: debouncedSearch });
  }, [debouncedSearch, setPartial]);

  useEffect(() => {
    setSidebar(null);
  }, [setSidebar]);

  const DEFAULT_MOVIE_SORT_BY: MovieSortOption = hasTmdbKey() ? 'trending' : 'rating';

  const movieSortBy = isMovieSortOption(filters.sortBy)
    ? filters.sortBy
    : DEFAULT_MOVIE_SORT_BY;

  const sorted = useMemo(
    () => sortMovies(filtered, movieSortBy, popularityMap),
    [filtered, movieSortBy, popularityMap]
  );

  if (isLoading) {
    return (
      <section className="results-grid" aria-label="Filme werden geladen">
        {Array.from({ length: 8 }).map((_, i) => (
          <MovieCardSkeleton key={i} variant={filters.viewMode} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div>
      <div className="content-bar">
        <div className="content-bar__search">
          <label htmlFor="movieSearch" className="sr-only">
            Film suchen
          </label>
          <input
            id="movieSearch"
            type="search"
            className="search-input"
            placeholder="Film, Regisseur, Genre…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="content-bar__controls">
          <label htmlFor="sortSelect" className="sr-only">
            Sortieren nach
          </label>
          <select
            id="sortSelect"
            className="sort-select"
            value={movieSortBy}
            onChange={(e) => setPartial({ sortBy: e.target.value })}
          >
            <option value="rating">Bewertung: Hoch → Niedrig</option>
            <option value="title">Titel: A → Z</option>
            <option value="duration">Dauer: Kurz → Lang</option>
            <option value="soonest">Als Nächstes</option>
            <option value="trending">Beliebtheit (TMDB)</option>
          </select>
          <ViewToggle
            value={filters.viewMode}
            onChange={(view) => setPartial({ viewMode: view })}
          />
        </div>
      </div>

      <FilterBar
        mode="movies"
        filters={filters}
        onChange={setPartial}
        onReset={resetFilters}
        activeFilterCount={activeFilterCount}
      />

      <p className="results-meta">
        <strong>{sorted.length}</strong>{' '}
        {sorted.length === 1 ? 'Film gefunden' : 'Filme gefunden'}
      </p>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">Keine Filme gefunden</p>
          <p className="empty-state__hint">
            Passe die Suche oder Filter an, um mehr Ergebnisse zu sehen.
          </p>
        </div>
      ) : (
        <section
          className={`results-grid${filters.viewMode === 'list' ? ' is-list' : ''}`}
          aria-label="Filme"
        >
          {sorted.map((movie) => (
            <MovieCard key={movie.id} movie={movie} variant={filters.viewMode} />
          ))}
        </section>
      )}
    </div>
  );
}
