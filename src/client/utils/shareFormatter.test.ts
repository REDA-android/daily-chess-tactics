import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAttemptGrid,
  computeAccuracyBonusPct,
  formatElapsedTime,
  formatShareComment,
  formatUtcCountdownHms,
  getNextPuzzleCountdown,
} from './shareFormatter.ts';

test('formatElapsedTime formats seconds as M:SS', () => {
  assert.equal(formatElapsedTime(0), '0:00');
  assert.equal(formatElapsedTime(42), '0:42');
  assert.equal(formatElapsedTime(125), '2:05');
});

test('getNextPuzzleCountdown and formatUtcCountdownHms compute remaining time until UTC midnight', () => {
  const sample = new Date('2026-11-14T19:48:45.000Z');
  assert.equal(getNextPuzzleCountdown(sample), '04h 11m');
  assert.equal(formatUtcCountdownHms(sample), '04:11:15');
});

test('buildAttemptGrid maps correct, hint, and mistake attempts to emojis', () => {
  const grid = buildAttemptGrid([
    { stepIndex: 0, status: 'correct' },
    { stepIndex: 1, status: 'mistake' },
    { stepIndex: 1, status: 'hint' },
    { stepIndex: 2, status: 'correct' },
  ]);
  assert.equal(grid, '🟩🟥🟨🟩');
});

test('computeAccuracyBonusPct applies 50% penalty when hint is used', () => {
  assert.equal(
    computeAccuracyBonusPct([{ stepIndex: 0, status: 'correct' }], true),
    100
  );
  assert.equal(
    computeAccuracyBonusPct([{ stepIndex: 0, status: 'hint' }], true),
    50
  );
  assert.equal(
    computeAccuracyBonusPct([{ stepIndex: 0, status: 'mistake' }], false),
    0
  );
});

test('formatShareComment produces spoiler-free Reddit comment line', () => {
  const text = formatShareComment({
    puzzleNumber: 14,
    solved: true,
    attempts: [
      { stepIndex: 0, status: 'correct' },
      { stepIndex: 1, status: 'hint' },
    ],
    streak: 4,
    timeSeconds: 42,
    rating: 1350,
  });
  assert.equal(
    text,
    '♟️ Daily Chess Tactics #14 (1350) | 🟩🟨 | 🔥 Streak: 4 | ⏱️ 0:42'
  );
});
