import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface LanguageFilters {
  ov: boolean;
  omu: boolean;
  omeu: boolean;
  subtitled: boolean;
  englishSubtitles: boolean;
  dubbed: boolean;
}

export interface FilterState {
  search: string;
  selectedGenres: string[];
  languages: LanguageFilters;
  timeFrom: string;
  timeTo: string;
  favoritesOnly: boolean;
  threeDOnly: boolean;
  hideSoldOut: boolean;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

const DEFAULT_STATE: FilterState = {
  search: '',
  selectedGenres: [],
  languages: {
    ov: false,
    omu: false,
    omeu: false,
    subtitled: false,
    englishSubtitles: false,
    dubbed: false,
  },
  timeFrom: '',
  timeTo: '',
  favoritesOnly: false,
  threeDOnly: false,
  hideSoldOut: false,
  sortBy: 'time-asc',
  viewMode: 'grid',
};

function parseLanguages(value: string | null): LanguageFilters {
  if (!value) return DEFAULT_STATE.languages;
  const codes = value.split(',').map((c) => c.trim().toLowerCase());
  return {
    ov: codes.includes('ov'),
    omu: codes.includes('omu'),
    omeu: codes.includes('omeu'),
    subtitled: codes.includes('subtitled'),
    englishSubtitles: codes.includes('englishsubtitles'),
    dubbed: codes.includes('dubbed'),
  };
}

function serializeLanguages(languages: LanguageFilters): string {
  const codes: string[] = [];
  if (languages.ov) codes.push('ov');
  if (languages.omu) codes.push('omu');
  if (languages.omeu) codes.push('omeu');
  if (languages.subtitled) codes.push('subtitled');
  if (languages.englishSubtitles) codes.push('englishsubtitles');
  if (languages.dubbed) codes.push('dubbed');
  return codes.join(',');
}

function parseString(value: string | null, fallback: string): string {
  return value ?? fallback;
}

function parseBool(value: string | null): boolean {
  return value === 'true' || value === '1';
}

function parseArray(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function stateFromParams(params: URLSearchParams): FilterState {
  return {
    search: parseString(params.get('search'), DEFAULT_STATE.search),
    selectedGenres: parseArray(params.get('genres')),
    languages: parseLanguages(params.get('lang')),
    timeFrom: parseString(params.get('timeFrom'), DEFAULT_STATE.timeFrom),
    timeTo: parseString(params.get('timeTo'), DEFAULT_STATE.timeTo),
    favoritesOnly: parseBool(params.get('favoritesOnly')),
    threeDOnly: parseBool(params.get('threeDOnly')),
    hideSoldOut: parseBool(params.get('hideSoldOut')),
    sortBy: parseString(params.get('sortBy'), DEFAULT_STATE.sortBy),
    viewMode:
      params.get('view') === 'list'
        ? 'list'
        : DEFAULT_STATE.viewMode,
  };
}

function paramsFromState(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.search) params.set('search', state.search);
  if (state.selectedGenres.length) params.set('genres', state.selectedGenres.join(','));

  const lang = serializeLanguages(state.languages);
  if (lang) params.set('lang', lang);

  if (state.timeFrom) params.set('timeFrom', state.timeFrom);
  if (state.timeTo) params.set('timeTo', state.timeTo);
  if (state.favoritesOnly) params.set('favoritesOnly', 'true');
  if (state.threeDOnly) params.set('threeDOnly', 'true');
  if (state.hideSoldOut) params.set('hideSoldOut', 'true');
  if (state.sortBy && state.sortBy !== DEFAULT_STATE.sortBy) params.set('sortBy', state.sortBy);
  if (state.viewMode === 'list') params.set('view', 'list');

  return params;
}

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => stateFromParams(searchParams), [searchParams]);

  const updateUrl = useCallback(
    (next: FilterState) => {
      setSearchParams(paramsFromState(next), { replace: true });
    },
    [setSearchParams]
  );

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const next = { ...filters, [key]: value };
      updateUrl(next);
    },
    [filters, updateUrl]
  );

  const setPartial = useCallback(
    (partial: Partial<FilterState>) => {
      const next = { ...filters, ...partial };
      updateUrl(next);
    },
    [filters, updateUrl]
  );

  const toggleLanguage = useCallback(
    (key: keyof LanguageFilters) => {
      const next = {
        ...filters,
        languages: { ...filters.languages, [key]: !filters.languages[key] },
      };
      updateUrl(next);
    },
    [filters, updateUrl]
  );

  const toggleGenre = useCallback(
    (genre: string) => {
      const selected = filters.selectedGenres.includes(genre)
        ? filters.selectedGenres.filter((g) => g !== genre)
        : [...filters.selectedGenres, genre];
      const next = { ...filters, selectedGenres: selected };
      updateUrl(next);
    },
    [filters, updateUrl]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.selectedGenres.length;
    count += Object.values(filters.languages).filter(Boolean).length;
    if (filters.timeFrom || filters.timeTo) count++;
    if (filters.favoritesOnly) count++;
    if (filters.threeDOnly) count++;
    if (filters.hideSoldOut) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilter,
    setPartial,
    toggleLanguage,
    toggleGenre,
    resetFilters,
    activeFilterCount,
  };
}
