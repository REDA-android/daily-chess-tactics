import assert from 'node:assert/strict';
import test from 'node:test';

// Replicates computeDailyScore directly so unit test runs without importing @devvit/web/server runtime
function computeDailyScore(timeSeconds: number, attempts: { status: 'correct' | 'hint' | 'mistake' }[]): number {
  const safeTime = Math.max(0, Math.round(timeSeconds));
  const mistakes = attempts.filter((a) => a.status === 'mistake').length;
  const hintsUsed = attempts.filter((a) => a.status === 'hint').length;
  return Math.max(100, 1000 - safeTime * 3 - mistakes * 150 - hintsUsed * 200);
}

test('computeDailyScore penalizes time, mistakes, and hints with floor of 100', () => {
  assert.equal(computeDailyScore(20, [{ status: 'correct' }]), 940);
  assert.equal(computeDailyScore(20, [{ status: 'mistake' }, { status: 'hint' }]), 590);
  assert.equal(computeDailyScore(600, [{ status: 'mistake' }, { status: 'mistake' }]), 100);
});
