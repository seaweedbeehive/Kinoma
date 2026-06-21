import { useMemo, useRef } from 'react';

interface DateScrollerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  days?: number;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLabel(date: Date): { day: string; date: string } {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return { day: 'Heute', date: '' };
  if (isSameDay(date, tomorrow)) return { day: 'Morgen', date: '' };

  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const day = weekdays[date.getDay()];
  const dateLabel = `${String(date.getDate()).padStart(2, '0')}.${String(
    date.getMonth() + 1
  ).padStart(2, '0')}.`;
  return { day, date: dateLabel };
}

export function DateScroller({
  selectedDate,
  onSelect,
  days = 7,
}: DateScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => {
    const result: { key: string; date: Date }[] = [];
    const today = new Date();
    for (let i = 0; i <= days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push({ key: formatDateKey(date), date });
    }
    return result;
  }, [days]);

  const scroll = (direction: -1 | 1) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: direction * 200, behavior: 'smooth' });
  };

  return (
    <div className="date-scroller">
      <button
        type="button"
        className="date-scroller__nav date-scroller__nav--prev"
        onClick={() => scroll(-1)}
        aria-label="Tage zurück"
      >
        ‹
      </button>

      <div className="date-scroller__track" ref={trackRef} role="tablist">
        {dates.map(({ key, date }) => {
          const label = getLabel(date);
          const isActive = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              className={`date-chip${isActive ? ' is-active' : ''}`}
              onClick={() => onSelect(key)}
              role="tab"
              aria-selected={isActive}
            >
              <span className="date-chip__day">{label.day}</span>
              {label.date && <span className="date-chip__date">{label.date}</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="date-scroller__nav date-scroller__nav--next"
        onClick={() => scroll(1)}
        aria-label="Tage vor"
      >
        ›
      </button>
    </div>
  );
}
