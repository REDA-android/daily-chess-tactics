import assert from 'node:assert/strict';
import test from 'node:test';
import { computeNextTacticalElo } from './careerStats.ts';

test('computeNextTacticalElo rewards clean solves against higher-rated puzzles', () => {
  const next = computeNextTacticalElo(1200, 1600, true, false, 0);
  assert.ok(next > 1220 && next <= 1232, `Expected substantial Elo gain, got ${next}`);
});

test('computeNextTacticalElo applies partial gain for hinted solves on harder puzzles and drops on loss', () => {
  const hinted = computeNextTacticalElo(1200, 1600, true, true, 0);
  const failed = computeNextTacticalElo(1200, 1200, false, false, 3);
  assert.ok(hinted > 1200);
  assert.equal(failed, 1184);
});
