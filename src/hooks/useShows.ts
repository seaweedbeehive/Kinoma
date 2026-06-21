import { useQuery } from '@tanstack/react-query';
import { getShows } from '../api/endpoints';

const STALE_TIME = 1000 * 60 * 5;

interface UseShowsOptions {
  cinemaId: string;
  movieId?: string;
  date?: string;
  days?: number;
}

export function useShows({
  cinemaId,
  movieId,
  date,
  days = 7,
}: UseShowsOptions) {
  return useQuery({
    queryKey: ['shows', cinemaId, date, days, movieId],
    queryFn: () => getShows({ cinemaId, movieId, date, days }),
    enabled: Boolean(cinemaId),
    staleTime: STALE_TIME,
    refetchInterval: 1000 * 60,
  });
}
