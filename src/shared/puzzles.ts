import { PUZZLE_BANK } from './puzzleData.ts';
import type { ChessPuzzle } from './types.ts';

export { PUZZLE_BANK };

/** Epoch anchor (UTC) for deterministic daily puzzle numbering (#1 = 2026-11-01). */
const EPOCH_UTC_MS = Date.UTC(2026, 10, 1);
const MS_PER_DAY = 86_400_000;

export function getUtcDateKey(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayIndexFromKey(dateKey: string): number {
  const parts = dateKey.split('-').map(Number);
  const year = parts[0] ?? 2026;
  const month = (parts[1] ?? 11) - 1;
  const day = parts[2] ?? 1;
  const targetMs = Date.UTC(year, month, day);
  return Math.floor((targetMs - EPOCH_UTC_MS) / MS_PER_DAY);
}

export function getPuzzleNumber(dateKey: string): number {
  const diff = getDayIndexFromKey(dateKey);
  return diff >= 0 ? diff + 1 : 1;
}

export function getDailyPuzzle(dateKey: string = getUtcDateKey()): ChessPuzzle {
  const dayIndex = getDayIndexFromKey(dateKey);
  const len = PUZZLE_BANK.length;
  const normalizedIndex = ((dayIndex % len) + len) % len;
  const puzzle = PUZZLE_BANK[normalizedIndex];
  if (!puzzle) {
    throw new Error(`Puzzle not found for index ${normalizedIndex}`);
  }
  return puzzle;
}

export interface ParsedUciMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export function parseUciMove(uci: string): ParsedUciMove {
  if (uci.length < 4 || uci.length > 5) {
    throw new Error(`Invalid UCI move string: "${uci}"`);
  }
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promoChar = uci[4];
  if (
    promoChar === 'q' ||
    promoChar === 'r' ||
    promoChar === 'b' ||
    promoChar === 'n'
  ) {
    return { from, to, promotion: promoChar };
  }
  if (promoChar !== undefined) {
    throw new Error(`Invalid promotion piece in UCI move: "${uci}"`);
  }
  return { from, to };
}

export type ArchiveFilter = 'all' | 'unsolved' | 'mate' | 'sacrifice';

export function filterArchivePuzzles(
  filter: ArchiveFilter,
  solvedIds: readonly number[]
): ChessPuzzle[] {
  const solvedSet = new Set(solvedIds);
  return PUZZLE_BANK.filter((p) => {
    if (filter === 'unsolved') return !solvedSet.has(p.id);
    if (filter === 'mate') return p.theme.toLowerCase().includes('mate');
    if (filter === 'sacrifice') {
      const lower = p.theme.toLowerCase();
      return lower.includes('sacrifice') || lower.includes('overload') || lower.includes('deflection');
    }
    return true;
  });
}

export function pickNextPracticePuzzle(
  currentPuzzleId: number,
  solvedIds: readonly number[]
): ChessPuzzle {
  const idx = PUZZLE_BANK.findIndex((p) => p.id === currentPuzzleId);
  const ordered = [...PUZZLE_BANK.slice(idx + 1), ...PUZZLE_BANK.slice(0, idx)];
  const solvedSet = new Set(solvedIds);
  return ordered.find((p) => !solvedSet.has(p.id)) ?? ordered[0] ?? PUZZLE_BANK[0]!;
}
