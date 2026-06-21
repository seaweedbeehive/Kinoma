import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { LayoutProvider } from './LayoutContext';
import { useLayout } from './useLayout';
import { useScrollToTop } from '../../hooks/useScrollToTop';

function LayoutInner() {
  useScrollToTop();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    sidebar,
    isMobileFilterOpen,
    openMobileFilter,
    closeMobileFilter,
  } = useLayout();

  const hasSidebar = Boolean(sidebar);

  return (
    <div className="app-shell">
      <Header
        onMenuClick={() => setIsDrawerOpen(true)}
        onFilterClick={hasSidebar ? openMobileFilter : undefined}
        showFilterToggle={hasSidebar}
      />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onFilterClick={hasSidebar ? openMobileFilter : undefined}
        showFilterToggle={hasSidebar}
      />

      {hasSidebar && (
        <>
          <div
            className={`filter-overlay${isMobileFilterOpen ? ' is-visible' : ''}`}
            onClick={closeMobileFilter}
            aria-hidden="true"
          />
          <aside
            className={`mobile-filter-panel${isMobileFilterOpen ? ' is-open' : ''}`}
            aria-label="Filter"
            aria-hidden={!isMobileFilterOpen}
          >
            <div className="filter-panel__header">
              <h2 className="filter-panel__title">Filter</h2>
              <button
                type="button"
                className="filter-panel__close"
                onClick={closeMobileFilter}
                aria-label="Filter schließen"
              >
                ×
              </button>
            </div>
            {sidebar}
          </aside>
        </>
      )}

      <div className={`app-layout${hasSidebar ? ' has-sidebar' : ''}`}>
        {hasSidebar && (
          <aside className="sidebar" aria-label="Filter">
            {sidebar}
          </aside>
        )}

        <main id="main" className="main-content">
          <Outlet />
        </main>
      </div>

      <footer className="site-footer">
        <div className="container">
          <p>© 2026 Kinoma · Berlin showtimes aggregator</p>
        </div>
      </footer>
    </div>
  );
}

export function Layout() {
  return (
    <LayoutProvider>
      <LayoutInner />
    </LayoutProvider>
  );
}
