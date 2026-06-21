import { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../components/Layout/useLayout';
import { MovieCard } from '../../components/MovieCard';
import { MovieCardSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { ViewToggle } from '../../components/ViewToggle';
import { FilterPanel } from '../../components/FilterPanel';
import { useMovies } from '../../hooks/useMovies';
import { useFilterState } from '../../hooks/useFilterState';
import type { Movie } from '../../api/types';

type MovieSortOption = 'rating' | 'title' | 'duration' | 'soonest';

const MOVIE_SORT_OPTIONS: MovieSortOption[] = ['rating', 'title', 'duration', 'soonest'];

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

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function sortMovies(movies: Movie[], sortBy: MovieSortOption): Movie[] {
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
  const { setSidebar, openMobileFilter, closeMobileFilter } = useLayout();
  const { data: movies, isLoading, error } = useMovies();
  const { filters, setPartial, resetFilters, activeFilterCount } = useFilterState();

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setPartial({ search: debouncedSearch });
  }, [debouncedSearch, setPartial]);

  useEffect(() => {
    setSidebar(
      <FilterPanel
        mode="movies"
        filters={filters}
        onChange={setPartial}
        onApply={closeMobileFilter}
        onReset={resetFilters}
      />
    );
    return () => setSidebar(null);
  }, [setSidebar, filters, setPartial, closeMobileFilter, resetFilters]);

  const filtered = useMemo(() => {
    if (!movies) return [];
    return filterMovies(movies, filters.search, filters.selectedGenres);
  }, [movies, filters.search, filters.selectedGenres]);

  const movieSortBy = isMovieSortOption(filters.sortBy)
    ? filters.sortBy
    : 'rating';

  const sorted = useMemo(
    () => sortMovies(filtered, movieSortBy),
    [filtered, movieSortBy]
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
          </select>
          <ViewToggle
            value={filters.viewMode}
            onChange={(view) => setPartial({ viewMode: view })}
          />
          <button
            type="button"
            className="filter-toggle filter-toggle--inline"
            onClick={openMobileFilter}
            aria-label="Filter öffnen"
          >
            Filter
            {activeFilterCount > 0 && (
              <span className="filter-toggle__count">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

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
