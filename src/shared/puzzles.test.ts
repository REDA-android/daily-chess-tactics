import assert from 'node:assert/strict';
import test from 'node:test';
import { Chess } from 'chess.js';
import {
  PUZZLE_BANK,
  filterArchivePuzzles,
  getDailyPuzzle,
  getPuzzleNumber,
  getUtcDateKey,
  parseUciMove,
  pickNextPracticePuzzle,
} from './puzzles.ts';

test('puzzle bank has at least 20 balanced puzzles with unique IDs', () => {
  assert.ok(PUZZLE_BANK.length >= 20, 'Expected at least 20 puzzles');

  const ids = new Set(PUZZLE_BANK.map((p) => p.id));
  assert.equal(ids.size, PUZZLE_BANK.length, 'Puzzle IDs must be unique');

  const whiteCount = PUZZLE_BANK.filter((p) => p.playerColor === 'w').length;
  const blackCount = PUZZLE_BANK.filter((p) => p.playerColor === 'b').length;
  assert.equal(whiteCount, 10, 'Expected 10 White puzzles');
  assert.equal(blackCount, 10, 'Expected 10 Black puzzles');
});

test('every puzzle FEN, setupMove, and UCI solution line is 100% legal in chess.js', () => {
  for (const puzzle of PUZZLE_BANK) {
    const chess = new Chess(puzzle.fen);

    if (puzzle.setupMove) {
      const setup = parseUciMove(puzzle.setupMove);
      const playedSetup = chess.move(setup);
      assert.ok(
        playedSetup,
        `Puzzle #${puzzle.id} setupMove ${puzzle.setupMove} is illegal`
      );
    }

    assert.equal(
      chess.turn(),
      puzzle.playerColor,
      `Puzzle #${puzzle.id} turn after setup must match playerColor (${puzzle.playerColor})`
    );

    assert.ok(
      puzzle.solution.length >= 1 && puzzle.solution.length % 2 === 1,
      `Puzzle #${puzzle.id} solution must have an odd number of plies (start and end on player move)`
    );

    for (let i = 0; i < puzzle.solution.length; i++) {
      const uci = puzzle.solution[i];
      assert.ok(uci, `Missing UCI move at step ${i} for puzzle #${puzzle.id}`);

      const expectedTurn =
        i % 2 === 0
          ? puzzle.playerColor
          : puzzle.playerColor === 'w'
            ? 'b'
            : 'w';

      assert.equal(
        chess.turn(),
        expectedTurn,
        `Puzzle #${puzzle.id} unexpected turn at ply ${i}`
      );

      const moveObj = parseUciMove(uci);
      const moveResult = chess.move(moveObj);
      assert.ok(
        moveResult,
        `Puzzle #${puzzle.id} move ${uci} at ply ${i} is illegal on FEN ${chess.fen()}`
      );
    }

    // For all mate-themed puzzles, verify the final position is checkmate.
    if (puzzle.theme.toLowerCase().includes('mate') || puzzle.id >= 2) {
      assert.ok(
        chess.isCheckmate(),
        `Puzzle #${puzzle.id} (${puzzle.title}) should end in checkmate, got FEN ${chess.fen()}`
      );
    }
  }
});

test('daily puzzle selection is deterministic for any UTC date key', () => {
  const dateA = '2026-11-15';
  const dateB = '2026-11-16';
  const p1 = getDailyPuzzle(dateA);
  const p1Repeat = getDailyPuzzle(dateA);
  const p2 = getDailyPuzzle(dateB);

  assert.equal(p1.id, p1Repeat.id);
  assert.notEqual(p1.id, p2.id);
  assert.equal(getPuzzleNumber('2026-11-01'), 1);
  assert.equal(getPuzzleNumber('2026-11-15'), 15);
  assert.match(getUtcDateKey(new Date('2026-11-15T02:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});

test('filterArchivePuzzles and pickNextPracticePuzzle filter themes and prioritize unsolved puzzles', () => {
  const mates = filterArchivePuzzles('mate', []);
  assert.ok(mates.length >= 10);
  assert.ok(mates.every((p) => p.theme.toLowerCase().includes('mate')));

  const unsolved = filterArchivePuzzles('unsolved', [1, 2]);
  assert.equal(unsolved.length, PUZZLE_BANK.length - 2);

  const next = pickNextPracticePuzzle(1, [2]);
  assert.equal(next.id, 3);
});
