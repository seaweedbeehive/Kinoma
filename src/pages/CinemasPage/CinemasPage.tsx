import { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../components/Layout/useLayout';
import { CinemaCard } from '../../components/CinemaCard';
import { CinemaCardSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { ViewToggle } from '../../components/ViewToggle';
import { useCinemas } from '../../hooks/useCinemas';
import { useFilterState } from '../../hooks/useFilterState';
import type { Cinema } from '../../api/types';

type CinemaSortOption = 'name' | 'distance';

const CINEMA_SORT_OPTIONS: CinemaSortOption[] = ['name', 'distance'];

function isCinemaSortOption(value: string): value is CinemaSortOption {
  return CINEMA_SORT_OPTIONS.includes(value as CinemaSortOption);
}

interface CinemaTypeFilters {
  openAir: boolean;
  driveIn: boolean;
  stationary: boolean;
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

function filterCinemas(
  cinemas: Cinema[],
  searchQuery: string,
  typeFilters: CinemaTypeFilters
): Cinema[] {
  const terms = normalize(searchQuery).split(/\s+/).filter(Boolean);

  return cinemas.filter((cinema) => {
    if (terms.length) {
      const haystack = normalize(
        `${cinema.name} ${cinema.street || ''} ${cinema.city?.name || ''}`
      );
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    if (typeFilters.openAir && !cinema.isOpenAirCinema) return false;
    if (typeFilters.driveIn && !cinema.isDriveInCinema) return false;
    if (typeFilters.stationary && !cinema.isStationaryCinema) return false;

    return true;
  });
}

function sortCinemas(cinemas: Cinema[], sortBy: CinemaSortOption): Cinema[] {
  const sorted = [...cinemas];
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'distance':
      sorted.sort(
        (a, b) =>
          (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
          a.name.localeCompare(b.name)
      );
      break;
  }
  return sorted;
}

function CinemasSidebar({
  typeFilters,
  onChange,
}: {
  typeFilters: CinemaTypeFilters;
  onChange: (filters: CinemaTypeFilters) => void;
}) {
  const toggle = (key: keyof CinemaTypeFilters) => {
    onChange({ ...typeFilters, [key]: !typeFilters[key] });
  };

  return (
    <form className="filters" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="filter-group">
        <legend className="filter-group__title">Kinotyp</legend>
        <div className="checkbox-list">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={typeFilters.openAir}
              onChange={() => toggle('openAir')}
            />
            <span className="filter-option__text">Freiluftkino</span>
          </label>
          <label className="filter-option">
            <input
              type="checkbox"
              checked={typeFilters.driveIn}
              onChange={() => toggle('driveIn')}
            />
            <span className="filter-option__text">Autokino</span>
          </label>
          <label className="filter-option">
            <input
              type="checkbox"
              checked={typeFilters.stationary}
              onChange={() => toggle('stationary')}
            />
            <span className="filter-option__text">Stationär</span>
          </label>
        </div>
      </fieldset>
    </form>
  );
}

export function CinemasPage() {
  const { setSidebar, openMobileFilter } = useLayout();
  const { data: cinemas, isLoading, error } = useCinemas();
  const { filters, setPartial, activeFilterCount } = useFilterState();

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  const [typeFilters, setTypeFilters] = useState<CinemaTypeFilters>({
    openAir: false,
    driveIn: false,
    stationary: false,
  });

  useEffect(() => {
    setPartial({ search: debouncedSearch });
  }, [debouncedSearch, setPartial]);

  useEffect(() => {
    setSidebar(
      <CinemasSidebar typeFilters={typeFilters} onChange={setTypeFilters} />
    );
    return () => setSidebar(null);
  }, [setSidebar, typeFilters]);

  const filtered = useMemo(() => {
    if (!cinemas) return [];
    return filterCinemas(cinemas, filters.search, typeFilters);
  }, [cinemas, filters.search, typeFilters]);

  const cinemaSortBy = isCinemaSortOption(filters.sortBy)
    ? filters.sortBy
    : 'name';

  const sorted = useMemo(
    () => sortCinemas(filtered, cinemaSortBy),
    [filtered, cinemaSortBy]
  );

  if (isLoading) {
    return (
      <section className="results-grid" aria-label="Kinos werden geladen">
        {Array.from({ length: 8 }).map((_, i) => (
          <CinemaCardSkeleton key={i} variant={filters.viewMode} />
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
          <label htmlFor="cinemaSearch" className="sr-only">
            Kino suchen
          </label>
          <input
            id="cinemaSearch"
            type="search"
            className="search-input"
            placeholder="Kino, Adresse…"
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
            value={cinemaSortBy}
            onChange={(e) => setPartial({ sortBy: e.target.value })}
          >
            <option value="name">Name: A → Z</option>
            <option value="distance">Entfernung</option>
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
        {sorted.length === 1 ? 'Kino gefunden' : 'Kinos gefunden'}
      </p>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">Keine Kinos gefunden</p>
          <p className="empty-state__hint">
            Passe die Suche oder Filter an, um mehr Ergebnisse zu sehen.
          </p>
        </div>
      ) : (
        <section
          className={`results-grid${filters.viewMode === 'list' ? ' is-list' : ''}`}
          aria-label="Kinos"
        >
          {sorted.map((cinema) => (
            <CinemaCard key={cinema.id} cinema={cinema} variant={filters.viewMode} />
          ))}
        </section>
      )}
    </div>
  );
}
