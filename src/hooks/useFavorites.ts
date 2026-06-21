import { useState, useCallback } from 'react';

const FAVORITES_KEY = 'kinoma-favorites';

interface FavoriteItem {
  id: string;
  type: 'movie' | 'cinema';
}

function migrateLegacyFavorites(raw: string | null): FavoriteItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return [];
      // New format
      if (typeof parsed[0] === 'object' && parsed[0] !== null && 'type' in parsed[0]) {
        return parsed as FavoriteItem[];
      }
      // Legacy string array: infer type by prefix (cinema IDs often contain slug-like values)
      return (parsed as string[]).map((id) => ({
        id,
        type: id.startsWith('cinema') ? 'cinema' : 'movie',
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function readFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  return migrateLegacyFavorites(localStorage.getItem(FAVORITES_KEY));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(readFavorites);

  const toggleFavorite = useCallback((id: string, type: 'movie' | 'cinema') => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === id);
      const next = exists
        ? prev.filter((f) => f.id !== id)
        : [...prev, { id, type }];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const movieIds = favorites.filter((f) => f.type === 'movie').map((f) => f.id);
  const cinemaIds = favorites.filter((f) => f.type === 'cinema').map((f) => f.id);
  const favoritesCount = favorites.length;

  return {
    favorites,
    movieIds,
    cinemaIds,
    favoritesCount,
    toggleFavorite,
    isFavorite,
  };
}
