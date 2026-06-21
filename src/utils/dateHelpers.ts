const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const FULL_WEEKDAYS = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date as 'Heute', 'Morgen', or a locale date string.
 */
export function formatDate(date: Date): string {
  const today = stripTime(new Date());
  const target = stripTime(date);
  const diffDays =
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';

  return target.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Group items by a local date string derived from a timestamp getter.
 */
export function groupByDate<T>(
  items: T[],
  getTimestamp: (item: T) => number
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const timestamp = getTimestamp(item);
    if (!timestamp || Number.isNaN(timestamp)) return groups;

    const date = new Date(timestamp);
    const key = formatLocalDateKey(date);

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Check whether a YYYY-MM-DD string represents today.
 */
export function isToday(dateStr: string): boolean {
  const date = parseLocalDate(dateStr);
  const today = stripTime(new Date());
  return date.getTime() === today.getTime();
}

/**
 * Return 'Heute', 'Morgen', or a formatted date label for a YYYY-MM-DD string.
 */
export function getRelativeDateLabel(dateStr: string): 'Heute' | 'Morgen' | string {
  const date = parseLocalDate(dateStr);
  const today = stripTime(new Date());
  const diffDays =
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';

  const weekday = FULL_WEEKDAYS[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday}, ${day}.${month}.`;
}

/**
 * Shift a base date by a target day offset while preserving the wall-clock time.
 * This mirrors the date-shifting logic used in the original MVP.
 */
export function shiftDateToToday(
  baseDate: Date,
  targetDayOffset: number
): Date {
  const now = new Date();
  const shifted = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + targetDayOffset,
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    baseDate.getMilliseconds()
  );
  return shifted;
}

export { WEEKDAYS, FULL_WEEKDAYS };
