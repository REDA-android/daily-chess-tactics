const MS_PER_DAY = 86_400_000;

export function getYesterdayUtcKey(dateKey: string): string {
  const parts = dateKey.split('-').map(Number);
  const year = parts[0] ?? 2026;
  const month = (parts[1] ?? 11) - 1;
  const day = parts[2] ?? 1;
  const yesterday = new Date(Date.UTC(year, month, day) - MS_PER_DAY);
  const y = yesterday.getUTCFullYear();
  const m = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeEffectiveStreak(
  storedStreak: number,
  lastSolvedDate: string | null,
  todayKey: string
): number {
  if (!lastSolvedDate || storedStreak <= 0) return 0;
  if (lastSolvedDate === todayKey || lastSolvedDate === getYesterdayUtcKey(todayKey)) {
    return storedStreak;
  }
  return 0;
}

export function computeNextStreak(
  storedStreak: number,
  lastSolvedDate: string | null,
  dateKey: string,
  solved: boolean
): number {
  if (!solved) return 0;
  if (lastSolvedDate === dateKey) return Math.max(1, storedStreak);
  if (lastSolvedDate === getYesterdayUtcKey(dateKey)) return storedStreak + 1;
  return 1;
}
