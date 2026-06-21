import { useQuery } from '@tanstack/react-query';
import { getMovie } from '../api/endpoints';

const STALE_TIME = 1000 * 60 * 5;

export function useMovie(movieId: string) {
  return useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => getMovie(movieId),
    enabled: Boolean(movieId),
    staleTime: STALE_TIME,
  });
}
