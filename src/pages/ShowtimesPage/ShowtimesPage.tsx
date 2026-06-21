import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLayout } from '../../components/Layout/useLayout';
import { AggregatedShowtimeCard } from '../../components/ShowtimeCard';
import { ShowtimeListSkeleton } from '../../components/Skeleton';
import { FilterPanel } from '../../components/FilterPanel';
import { DateScroller } from '../../components/DateScroller';
import { ViewToggle } from '../../components/ViewToggle';
import { MovieQuickViewModal } from '../../components/MovieQuickViewModal';
import { useCinemas } from '../../hooks/useCinemas';
import { useFavorites } from '../../hooks/useFavorites';
import { useFilterState, type FilterState } from '../../hooks/useFilterState';
import { getShows } from '../../api/endpoints';
import {
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
} from '../../api/errors';
import { groupByDate, getRelativeDateLabel } from '../../utils/dateHelpers';
import { parseLanguageFlags, has3D } from '../../utils/flags';
import type { Cinema } from '../../api/types';
import type { EnrichedShow } from '../../components/ShowtimeCard';

const CHUNK_SIZE = 20;
const CHUNK_DELAY_MS = 120;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchChunkShows(
  chunk: Cinema[],
  date: string
): Promise<EnrichedShow[]> {
  const results = await Promise.allSettled(
    chunk.map(async (cinema) => {
      const shows = await getShows({ cinemaId: cinema.id, date, days: 1 });
      return shows.map((show) => ({
        ...show,
        cinemaId: cinema.id,
        cinemaName: cinema.name,
      }));
    })
  );

  return results.reduce<EnrichedShow[]>((acc, result) => {
    if (result.status === 'fulfilled') acc.push(...result.value);
    return acc;
  }, []);
}

function minutesFromTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function showMatchesFilters(
  show: EnrichedShow,
  filters: FilterState,
  favoriteCinemaIds: Set<string>
): boolean {
  const now = Date.now();
  if ((show.beginning?.timestamp || 0) * 1000 < now) return false;

  if (filters.search) {
    const haystack = normalize(
      `${show.movie?.title || ''} ${show.name} ${show.cinemaName} ${show.movie?.genres
        ?.map((g) => g.name)
        .join(' ') || ''}`
    );
    if (!haystack.includes(normalize(filters.search))) return false;
  }

  if (filters.selectedGenres.length) {
    const showGenres = new Set(show.movie?.genres?.map((g) => g.name) || []);
    if (!filters.selectedGenres.some((g) => showGenres.has(g))) return false;
  }

  const { isOV, isOmU, isOmeU, isSubtitled, isDubbed } = parseLanguageFlags(
    show.flags
  );
  const activeLangs = filters.languages;
  const anyLanguageSelected = Object.values(activeLangs).some(Boolean);

  if (anyLanguageSelected) {
    const englishSubtitlesMatch = isOmeU || (isOV && isSubtitled);
    const matches =
      (activeLangs.ov && isOV) ||
      (activeLangs.omu && isOmU) ||
      (activeLangs.omeu && isOmeU) ||
      (activeLangs.subtitled && isSubtitled) ||
      (activeLangs.englishSubtitles && englishSubtitlesMatch) ||
      (activeLangs.dubbed && isDubbed);
    if (!matches) return false;
  }

  if (filters.timeFrom || filters.timeTo) {
    const timestamp = show.beginning?.timestamp;
    if (!timestamp) return false;
    const date = new Date(timestamp * 1000);
    const showMinutes = date.getHours() * 60 + date.getMinutes();

    if (filters.timeFrom) {
      const fromMinutes = minutesFromTime(filters.timeFrom);
      if (showMinutes < fromMinutes) return false;
    }
    if (filters.timeTo) {
      const toMinutes = minutesFromTime(filters.timeTo);
      if (showMinutes > toMinutes) return false;
    }
  }

  if (filters.threeDOnly && !has3D(show.flags)) return false;
  if (filters.hideSoldOut && show.isSoldOut) return false;
  if (filters.favoritesOnly && !favoriteCinemaIds.has(show.cinemaId)) return false;

  return true;
}

function sortShows(shows: EnrichedShow[], sortBy: string): EnrichedShow[] {
  const sorted = [...shows];
  switch (sortBy) {
    case 'time-desc':
      sorted.sort(
        (a, b) =>
          (b.beginning?.timestamp || 0) - (a.beginning?.timestamp || 0)
      );
      break;
    case 'title-asc':
      sorted.sort((a, b) =>
        (a.movie?.title || a.name).localeCompare(b.movie?.title || b.name)
      );
      break;
    case 'rating-desc':
      sorted.sort(
        (a, b) =>
          (b.movie?.imdbRating || 0) - (a.movie?.imdbRating || 0) ||
          (a.beginning?.timestamp || 0) - (b.beginning?.timestamp || 0)
      );
      break;
    case 'time-asc':
    default:
      sorted.sort(
        (a, b) =>
          (a.beginning?.timestamp || 0) - (b.beginning?.timestamp || 0)
      );
  }
  return sorted;
}

function ActiveFilterChips({
  filters,
  onChange,
  onReset,
}: {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}) {
  const chips: { label: string; remove: () => void }[] = [];

  if (filters.search) {
    chips.push({
      label: `Suche: "${filters.search}"`,
      remove: () => onChange({ ...filters, search: '' }),
    });
  }

  filters.selectedGenres.forEach((genre) => {
    chips.push({
      label: genre,
      remove: () =>
        onChange({
          ...filters,
          selectedGenres: filters.selectedGenres.filter((g) => g !== genre),
        }),
    });
  });

  const langLabels: Record<keyof FilterState['languages'], string> = {
    ov: 'OV',
    omu: 'OmU',
    omeu: 'OmeU',
    subtitled: 'Untertitel',
    englishSubtitles: 'Englische Untertitel',
    dubbed: 'Deutsch',
  };

  (Object.keys(filters.languages) as (keyof FilterState['languages'])[]).forEach(
    (key) => {
      if (filters.languages[key]) {
        chips.push({
          label: langLabels[key],
          remove: () =>
            onChange({
              ...filters,
              languages: { ...filters.languages, [key]: false },
            }),
        });
      }
    }
  );

  if (filters.timeFrom || filters.timeTo) {
    chips.push({
      label: `${filters.timeFrom || '00:00'}–${filters.timeTo || '23:59'}`,
      remove: () => onChange({ ...filters, timeFrom: '', timeTo: '' }),
    });
  }

  if (filters.threeDOnly) {
    chips.push({
      label: 'Nur 3D',
      remove: () => onChange({ ...filters, threeDOnly: false }),
    });
  }

  if (filters.hideSoldOut) {
    chips.push({
      label: 'Ausverkaufte ausblenden',
      remove: () => onChange({ ...filters, hideSoldOut: false }),
    });
  }

  if (filters.favoritesOnly) {
    chips.push({
      label: 'Nur Favoriten',
      remove: () => onChange({ ...filters, favoritesOnly: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="active-filters" aria-label="Aktive Filter">
      {chips.map((chip) => (
        <span key={chip.label} className="active-filter-chip">
          {chip.label}
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`${chip.label} entfernen`}
          >
            ×
          </button>
        </span>
      ))}
      <button type="button" className="active-filters__clear" onClick={onReset}>
        Alle löschen
      </button>
    </div>
  );
}

export function ShowtimesPage() {
  const { setSidebar, openMobileFilter, closeMobileFilter } = useLayout();
  const { data: cinemas, isLoading: cinemasLoading } = useCinemas();
  const { favorites } = useFavorites();
  const { filters, setPartial, resetFilters, activeFilterCount } = useFilterState();

  const [selectedDate, setSelectedDateState] = useState(() =>
    formatDateKey(new Date())
  );
  const [loadedChunkCount, setLoadedChunkCount] = useState(0);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    setLoadedChunkCount(0);
  };

  const favoriteCinemaIds = useMemo(() => {
    const ids = new Set<string>();
    (cinemas || []).forEach((cinema) => {
      if (favorites.some((f) => f.id === cinema.id)) ids.add(cinema.id);
    });
    return ids;
  }, [cinemas, favorites]);

  const chunks = useMemo(() => {
    if (!cinemas) return [];
    return chunkArray(cinemas, CHUNK_SIZE);
  }, [cinemas]);

  const chunkQueries = useQueries({
    queries: chunks.map((chunk, index) => ({
      queryKey: ['shows-chunk', selectedDate, index],
      queryFn: () => fetchChunkShows(chunk, selectedDate),
      enabled: index < loadedChunkCount && chunk.length > 0,
      staleTime: 1000 * 60 * 5,
    })),
  });

  useEffect(() => {
    if (loadedChunkCount >= chunks.length) return;
    if (loadedChunkCount > 0 && chunkQueries[loadedChunkCount - 1]?.isLoading) {
      return;
    }
    const timer = setTimeout(() => {
      setLoadedChunkCount((prev) => Math.min(prev + 1, chunks.length));
    }, loadedChunkCount === 0 ? 0 : CHUNK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loadedChunkCount, chunks.length, chunkQueries]);

  const allShows = useMemo(() => {
    return chunkQueries.reduce<EnrichedShow[]>((acc, query) => {
      if (query.data) acc.push(...query.data);
      return acc;
    }, []);
  }, [chunkQueries]);

  const filteredShows = useMemo(() => {
    return allShows.filter((show) =>
      showMatchesFilters(show, filters, favoriteCinemaIds)
    );
  }, [allShows, filters, favoriteCinemaIds]);

  const sortedShows = useMemo(
    () => sortShows(filteredShows, filters.sortBy),
    [filteredShows, filters.sortBy]
  );

  const groupedShows = useMemo(
    () =>
      groupByDate(sortedShows, (show) =>
        show.beginning?.timestamp ? show.beginning.timestamp * 1000 : 0
      ),
    [sortedShows]
  );

  useEffect(() => {
    setSidebar(
      <FilterPanel
        filters={filters}
        onChange={setPartial}
        onApply={closeMobileFilter}
        onReset={resetFilters}
      />
    );
    return () => setSidebar(null);
  }, [setSidebar, filters, setPartial, closeMobileFilter, resetFilters]);

  const failedChunks = useMemo(
    () => chunkQueries.filter((q) => q.isError).length,
    [chunkQueries]
  );

  const firstChunkError = chunkQueries.find((q) => q.error)?.error;

  const loadedShowsCount = useMemo(
    () => chunkQueries.filter((q) => q.isSuccess).length * CHUNK_SIZE,
    [chunkQueries]
  );

  const isInitialLoading = cinemasLoading;
  const isLoadingShows = loadedChunkCount < chunks.length || chunkQueries.some((q) => q.isLoading);

  return (
    <div>
      <div className="content-bar">
        <div className="content-bar__search">
          <label htmlFor="showtimesSearch" className="sr-only">
            Vorstellung suchen
          </label>
          <input
            id="showtimesSearch"
            type="search"
            className="search-input"
            placeholder="Film oder Kino suchen…"
            value={filters.search}
            onChange={(e) => setPartial({ search: e.target.value })}
          />
        </div>

        <div className="content-bar__controls">
          <label htmlFor="sortSelect" className="sr-only">
            Sortieren
          </label>
          <select
            id="sortSelect"
            className="sort-select"
            value={filters.sortBy}
            onChange={(e) => setPartial({ sortBy: e.target.value })}
          >
            <option value="time-asc">Zeit: Früh → Spät</option>
            <option value="time-desc">Zeit: Spät → Früh</option>
            <option value="title-asc">Titel: A → Z</option>
            <option value="rating-desc">IMDb: Hoch → Niedrig</option>
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

      <DateScroller
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        days={7}
      />

      {failedChunks > 0 && (
        <div className="error-banner" role="alert">
          <p>
            {firstChunkError instanceof TimeoutError
              ? 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.'
              : firstChunkError instanceof NotFoundError
                ? 'Keine Ergebnisse gefunden.'
                : firstChunkError instanceof ServerError
                  ? 'Server-Fehler. Bitte später erneut versuchen.'
                  : firstChunkError instanceof NetworkError
                    ? 'Keine Verbindung zum Kinova-Backend. Bitte stelle sicher, dass es auf localhost:8001 läuht.'
                    : `Vorstellungen aus ${failedChunks * CHUNK_SIZE} Kinos konnten nicht geladen werden.`}
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => window.location.reload()}
          >
            Erneut versuchen
          </button>
        </div>
      )}

      <ActiveFilterChips
        filters={filters}
        onChange={setPartial}
        onReset={resetFilters}
      />

      {isLoadingShows && !isInitialLoading && (
        <p className="results-meta">
          Lade Vorstellungen aus {cinemas?.length || 0} Kinos…
          {loadedShowsCount > 0 && (
            <span> ({loadedShowsCount} geladen)</span>
          )}
        </p>
      )}

      {!isLoadingShows && (
        <p className="results-meta">
          <strong>{sortedShows.length}</strong>{' '}
          {sortedShows.length === 1
            ? 'Vorstellung gefunden'
            : 'Vorstellungen gefunden'}
        </p>
      )}

      {isInitialLoading ? (
        <section aria-label="Vorstellungen werden geladen">
          <div className="showtime-date-groups">
            <div className="date-group">
              <div className="skeleton skeleton--title skeleton--date" />
              <ShowtimeListSkeleton count={6} />
            </div>
          </div>
        </section>
      ) : sortedShows.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">
            Keine Vorstellungen mit diesen Filtern gefunden
          </p>
          <p className="empty-state__hint">
            Passe die Suche, Filter oder das Datum an.
          </p>
          <div className="empty-state__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={resetFilters}
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      ) : (
        <div className="showtime-date-groups">
          {Object.entries(groupedShows).map(([dateKey, dateShows]) => (
            <section key={dateKey} className="date-group">
              <h3 className="date-group__title">
                {getRelativeDateLabel(dateKey)}
              </h3>
              <div
                className={`results-grid${
                  filters.viewMode === 'list' ? ' is-list' : ''
                }`}
              >
                {dateShows.map((show) => (
                  <AggregatedShowtimeCard
                    key={show.id}
                    show={show}
                    variant={filters.viewMode}
                    onSelect={setSelectedMovieId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <MovieQuickViewModal
        movieId={selectedMovieId || ''}
        isOpen={Boolean(selectedMovieId)}
        onClose={() => setSelectedMovieId(null)}
      />
    </div>
  );
}
