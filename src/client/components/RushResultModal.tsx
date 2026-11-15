import { Flame, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';

interface RushResultModalProps {
  score: number;
  solvedCount: number;
  bestCombo: number;
  bestEverScore: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onExitToDaily: () => void;
}

export function RushResultModal({
  score,
  solvedCount,
  bestCombo,
  bestEverScore,
  isNewBest,
  onPlayAgain,
  onExitToDaily,
}: RushResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-2xl ring-1 ring-white/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Puzzle Rush Complete!</h2>
              <p className="text-[11px] text-slate-400">3-Minute Tactical Blitz</p>
            </div>
          </div>
          {isNewBest && (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/40">
              New Best!
            </span>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-slate-950/70 py-3 text-center ring-1 ring-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Final Blitz Score
          </p>
          <p className="mt-0.5 font-mono text-3xl font-extrabold text-amber-300">{score}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Personal Best: {bestEverScore} pts</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-slate-800/70 p-2.5">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-400">
              <Trophy className="h-4 w-4" />
              <span>{solvedCount}</span>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              Puzzles Solved
            </p>
          </div>
          <div className="rounded-xl bg-slate-800/70 p-2.5">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-orange-400">
              <Flame className="h-4 w-4 fill-orange-400" />
              <span>{bestCombo}</span>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              Best Streak
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Rush Again</span>
          </button>
          <button
            type="button"
            onClick={onExitToDaily}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Back to Daily Puzzle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
