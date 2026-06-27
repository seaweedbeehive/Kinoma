import { useState } from 'react';
import { FilterDropdown } from '../FilterDropdown';
import { FilterPanel } from '../FilterPanel';
import { useGenres } from '../../hooks/useGenres';
import type { FilterState, LanguageFilters } from '../../hooks/useFilterState';

type FilterBarMode = 'movies' | 'showtimes';

interface FilterBarProps {
  mode?: FilterBarMode;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset?: () => void;
  activeFilterCount: number;
}

const LANGUAGE_OPTIONS = [
  { key: 'ov', label: 'OV (Originalversion)' },
  { key: 'omu', label: 'OmU (Original m. deutschen Untertiteln)' },
  { key: 'omeu', label: 'OmeU (Original m. englischen Untertiteln)' },
  { key: 'subtitled', label: 'Untertitel (beliebig)' },
  { key: 'englishSubtitles', label: 'Englische Untertitel' },
  { key: 'dubbed', label: 'Deutsch synchronisiert' },
] as const;

export function FilterBar({
  mode = 'showtimes',
  filters,
  onChange,
  onReset,
  activeFilterCount,
}: FilterBarProps) {
  const { data: genres, isLoading } = useGenres();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const open = (key: string) => setOpenDropdown(key);
  const close = () => setOpenDropdown(null);
  const openMobile = () => setIsMobileOpen(true);
  const closeMobile = () => setIsMobileOpen(false);

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

  const activeLanguageCount = Object.values(filters.languages).filter(Boolean).length;
  const activeTimeCount =
    Number(Boolean(filters.timeFrom)) + Number(Boolean(filters.timeTo));

  return (
    <div className="filter-bar">
      <div className="filter-bar__desktop">
        {mode === 'showtimes' && (
          <FilterDropdown
            label="Sprache"
            activeCount={activeLanguageCount || undefined}
            isOpen={openDropdown === 'language'}
            onOpen={() => open('language')}
            onClose={close}
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
          </FilterDropdown>
        )}

        {mode === 'showtimes' && (
          <FilterDropdown
            label="Zeit"
            activeCount={activeTimeCount || undefined}
            isOpen={openDropdown === 'time'}
            onOpen={() => open('time')}
            onClose={close}
          >
            <div className="time-range">
              <label className="sr-only" htmlFor="filterBarTimeFrom">
                Von
              </label>
              <input
                id="filterBarTimeFrom"
                type="time"
                value={filters.timeFrom}
                onChange={(e) => update('timeFrom', e.target.value)}
              />
              <span className="time-range__sep">bis</span>
              <label className="sr-only" htmlFor="filterBarTimeTo">
                Bis
              </label>
              <input
                id="filterBarTimeTo"
                type="time"
                value={filters.timeTo}
                onChange={(e) => update('timeTo', e.target.value)}
              />
            </div>
          </FilterDropdown>
        )}

        <FilterDropdown
          label="Genre"
          activeCount={filters.selectedGenres.length || undefined}
          isOpen={openDropdown === 'genre'}
          onOpen={() => open('genre')}
          onClose={close}
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
        </FilterDropdown>

        {mode === 'showtimes' && (
          <FilterDropdown
            label="Format"
            activeCount={filters.threeDOnly ? 1 : undefined}
            isOpen={openDropdown === 'format'}
            onOpen={() => open('format')}
            onClose={close}
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
          </FilterDropdown>
        )}

        {mode === 'showtimes' && (
          <FilterDropdown
            label="Kino"
            activeCount={filters.favoritesOnly ? 1 : undefined}
            isOpen={openDropdown === 'cinema'}
            onOpen={() => open('cinema')}
            onClose={close}
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
          </FilterDropdown>
        )}

        {mode === 'showtimes' && (
          <FilterDropdown
            label="Verfügbarkeit"
            activeCount={filters.hideSoldOut ? 1 : undefined}
            isOpen={openDropdown === 'availability'}
            onOpen={() => open('availability')}
            onClose={close}
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
          </FilterDropdown>
        )}
      </div>

      <button
        type="button"
        className="filter-bar__mobile-toggle"
        onClick={openMobile}
        aria-label="Filter öffnen"
      >
        Filter
        {activeFilterCount > 0 && (
          <span className="filter-bar__mobile-count">{activeFilterCount}</span>
        )}
      </button>

      {isMobileOpen && (
        <div
          className="filter-overlay is-visible"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`mobile-filter-panel${isMobileOpen ? ' is-open' : ''}`}
        aria-label="Filter"
        aria-hidden={!isMobileOpen}
      >
        <div className="filter-panel__header">
          <h2 className="filter-panel__title">Filter</h2>
          <button
            type="button"
            className="filter-panel__close"
            onClick={closeMobile}
            aria-label="Filter schließen"
          >
            ×
          </button>
        </div>
        <FilterPanel
          mode={mode}
          filters={filters}
          onChange={onChange}
          onApply={closeMobile}
          onReset={onReset}
        />
      </aside>
    </div>
  );
}
