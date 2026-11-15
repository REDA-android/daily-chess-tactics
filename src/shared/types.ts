export type PieceColor = 'w' | 'b';
export type GameMode = 'daily' | 'practice';

export interface ChessPuzzle {
  id: number;
  title: string;
  theme: string;
  rating: number;
  /** FEN before optional setupMove (or directly at player's turn if setupMove is omitted). */
  fen: string;
  /** Optional UCI move played automatically by opponent on load (e.g. "f3g5"). */
  setupMove?: string;
  /** Exact sequence of UCI moves: [playerMove1, oppResponse1, playerMove2, ...]. */
  solution: string[];
  playerColor: PieceColor;
  /** Short tactical takeaway shown after the puzzle concludes. */
  explanation: string;
  /** Optional ECO code and official opening name (from Lichess chess-openings taxonomy). */
  eco?: string;
  opening?: string;
}

export type AttemptStatus = 'correct' | 'hint' | 'mistake';

export interface MoveAttempt {
  stepIndex: number;
  status: AttemptStatus;
}

export interface PlayerDailyResult {
  puzzleId: number;
  dateKey: string;
  solved: boolean;
  attempts: MoveAttempt[];
  timeSeconds: number;
  streak: number;
  hasSharedComment: boolean;
}

export interface GlobalDailyStats {
  totalPlays: number;
  totalSolves: number;
  averageTimeSeconds: number;
}

export interface UserStats {
  userId: string;
  username: string;
  streak: number;
  lastSolvedDate: string | null;
}

export interface DailyState {
  dateKey: string;
  puzzleNumber: number;
  puzzle: ChessPuzzle;
  user: UserStats;
  dailyResult: PlayerDailyResult | null;
  globalStats: GlobalDailyStats;
}

export interface SubmitResultPayload {
  dateKey: string;
  puzzleId: number;
  solved: boolean;
  attempts: MoveAttempt[];
  timeSeconds: number;
}

export interface SubmitResultResponse {
  dailyResult: PlayerDailyResult;
  globalStats: GlobalDailyStats;
  streak: number;
}

export interface SharePayload {
  dateKey: string;
  text: string;
}

export interface ShareResponse {
  success: boolean;
  commentId?: string;
  alreadyShared?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  timeSeconds: number;
}

export interface LeaderboardResponse {
  dateKey: string;
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
}
