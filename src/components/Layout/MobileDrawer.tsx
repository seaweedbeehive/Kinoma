import { NavLink } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterClick?: () => void;
  showFilterToggle?: boolean;
}

export function MobileDrawer({
  isOpen,
  onClose,
  onFilterClick,
  showFilterToggle = false,
}: MobileDrawerProps) {
  const { favoritesCount } = useFavorites();
  const drawerRef = useFocusTrap<HTMLElement>(isOpen);

  const handleFilterClick = () => {
    onClose();
    onFilterClick?.();
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `drawer-link${isActive ? ' is-active' : ''}`;

  return (
    <>
      <div
        className={`drawer-overlay${isOpen ? ' is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={drawerRef}
        className={`mobile-drawer${isOpen ? ' is-open' : ''}`}
        aria-label="Mobile Navigation"
        aria-hidden={!isOpen}
      >
        <div className="drawer-header">
          <span className="drawer-title">Menü</span>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Menü schließen"
          >
            ×
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Mobile Navigation">
          <NavLink to="/movies" className={linkClass} onClick={onClose}>
            Filme
          </NavLink>
          <NavLink to="/" className={linkClass} onClick={onClose} end>
            Vorstellungen
          </NavLink>
          <NavLink to="/cinemas" className={linkClass} onClick={onClose}>
            Kinos
          </NavLink>
          <NavLink to="/favorites" className={linkClass} onClick={onClose}>
            Merkliste
            {favoritesCount > 0 && (
              <span className="drawer-badge">{favoritesCount}</span>
            )}
          </NavLink>
        </nav>

        {showFilterToggle && (
          <div className="drawer-section">
            <button
              type="button"
              className="btn btn--ghost drawer-filter-btn"
              onClick={handleFilterClick}
            >
              Filter anzeigen
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
