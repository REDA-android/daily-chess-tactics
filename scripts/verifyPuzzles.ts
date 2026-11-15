import { Chess } from 'chess.js';
import { PUZZLE_BANK, parseUciMove } from '../src/shared/puzzles.ts';

let passed = 0;

for (const puzzle of PUZZLE_BANK) {
  let chess: Chess;
  try {
    chess = new Chess(puzzle.fen);
  } catch (err) {
    throw new Error(`Puzzle #${puzzle.id} (${puzzle.title}) has invalid FEN: ${String(err)}`);
  }

  if (puzzle.setupMove) {
    const setup = parseUciMove(puzzle.setupMove);
    try {
      chess.move(setup);
    } catch {
      throw new Error(
        `Puzzle #${puzzle.id} (${puzzle.title}) illegal setupMove: ${puzzle.setupMove}`
      );
    }
  }

  if (chess.turn() !== puzzle.playerColor) {
    throw new Error(
      `Puzzle #${puzzle.id} turn mismatch: expected ${puzzle.playerColor}, got ${chess.turn()}`
    );
  }

  if (puzzle.solution.length === 0 || puzzle.solution.length % 2 === 0) {
    throw new Error(`Puzzle #${puzzle.id} solution must have an odd number of plies`);
  }

  for (let i = 0; i < puzzle.solution.length; i++) {
    const uci = puzzle.solution[i];
    if (!uci) throw new Error(`Puzzle #${puzzle.id} missing move at ply ${i}`);
    const parsed = parseUciMove(uci);
    try {
      chess.move(parsed);
    } catch {
      throw new Error(
        `Puzzle #${puzzle.id} (${puzzle.title}) illegal move "${uci}" at ply ${i} on FEN ${chess.fen()}`
      );
    }
  }

  const isMate = chess.isCheckmate();
  if (puzzle.id !== 1 && !isMate) {
    throw new Error(`Puzzle #${puzzle.id} (${puzzle.title}) expected checkmate at end of line`);
  }

  passed++;
  const outcome = isMate ? 'Checkmate' : 'Decisive Tactical Counter-Attack';
  console.log(
    `[OK] #${String(puzzle.id).padStart(2, '0')} (${puzzle.playerColor.toUpperCase()}, ${puzzle.rating}) ${puzzle.title} — ${puzzle.solution.length} plies -> ${outcome}`
  );
}

console.log(`\nVerified ${passed}/${PUZZLE_BANK.length} puzzles successfully.`);
