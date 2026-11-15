import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Sparkles, Trophy, X, Zap } from 'lucide-react';
import { type ArchiveFilter, filterArchivePuzzles, PUZZLE_BANK } from '../../shared/puzzles';
import type { ChessPuzzle } from '../../shared/types';
import type { CareerStats } from '../utils/careerStats';

interface ArchiveDrawerProps {
  activePuzzleId: number;
  dailyPuzzleId: number;
  isPracticeMode: boolean;
  career: CareerStats;
  onSelectPuzzle: (puzzle: ChessPuzzle) => void;
  onStartRush: () => void;
  onReturnToDaily: () => void;
  onClose: () => void;
}

export function ArchiveDrawer({
  activePuzzleId, dailyPuzzleId, isPracticeMode, career,
  onSelectPuzzle, onStartRush, onReturnToDaily, onClose,
}: ArchiveDrawerProps) {
  const [filter, setFilter] = useState<ArchiveFilter>('all');
  const solvedSet = useMemo(() => new Set(career.solvedIds), [career.solvedIds]);
  const filteredPuzzles = useMemo(
    () => filterArchivePuzzles(filter, career.solvedIds),
    [filter, career.solvedIds]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-2 sm:items-center sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-2xl bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 shrink-0 text-sky-400" />
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold leading-tight">Practice Archive</h2>
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  Elo {career.tacticalElo}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {solvedSet.size}/{PUZZLE_BANK.length} solved • Practice safely offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPracticeMode && (
              <button
                type="button"
                onClick={() => {
                  onReturnToDaily();
                  onClose();
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Daily</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              aria-label="Close practice archive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-3 pt-2.5 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartRush();
            }}
            className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-rose-500/20 px-3 py-2 text-left ring-1 ring-amber-400/40 transition hover:ring-amber-300 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-200">3-Min Puzzle Rush</p>
                <p className="text-[10px] text-slate-300">3 strikes • Combo multipliers</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 px-2 py-1 text-[10px] font-mono font-bold text-amber-300">
              <Trophy className="h-3 w-3" />
              <span>Best {career.bestRushScore}</span>
            </div>
          </button>

          <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-950/60 p-1">
            {(['all', 'unsolved', 'mate', 'sacrifice'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-lg py-1 text-[11px] font-semibold capitalize transition cursor-pointer ${
                  filter === tab ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredPuzzles.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-400">
              No puzzles match this filter — awesome progress!
            </p>
          )}
          {filteredPuzzles.map((puzzle) => {
            const isActive = puzzle.id === activePuzzleId;
            const isDaily = puzzle.id === dailyPuzzleId;
            const isSolved = solvedSet.has(puzzle.id);

            return (
              <button
                key={puzzle.id}
                type="button"
                onClick={() => { onSelectPuzzle(puzzle); onClose(); }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                  isActive ? 'bg-sky-500/15 ring-1 ring-sky-400/50' : 'bg-slate-800/70 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 shrink-0 font-mono text-xs font-bold text-slate-400">
                    #{String(puzzle.id).padStart(2, '0')}
                  </span>
                  {isSolved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <span className={`h-3 w-3 shrink-0 rounded-full ring-1 ring-white/30 ${puzzle.playerColor === 'w' ? 'bg-white' : 'bg-slate-950'}`} />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-white">{puzzle.title}</span>
                      {isDaily && <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">Today</span>}
                      {puzzle.eco && <span className="shrink-0 rounded bg-sky-500/15 px-1 py-0.5 font-mono text-[9px] font-bold text-sky-300">{puzzle.eco}</span>}
                    </div>
                    <p className="truncate text-[11px] text-slate-400">{puzzle.theme}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                  {puzzle.rating}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
