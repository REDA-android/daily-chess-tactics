import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { parseAppConfigJson } from '@devvit/shared-types/schemas/config-file.v1.js';
import {
  computeEffectiveStreak,
  computeNextStreak,
  getYesterdayUtcKey,
} from './streak.ts';

test('UTC yesterday calculation handles month and year boundaries', () => {
  assert.equal(getYesterdayUtcKey('2026-11-15'), '2026-11-14');
  assert.equal(getYesterdayUtcKey('2026-11-01'), '2026-10-31');
  assert.equal(getYesterdayUtcKey('2026-01-01'), '2025-12-31');
});

test('streak computation increments consecutively, resets on gap or loss', () => {
  assert.equal(computeNextStreak(0, null, '2026-11-15', true), 1);
  assert.equal(computeNextStreak(4, '2026-11-14', '2026-11-15', true), 5);
  assert.equal(computeNextStreak(4, '2026-11-12', '2026-11-15', true), 1);
  assert.equal(computeNextStreak(4, '2026-11-15', '2026-11-15', true), 4);
  assert.equal(computeNextStreak(4, '2026-11-14', '2026-11-15', false), 0);

  assert.equal(computeEffectiveStreak(4, '2026-11-14', '2026-11-15'), 4);
  assert.equal(computeEffectiveStreak(4, '2026-11-15', '2026-11-15'), 4);
  assert.equal(computeEffectiveStreak(4, '2026-11-13', '2026-11-15'), 0);
});

test('devvit.json conforms to Devvit v1 config schema', () => {
  const raw = fs.readFileSync(path.resolve(process.cwd(), 'devvit.json'), 'utf8');
  const parsed = JSON.parse(raw);
  const config = parseAppConfigJson(parsed, false);

  assert.equal(config.name, 'daily-chess-tactics');
  assert.equal(config.permissions.redis, true);
  assert.equal(config.permissions.reddit.enable, true);
  assert.ok(config.menu?.items.length === 1);
  assert.ok(config.scheduler?.tasks['daily-post']);
});
