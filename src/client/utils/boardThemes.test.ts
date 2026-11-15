import assert from 'node:assert/strict';
import test from 'node:test';
import { BOARD_THEMES, cycleBoardTheme } from './boardThemes.ts';

test('cycleBoardTheme rotates cleanly across classic, slate, and wood palettes', () => {
  assert.equal(cycleBoardTheme('classic'), 'slate');
  assert.equal(cycleBoardTheme('slate'), 'wood');
  assert.equal(cycleBoardTheme('wood'), 'classic');
  assert.equal(BOARD_THEMES.classic.light, '#EBECD0');
  assert.equal(BOARD_THEMES.slate.dark, '#4B7399');
  assert.equal(BOARD_THEMES.wood.dark, '#8B5A2B');
});
