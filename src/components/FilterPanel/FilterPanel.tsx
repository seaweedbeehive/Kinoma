import { useGenres } from '../../hooks/useGenres';
import type { FilterState, LanguageFilters } from '../../hooks/useFilterState';
import { CollapsibleFilterGroup } from '../CollapsibleFilterGroup';

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

  const activeLanguageCount = Object.values(filters.languages).filter(Boolean).length;
  const activeTimeCount = Number(Boolean(filters.timeFrom)) + Number(Boolean(filters.timeTo));

  return (
    <form className="filters" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      {mode === 'showtimes' && (
        <CollapsibleFilterGroup
          title="Sprache / Untertitel"
          activeCount={activeLanguageCount}
          defaultExpanded
        >
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
        </CollapsibleFilterGroup>
      )}

      {mode === 'showtimes' && (
        <CollapsibleFilterGroup title="Zeit" activeCount={activeTimeCount} defaultExpanded>
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
        </CollapsibleFilterGroup>
      )}

      <CollapsibleFilterGroup
        title="Genre"
        activeCount={filters.selectedGenres.length}
        defaultExpanded
      >
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
      </CollapsibleFilterGroup>

      {mode === 'showtimes' && (
        <CollapsibleFilterGroup
          title="Format"
          activeCount={filters.threeDOnly ? 1 : 0}
          defaultExpanded
        >
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
        </CollapsibleFilterGroup>
      )}

      {mode === 'showtimes' && (
        <CollapsibleFilterGroup
          title="Kino"
          activeCount={filters.favoritesOnly ? 1 : 0}
          defaultExpanded
        >
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
        </CollapsibleFilterGroup>
      )}

      {mode === 'showtimes' && (
        <CollapsibleFilterGroup
          title="Verfügbarkeit"
          activeCount={filters.hideSoldOut ? 1 : 0}
          defaultExpanded
        >
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
        </CollapsibleFilterGroup>
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
