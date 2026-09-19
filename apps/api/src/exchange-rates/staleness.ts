const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isStale(fetchedAt: Date | null, now: Date): boolean {
  if (!fetchedAt) {
    return true;
  }
  return now.getTime() - fetchedAt.getTime() > STALE_AFTER_MS;
}
