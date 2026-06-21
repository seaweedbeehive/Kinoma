import { useSearchParams } from 'react-router-dom';

export type ViewMode = 'grid' | 'list';

const GridIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
  </svg>
);

interface ViewToggleProps {
  value?: ViewMode;
  onChange?: (view: ViewMode) => void;
  defaultView?: ViewMode;
}

export function ViewToggle({
  value,
  onChange,
  defaultView = 'grid',
}: ViewToggleProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentView: ViewMode =
    value ?? (searchParams.get('view') === 'list' ? 'list' : defaultView);

  const setView = (view: ViewMode) => {
    if (onChange) {
      onChange(view);
      return;
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (view === defaultView) {
          next.delete('view');
        } else {
          next.set('view', view);
        }
        return next;
      },
      { replace: true }
    );
  };

  return (
    <div className="view-toggle" role="group" aria-label="Ansicht">
      <button
        type="button"
        className={`view-toggle__btn${currentView === 'grid' ? ' is-active' : ''}`}
        aria-pressed={currentView === 'grid'}
        title="Kachelansicht"
        onClick={() => setView('grid')}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        className={`view-toggle__btn${currentView === 'list' ? ' is-active' : ''}`}
        aria-pressed={currentView === 'list'}
        title="Listenansicht"
        onClick={() => setView('list')}
      >
        <ListIcon />
      </button>
    </div>
  );
}
