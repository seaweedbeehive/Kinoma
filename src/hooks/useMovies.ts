import { useQuery } from '@tanstack/react-query';
import { getMovies } from '../api/endpoints';

const STALE_TIME = 1000 * 60 * 5;

export function useMovies() {
  return useQuery({
    queryKey: ['movies', 'Berlin', 'NOW'],
    queryFn: () =>
      getMovies({ location: 'Berlin', playing: 'NOW' }),
    staleTime: STALE_TIME,
  });
}
