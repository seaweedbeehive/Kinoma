import type { Show } from '../../api/types';

export interface EnrichedShow extends Show {
  cinemaId: string;
  cinemaName: string;
}
