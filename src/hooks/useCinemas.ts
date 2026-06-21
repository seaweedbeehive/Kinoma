import { useQuery } from '@tanstack/react-query';
import { getCinemas } from '../api/endpoints';

const STALE_TIME = 1000 * 60 * 5;

export function useCinemas() {
  return useQuery({
    queryKey: ['cinemas', 'Berlin'],
    queryFn: () =>
      getCinemas({ location: 'Berlin', limit: 100 }),
    staleTime: STALE_TIME,
  });
}
