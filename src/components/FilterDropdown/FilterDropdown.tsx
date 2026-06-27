import { useEffect, useRef } from 'react';

interface FilterDropdownProps {
  label: string;
  activeCount?: number;
  children: React.ReactNode;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function FilterDropdown({
  label,
  activeCount,
  children,
  isOpen,
  onOpen,
  onClose,
}: FilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="filter-dropdown">
      <button
        type="button"
        className={`filter-dropdown__trigger${isOpen ? ' is-open' : ''}${
          activeCount ? ' has-active' : ''
        }`}
        onClick={isOpen ? onClose : onOpen}
        aria-expanded={isOpen}
      >
        <span className="filter-dropdown__label">{label}</span>
        {activeCount ? (
          <span className="filter-dropdown__count">{activeCount}</span>
        ) : null}
        <svg
          className="filter-dropdown__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="filter-dropdown__panel">
          <div className="filter-dropdown__content">{children}</div>
        </div>
      )}
    </div>
  );
}
