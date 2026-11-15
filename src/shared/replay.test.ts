import assert from 'node:assert/strict';
import test from 'node:test';
import { PUZZLE_BANK } from './puzzles.ts';
import { buildSolutionTimeline } from './replay.ts';

test('buildSolutionTimeline generates SAN labels, promotion notation, and check flags', () => {
  const friedLiver = PUZZLE_BANK[0]!;
  const frames1 = buildSolutionTimeline(friedLiver);
  assert.equal(frames1.length, 4);
  assert.equal(frames1[0]?.sanLabel, null);
  assert.equal(frames1[1]?.sanLabel, '4... d5');
  assert.equal(frames1[2]?.sanLabel, '5. exd5');
  assert.equal(frames1[2]?.isCapture, true);
  assert.equal(frames1[3]?.sanLabel, '5... Na5');

  const promoPuzzle = PUZZLE_BANK.find((p) => p.id === 9)!;
  const frames9 = buildSolutionTimeline(promoPuzzle);
  assert.equal(frames9[frames9.length - 1]?.sanLabel, '2. cxd8=Q#');
  assert.equal(frames9[frames9.length - 1]?.isCheck, true);
  assert.equal(frames9[frames9.length - 1]?.isCapture, true);
});
