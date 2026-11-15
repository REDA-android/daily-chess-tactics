import { useState } from 'react';
import {
  ArrowRight, BookOpen, Check, Copy, Flame, Globe, Medal, MessageSquarePlus, RotateCcw, Sparkles, Trophy, X,
} from 'lucide-react';
import type { ChessPuzzle, GameMode, GlobalDailyStats, MoveAttempt } from '../../shared/types';
import {
  buildAttemptGrid, computeAccuracyBonusPct, formatElapsedTime, formatShareComment,
} from '../utils/shareFormatter';
import { CountdownTimer } from './CountdownTimer';
import { LeaderboardTab } from './LeaderboardTab';

interface ResultModalProps {
  solved: boolean;
  gameMode: GameMode;
  dateKey: string;
  currentUsername: string;
  puzzleNumber: number;
  puzzle: ChessPuzzle;
  attempts: readonly MoveAttempt[];
  elapsedSeconds: number;
  streak: number;
  tacticalElo: number;
  globalStats: GlobalDailyStats;
  hasSharedComment: boolean;
  isSharing: boolean;
  onShareComment: (text: string) => Promise<boolean>;
  onRetry: () => void;
  onNextPuzzle: () => void;
  onOpenArchive: () => void;
  onReturnToDaily: () => void;
  onClose: () => void;
}

export function ResultModal({
  solved, gameMode, dateKey, currentUsername, puzzleNumber, puzzle, attempts, elapsedSeconds,
  streak, tacticalElo, globalStats, hasSharedComment, isSharing, onShareComment, onRetry,
  onNextPuzzle, onOpenArchive, onReturnToDaily, onClose,
}: ResultModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'leaderboard'>('summary');
  const isPractice = gameMode === 'practice';

  const solveRatePct =
    globalStats.totalPlays > 0
      ? Math.round((globalStats.totalSolves / globalStats.totalPlays) * 100)
      : solved ? 100 : 0;

  const bonusPct = computeAccuracyBonusPct(attempts, solved);
  const emojiGrid = buildAttemptGrid(attempts);
  const shareText = formatShareComment({
    puzzleNumber, solved, attempts, streak, timeSeconds: elapsedSeconds, rating: puzzle.rating,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-2xl ring-1 ring-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                solved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {solved ? (isPractice ? 'Archive Puzzle Solved!' : 'Puzzle Solved!') : 'Out of Hearts'}
              </h2>
              <p className="text-[11px] font-medium text-slate-400">
                {puzzle.theme} • {puzzle.rating} • Elo {tacticalElo}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            aria-label="Inspect board"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isPractice && (
          <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-xl bg-slate-950/70 p-1 ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'summary' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Medal className="h-3.5 w-3.5 text-amber-400" />
              <span>Top 5 Today</span>
            </button>
          </div>
        )}

        {activeTab === 'leaderboard' && !isPractice ? (
          <LeaderboardTab dateKey={dateKey} currentUsername={currentUsername} />
        ) : (
          <>
            <div className="mt-2.5 rounded-xl bg-slate-800/80 px-3 py-2 text-xs text-slate-300 leading-relaxed space-y-1">
              {puzzle.opening && (
                <p className="text-[11px] font-semibold text-amber-300">
                  {puzzle.eco ? `${puzzle.eco} • ` : ''}
                  {puzzle.opening}
                </p>
              )}
              <p>{puzzle.explanation}</p>
            </div>

            {!isPractice && <CountdownTimer />}

            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-800/70 p-2">
                <div className="flex items-center justify-center gap-1 text-sm font-bold text-orange-400">
                  <Flame className="h-4 w-4 fill-orange-400" />
                  <span>{streak}</span>
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Day Streak</div>
              </div>
              <div className="rounded-xl bg-slate-800/70 p-2">
                <div className="flex items-center justify-center gap-1 text-sm font-bold text-sky-400">
                  <Globe className="h-4 w-4" />
                  <span>{solveRatePct}%</span>
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Solve Rate</div>
              </div>
              <div className="rounded-xl bg-slate-800/70 p-2">
                <div className="text-sm font-bold text-emerald-400 font-mono">{formatElapsedTime(elapsedSeconds)}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Bonus {bonusPct}%</div>
              </div>
            </div>

            <div className="mt-2.5 rounded-xl bg-slate-950/70 px-3 py-2 text-center ring-1 ring-white/5">
              <div className="text-base tracking-widest">{emojiGrid}</div>
              <p className="mt-1 truncate text-[11px] text-slate-400">{shareText}</p>
            </div>
          </>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {isPractice ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNextPuzzle}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500 cursor-pointer"
              >
                <span>Next Puzzle</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onReturnToDaily}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Daily Puzzle</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void onShareComment(shareText)}
              disabled={hasSharedComment || isSharing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-orange-500 disabled:bg-emerald-700/70 disabled:text-emerald-100 cursor-pointer disabled:cursor-default"
            >
              {hasSharedComment ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Shared to Comments</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-4 w-4" />
                  <span>{isSharing ? 'Posting Comment...' : 'Share Result to Comments'}</span>
                </>
              )}
            </button>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-2 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-2 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={onOpenArchive}
              className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-2 py-2 text-xs font-semibold text-sky-300 transition hover:bg-slate-700 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
