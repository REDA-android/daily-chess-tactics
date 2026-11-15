import { differenceInSeconds } from 'date-fns';
import type { MoveAttempt } from '../../shared/types';

export function formatElapsedTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function getNextPuzzleCountdownSeconds(now: Date = new Date()): number {
  const nextUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return Math.max(0, differenceInSeconds(nextUtcMidnight, now));
}

export function formatUtcCountdownHms(now: Date = new Date()): string {
  const totalSeconds = getNextPuzzleCountdownSeconds(now);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function getNextPuzzleCountdown(now: Date = new Date()): string {
  const totalSeconds = getNextPuzzleCountdownSeconds(now);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

export function buildAttemptGrid(attempts: readonly MoveAttempt[]): string {
  if (attempts.length === 0) return '⬜';
  return attempts
    .map((a) => {
      if (a.status === 'correct') return '🟩';
      if (a.status === 'hint') return '🟨';
      return '🟥';
    })
    .join('');
}

export function computeAccuracyBonusPct(
  attempts: readonly MoveAttempt[],
  solved: boolean
): number {
  if (!solved) return 0;
  const usedHint = attempts.some((a) => a.status === 'hint');
  const mistakes = attempts.filter((a) => a.status === 'mistake').length;
  let bonus = usedHint ? 50 : 100;
  bonus = Math.max(25, bonus - mistakes * 15);
  return bonus;
}

export interface ShareCardInput {
  puzzleNumber: number;
  solved: boolean;
  attempts: readonly MoveAttempt[];
  streak: number;
  timeSeconds: number;
  rating: number;
}

export function formatShareComment({
  puzzleNumber,
  solved,
  attempts,
  streak,
  timeSeconds,
  rating,
}: ShareCardInput): string {
  const grid = buildAttemptGrid(attempts);
  const timeStr = formatElapsedTime(timeSeconds);
  const statusIcon = solved ? '♟️' : '💀';
  const streakLabel = solved ? `🔥 Streak: ${streak}` : '💔 Streak: 0';
  return `${statusIcon} Daily Chess Tactics #${puzzleNumber} (${rating}) | ${grid} | ${streakLabel} | ⏱️ ${timeStr}`;
}
