import { useQuery } from '@tanstack/react-query';
import { getCinema } from '../api/endpoints';

const STALE_TIME = 1000 * 60 * 5;

export function useCinema(cinemaId: string) {
  return useQuery({
    queryKey: ['cinema', cinemaId],
    queryFn: () => getCinema(cinemaId),
    enabled: Boolean(cinemaId),
    staleTime: STALE_TIME,
  });
}
