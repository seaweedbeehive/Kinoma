import { NavLink, Link } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';

interface HeaderProps {
  onMenuClick: () => void;
  onFilterClick?: () => void;
  showFilterToggle?: boolean;
}

const HeartIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const MenuIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

const FilterIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 21v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7M9 10V3M15 10V3" />
  </svg>
);

export function Header({
  onMenuClick,
  onFilterClick,
  showFilterToggle = false,
}: HeaderProps) {
  const { favoritesCount } = useFavorites();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' is-active' : ''}`;

  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>

      <div className="header-inner container">
        <div className="header-start">
          <button
            type="button"
            className="menu-toggle"
            onClick={onMenuClick}
            aria-label="Menü öffnen"
          >
            <MenuIcon />
          </button>

          <Link to="/" className="brand">
            <span className="brand-logo" aria-hidden="true">
              🎬
            </span>
            <div className="brand-text">
              <span className="brand-title">Kinoma</span>
              <span className="brand-tagline">BERLIN CINEMA SHOWTIMES</span>
            </div>
          </Link>
        </div>

        <nav className="desktop-nav" aria-label="Hauptnavigation">
          <NavLink to="/movies" className={navLinkClass}>
            Filme
          </NavLink>
          <NavLink to="/" className={navLinkClass} end>
            Vorstellungen
          </NavLink>
          <NavLink to="/cinemas" className={navLinkClass}>
            Kinos
          </NavLink>
          <NavLink to="/favorites" className={navLinkClass}>
            Merkliste
            {favoritesCount > 0 && (
              <span className="nav-badge">{favoritesCount}</span>
            )}
          </NavLink>
        </nav>

        <div className="header-actions">
          <NavLink
            to="/favorites"
            className="header-action favorites-link"
            aria-label="Merkliste"
          >
            <HeartIcon />
            <span className="header-action__label">Merkliste</span>
            {favoritesCount > 0 && (
              <span className="header-action__count">{favoritesCount}</span>
            )}
          </NavLink>

          {showFilterToggle && (
            <button
              type="button"
              className="filter-toggle"
              onClick={onFilterClick}
              aria-label="Filter öffnen"
            >
              <FilterIcon />
              <span className="filter-toggle__label">Filter</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
