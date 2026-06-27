import { useState } from 'react';

interface CollapsibleFilterGroupProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: 'row' | 'stack';
  activeCount?: number;
  className?: string;
}

const ChevronIcon = ({ expanded }: { expanded?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`collapsible-filter__chevron${expanded ? ' is-open' : ''}`}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function CollapsibleFilterGroup({
  title,
  children,
  defaultExpanded = true,
  variant = 'stack',
  activeCount,
  className = '',
}: CollapsibleFilterGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => setExpanded((prev) => !prev);

  const collapsedTitle =
    activeCount !== undefined && activeCount > 0
      ? `${title} ${activeCount}`
      : `${title} Alle`;

  return (
    <div
      className={[
        'collapsible-filter',
        `collapsible-filter--${variant}`,
        expanded ? 'is-expanded' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="collapsible-filter__toggle"
        onClick={toggle}
        aria-expanded={expanded}
      >
        <span className="collapsible-filter__title">
          {expanded ? title : collapsedTitle}
        </span>
        <ChevronIcon expanded={expanded} />
      </button>
      <div className="collapsible-filter__content">
        <div className="collapsible-filter__inner">{children}</div>
      </div>
    </div>
  );
}
