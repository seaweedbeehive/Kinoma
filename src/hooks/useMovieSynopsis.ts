import { useQuery } from '@tanstack/react-query';
import { getMovieDetails, hasTmdbKey, searchMovie } from '../api/tmdb';
import { hasLlmKey, translateToGerman } from '../api/llm';
import type { Movie } from '../api/types';

const STALE_TIME = 1000 * 60 * 60 * 24; // 24 hours

export type SynopsisSource = 'kinova' | 'tmdb-de' | 'tmdb-en' | 'tmdb-en-llm';

export interface MovieSynopsis {
  text: string;
  source: SynopsisSource;
}

function cleanOverview(overview?: string): string | undefined {
  if (!overview) return undefined;
  const trimmed = overview.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function fetchTmdbSynopsis(title: string): Promise<MovieSynopsis | null> {
  if (!hasTmdbKey()) {
    return null;
  }

  const search = await searchMovie(title);
  const match = search.results[0];
  if (!match) {
    return null;
  }

  // Prefer a German overview directly from TMDB.
  const germanDetails = await getMovieDetails(match.id, 'de-DE');
  const germanOverview = cleanOverview(germanDetails.overview);
  if (germanOverview) {
    return { text: germanOverview, source: 'tmdb-de' };
  }

  // Fall back to the English overview and translate if an LLM key is available.
  const englishDetails = await getMovieDetails(match.id, 'en-US');
  const englishOverview = cleanOverview(englishDetails.overview);
  if (!englishOverview) {
    return null;
  }

  if (!hasLlmKey()) {
    return { text: englishOverview, source: 'tmdb-en' };
  }

  const translation = await translateToGerman(englishOverview);
  if (translation) {
    return { text: translation.text, source: 'tmdb-en-llm' };
  }

  return { text: englishOverview, source: 'tmdb-en' };
}

export function useMovieSynopsis(movie: Movie | undefined | null) {
  return useQuery<MovieSynopsis | null, Error>({
    queryKey: ['movieSynopsis', movie?.id, movie?.title],
    queryFn: async () => {
      if (!movie) return null;

      const tmdbSynopsis = await fetchTmdbSynopsis(movie.title);
      if (tmdbSynopsis) {
        return tmdbSynopsis;
      }

      const kinovaOverview = cleanOverview(movie.description);
      if (kinovaOverview) {
        return { text: kinovaOverview, source: 'kinova' as const };
      }

      return null;
    },
    enabled: Boolean(movie),
    staleTime: STALE_TIME,
    retry: 1,
  });
}
