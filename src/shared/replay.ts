import { Chess } from 'chess.js';
import { parseUciMove } from './puzzles.ts';
import type { ChessPuzzle } from './types.ts';

export interface ReplayFrame {
  fen: string;
  lastMove: { from: string; to: string } | null;
  sanLabel: string | null;
  isCapture?: boolean;
  isCheck?: boolean;
}

export function buildSolutionTimeline(puzzle: ChessPuzzle): ReplayFrame[] {
  const chess = new Chess(puzzle.fen);
  let startLastMove: { from: string; to: string } | null = null;
  if (puzzle.setupMove) {
    const setup = parseUciMove(puzzle.setupMove);
    chess.move(setup);
    startLastMove = { from: setup.from, to: setup.to };
  }

  const frames: ReplayFrame[] = [{ fen: chess.fen(), lastMove: startLastMove, sanLabel: null }];
  for (const uci of puzzle.solution) {
    const moveNum = chess.moveNumber();
    const isBlack = chess.turn() === 'b';
    const executed = chess.move(parseUciMove(uci));
    const sanLabel = isBlack ? `${moveNum}... ${executed.san}` : `${moveNum}. ${executed.san}`;
    frames.push({
      fen: chess.fen(),
      lastMove: { from: executed.from, to: executed.to },
      sanLabel,
      isCapture: Boolean(executed.captured),
      isCheck: chess.inCheck(),
    });
  }
  return frames;
}
