import { useSearchParams } from 'react-router-dom';
import type { ViewMode } from './ViewToggle';

export function useViewMode(defaultView: ViewMode = 'grid'): ViewMode {
  const [searchParams] = useSearchParams();
  return searchParams.get('view') === 'list' ? 'list' : defaultView;
}
