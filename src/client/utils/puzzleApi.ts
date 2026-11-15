import { Chess } from 'chess.js';
import { getDailyPuzzle, getPuzzleNumber, getUtcDateKey, parseUciMove } from '../../shared/puzzles';
import type {
  ChessPuzzle,
  DailyState,
  GlobalDailyStats,
  LeaderboardResponse,
  MoveAttempt,
  ShareResponse,
  SubmitResultResponse,
} from '../../shared/types';
import type { BoardMoveHighlight } from '../components/ChessBoard';

export interface DailyMeta {
  dateKey: string;
  puzzleNumber: number;
  dailyPuzzleId: number;
  puzzle: ChessPuzzle;
  username: string;
  streak: number;
  globalStats: GlobalDailyStats;
}

export function createInitialDailyMeta(): DailyMeta {
  const dateKey = getUtcDateKey();
  const puzzle = getDailyPuzzle(dateKey);
  return {
    dateKey,
    puzzleNumber: getPuzzleNumber(dateKey),
    dailyPuzzleId: puzzle.id,
    puzzle,
    username: 'Guest',
    streak: 0,
    globalStats: { totalPlays: 0, totalSolves: 0, averageTimeSeconds: 0 },
  };
}

export function buildStartingPosition(puzzle: ChessPuzzle): {
  fen: string;
  lastMove: BoardMoveHighlight | null;
} {
  const chess = new Chess(puzzle.fen);
  if (puzzle.setupMove) {
    const move = parseUciMove(puzzle.setupMove);
    chess.move(move);
    return { fen: chess.fen(), lastMove: { from: move.from, to: move.to } };
  }
  return { fen: chess.fen(), lastMove: null };
}

export function buildSolvedPosition(puzzle: ChessPuzzle): {
  fen: string;
  lastMove: BoardMoveHighlight | null;
} {
  const chess = new Chess(puzzle.fen);
  let lastMove: BoardMoveHighlight | null = null;
  if (puzzle.setupMove) {
    const m = parseUciMove(puzzle.setupMove);
    chess.move(m);
    lastMove = { from: m.from, to: m.to };
  }
  for (const uci of puzzle.solution) {
    const m = parseUciMove(uci);
    chess.move(m);
    lastMove = { from: m.from, to: m.to };
  }
  return { fen: chess.fen(), lastMove };
}

export { buildSolutionTimeline, type ReplayFrame } from '../../shared/replay';

export async function fetchDailyInit(): Promise<DailyState> {
  try {
    const res = await fetch('/api/init');
    if (res.ok) return (await res.json()) as DailyState;
  } catch {
    // Fallback to offline daily state
  }
  const dateKey = getUtcDateKey();
  return {
    dateKey,
    puzzleNumber: getPuzzleNumber(dateKey),
    puzzle: getDailyPuzzle(dateKey),
    user: { userId: 'anonymous', username: 'Guest', streak: 0, lastSolvedDate: null },
    dailyResult: null,
    globalStats: { totalPlays: 0, totalSolves: 0, averageTimeSeconds: 0 },
  };
}

export async function fetchDailyLeaderboard(dateKey: string): Promise<LeaderboardResponse> {
  try {
    const res = await fetch(`/api/leaderboard?dateKey=${encodeURIComponent(dateKey)}`);
    if (res.ok) return (await res.json()) as LeaderboardResponse;
  } catch {
    // Offline fallback
  }
  return { dateKey, entries: [], currentUser: null };
}

export async function postSubmitResult(payload: {
  dateKey: string;
  puzzleId: number;
  solved: boolean;
  attempts: MoveAttempt[];
  timeSeconds: number;
}): Promise<SubmitResultResponse | null> {
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as SubmitResultResponse;
  } catch {
    return null;
  }
}

export async function postShareComment(
  dateKey: string,
  text: string
): Promise<{ ok: boolean; alreadyShared?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/share-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateKey, text }),
    });
    const data = (await res.json()) as ShareResponse & { error?: string };
    if (res.ok && data.success) return { ok: true };
    const result: { ok: boolean; alreadyShared?: boolean; error?: string } = { ok: false };
    if (data.alreadyShared) result.alreadyShared = true;
    if (data.error) result.error = data.error;
    return result;
  } catch {
    return { ok: false, error: 'Unable to post comment offline.' };
  }
}

export type MoveEvaluation =
  | { kind: 'illegal' }
  | { kind: 'mistake'; to: string }
  | {
      kind: 'step';
      nextFen: string;
      from: string;
      to: string;
      isCapture: boolean;
      isCheck: boolean;
      oppUci?: string;
    };

export function evaluatePuzzleMove(
  fen: string,
  solution: readonly string[],
  solutionIndex: number,
  from: string,
  to: string,
  promotion?: 'q' | 'r' | 'b' | 'n'
): MoveEvaluation {
  const expectedUci = solution[solutionIndex];
  if (!expectedUci) return { kind: 'illegal' };

  const chess = new Chess(fen);
  let legalMove;
  try {
    legalMove = chess.move(promotion ? { from, to, promotion } : { from, to });
  } catch {
    return { kind: 'illegal' };
  }
  if (!legalMove) return { kind: 'illegal' };

  const playedUci = `${from}${to}${legalMove.promotion ?? ''}`;
  if (playedUci !== expectedUci) return { kind: 'mistake', to };

  const isCapture = Boolean(legalMove.captured);
  const isCheck = chess.inCheck();
  const oppUci = solution[solutionIndex + 1];
  return oppUci
    ? { kind: 'step', nextFen: chess.fen(), from, to, isCapture, isCheck, oppUci }
    : { kind: 'step', nextFen: chess.fen(), from, to, isCapture, isCheck };
}

export function applyOpponentReply(fen: string, oppUci: string): {
  fen: string;
  lastMove: BoardMoveHighlight;
  isCapture: boolean;
  isCheck: boolean;
} {
  const chess = new Chess(fen);
  const oppMove = parseUciMove(oppUci);
  const executed = chess.move(oppMove);
  return {
    fen: chess.fen(),
    lastMove: { from: oppMove.from, to: oppMove.to },
    isCapture: Boolean(executed.captured),
    isCheck: chess.inCheck(),
  };
}
