import { useQueries } from '@tanstack/react-query';
import { searchMovie, titleKey } from '../api/tmdb';
import type { Movie } from '../api/types';

const STALE_TIME = 1000 * 60 * 30;

export interface MoviePopularity {
  popularity: number;
  voteAverage: number;
  matchedTitle: string;
}

export function useMoviePopularity(movies: Movie[] | undefined) {
  const queries = useQueries({
    queries: (movies || []).map((movie) => ({
      queryKey: ['tmdb', 'search', titleKey(movie.title)],
      queryFn: async () => {
        const data = await searchMovie(movie.title);
        const result = data.results[0];
        return {
          movieId: movie.id,
          key: titleKey(movie.title),
          popularity: result?.popularity ?? 0,
          voteAverage: result?.vote_average ?? 0,
          matchedTitle: result?.title ?? '',
        };
      },
      staleTime: STALE_TIME,
      retry: 1,
      enabled: Boolean(movies?.length),
    })),
  });

  const map = new Map<string, MoviePopularity>();
  queries.forEach((query) => {
    if (query.data) {
      map.set(query.data.key, {
        popularity: query.data.popularity,
        voteAverage: query.data.voteAverage,
        matchedTitle: query.data.matchedTitle,
      });
    }
  });

  return map;
}
