/**
 * Single source of truth for human-readable timestamps.
 *
 * Previously each surface had its own formatter and they all printed
 * unbounded day counts ("257d ago" for a months-old drought record). Nobody
 * needs a 257-day relative time — beyond a week the exact date is more
 * useful. The freshness policy (lib/dataPolicy.ts) drops anything older than
 * its hazard window anyway, so in practice this mostly guards notification
 * rows and edge cases.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "12 Aug" — compact calendar date for anything a week or older. */
export function formatCalendarDate(timestampMs: number): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    timestampMs
  );
}

/**
 * Relative time for a timestamp in ms:
 *   < 1m    → "just now"
 *   < 1h    → "42m ago"
 *   < 24h   → "3h 15m ago" (minutes omitted when zero)
 *   < 7d    → "4d ago"
 *   ≥ 7d    → "12 Aug" (calendar date — never "257d ago")
 */
export function formatRelativeTime(timestampMs: number): string {
  if (!Number.isFinite(timestampMs)) return '—';

  const elapsed = Date.now() - timestampMs;

  // Clock skew / slightly-future records read as fresh, not negative.
  if (elapsed < MINUTE_MS) return 'just now';

  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  }

  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    const mins = Math.floor((elapsed % HOUR_MS) / MINUTE_MS);
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  }

  const days = Math.floor(elapsed / DAY_MS);
  if (days < 7) return `${days}d ago`;

  return formatCalendarDate(timestampMs);
}

/** ISO-string convenience wrapper for database rows. */
export function formatRelativeIso(iso: string): string {
  return formatRelativeTime(new Date(iso).getTime());
}
