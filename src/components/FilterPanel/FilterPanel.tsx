import { useGenres } from '../../hooks/useGenres';
import type { FilterState, LanguageFilters } from '../../hooks/useFilterState';

type FilterPanelMode = 'movies' | 'showtimes';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onApply?: () => void;
  onReset?: () => void;
  showReset?: boolean;
  mode?: FilterPanelMode;
}

const LANGUAGE_OPTIONS = [
  { key: 'ov', label: 'OV (Originalversion)' },
  { key: 'omu', label: 'OmU (Original m. deutschen Untertiteln)' },
  { key: 'omeu', label: 'OmeU (Original m. englischen Untertiteln)' },
  { key: 'subtitled', label: 'Untertitel (beliebig)' },
  { key: 'englishSubtitles', label: 'Englische Untertitel' },
  { key: 'dubbed', label: 'Deutsch synchronisiert' },
] as const;

export function FilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  showReset = true,
  mode = 'showtimes',
}: FilterPanelProps) {
  const { data: genres, isLoading } = useGenres();

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleLanguage = (key: keyof LanguageFilters) => {
    onChange({
      ...filters,
      languages: { ...filters.languages, [key]: !filters.languages[key] },
    });
  };

  const toggleGenre = (genreName: string) => {
    const next = filters.selectedGenres.includes(genreName)
      ? filters.selectedGenres.filter((g) => g !== genreName)
      : [...filters.selectedGenres, genreName];
    onChange({ ...filters, selectedGenres: next });
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <form className="filters" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="filter-group">
        <legend className="filter-group__title">Suche</legend>
        <label htmlFor="filterSearch" className="sr-only">
          Suche
        </label>
        <input
          id="filterSearch"
          type="search"
          className="search-input"
          placeholder="Film, Kino…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </fieldset>

      {mode === 'showtimes' && (
        <fieldset className="filter-group">
          <legend className="filter-group__title">Sprache / Untertitel</legend>
          <div className="checkbox-list">
            {LANGUAGE_OPTIONS.map(({ key, label }) => (
              <label key={key} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.languages[key]}
                  onChange={() => toggleLanguage(key)}
                />
                <span className="filter-option__text">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {mode === 'showtimes' && (
        <fieldset className="filter-group">
          <legend className="filter-group__title">Zeit</legend>
          <div className="time-range">
            <label className="sr-only" htmlFor="timeFrom">
              Von
            </label>
            <input
              id="timeFrom"
              type="time"
              value={filters.timeFrom}
              onChange={(e) => update('timeFrom', e.target.value)}
            />
            <span className="time-range__sep">bis</span>
            <label className="sr-only" htmlFor="timeTo">
              Bis
            </label>
            <input
              id="timeTo"
              type="time"
              value={filters.timeTo}
              onChange={(e) => update('timeTo', e.target.value)}
            />
          </div>
        </fieldset>
      )}

      <fieldset className="filter-group">
        <legend className="filter-group__title">Genre</legend>
        {isLoading && <p className="filter-hint">Lade Genres…</p>}
        <div className="checkbox-list">
          {(genres || []).map((genre) => (
            <label key={genre.name} className="filter-option">
              <input
                type="checkbox"
                checked={filters.selectedGenres.includes(genre.name)}
                onChange={() => toggleGenre(genre.name)}
              />
              <span className="filter-option__text">{genre.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {mode === 'showtimes' && (
        <fieldset className="filter-group">
          <legend className="filter-group__title">Format</legend>
          <div className="checkbox-list">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.threeDOnly}
                onChange={() => update('threeDOnly', !filters.threeDOnly)}
              />
              <span className="filter-option__text">Nur 3D</span>
            </label>
          </div>
        </fieldset>
      )}

      {mode === 'showtimes' && (
        <fieldset className="filter-group">
          <legend className="filter-group__title">Kino</legend>
          <div className="checkbox-list">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.favoritesOnly}
                onChange={() => update('favoritesOnly', !filters.favoritesOnly)}
              />
              <span className="filter-option__text">Nur Favoriten-Kinos</span>
            </label>
          </div>
        </fieldset>
      )}

      {mode === 'showtimes' && (
        <fieldset className="filter-group">
          <legend className="filter-group__title">Verfügbarkeit</legend>
          <div className="checkbox-list">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.hideSoldOut}
                onChange={() => update('hideSoldOut', !filters.hideSoldOut)}
              />
              <span className="filter-option__text">Ausverkaufte ausblenden</span>
            </label>
          </div>
        </fieldset>
      )}

      <div className="filter-actions">
        {showReset && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
          >
            Zurücksetzen
          </button>
        )}
        {onApply && (
          <button
            type="button"
            className="btn btn--primary filter-panel__apply"
            onClick={onApply}
          >
            Filter anwenden
          </button>
        )}
      </div>
    </form>
  );
}

export type { FilterState } from '../../hooks/useFilterState';
