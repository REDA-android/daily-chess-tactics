import { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  Palette,
  RefreshCw,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react';
import { BOARD_THEMES, type BoardTheme } from '../utils/boardThemes';

interface ActionControlsProps {
  isPlaying: boolean;
  isRush?: boolean;
  isOpponentThinking: boolean;
  hasHintActive: boolean;
  boardTheme: BoardTheme;
  onHint: () => void;
  onReset: () => void;
  onFlip: () => void;
  onToggleTheme: () => void;
  onOpenArchive: () => void;
  onOpenResult?: () => void;
}

export function ActionControls({
  isPlaying,
  isRush = false,
  isOpponentThinking,
  hasHintActive,
  boardTheme,
  onHint,
  onReset,
  onFlip,
  onToggleTheme,
  onOpenArchive,
  onOpenResult,
}: ActionControlsProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <footer className="flex w-full max-w-[440px] shrink-0 items-center justify-between gap-1.5 rounded-xl bg-slate-900/90 px-2.5 py-1.5 ring-1 ring-white/10">
        <div className="flex items-center gap-1.5">
          {isRush ? (
            <span className="rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-bold text-amber-300">
              ⚡ Blitz Mode
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onHint}
                disabled={!isPlaying || isOpponentThinking || hasHintActive}
                className="flex items-center gap-1 rounded-lg bg-amber-500/90 px-2 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Highlight the piece to move (-50% bonus)"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Hint</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
                title={isPlaying ? 'Reset board position' : 'Practice puzzle again'}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isPlaying ? 'Reset' : 'Retry'}</span>
              </button>

              {!isPlaying && onOpenResult && (
                <button
                  type="button"
                  onClick={onOpenResult}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Summary</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenArchive}
            className="flex items-center gap-1 rounded-lg bg-sky-600/85 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 cursor-pointer"
            title="Open Practice Archive (20 puzzles)"
            aria-label="Practice Archive"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Practice Archive</span>
            <span className="sm:hidden">Archive</span>
          </button>

          <button
            type="button"
            onClick={onFlip}
            className="flex items-center gap-1 rounded-lg bg-slate-800 p-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            title="Flip board orientation"
            aria-label="Flip board"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="relative flex items-center gap-1 rounded-lg bg-slate-800 p-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            title={`Board theme: ${BOARD_THEMES[boardTheme].label} (click to switch)`}
            aria-label={`Switch board theme (current: ${BOARD_THEMES[boardTheme].label})`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span
              className="h-2 w-2 rounded-full ring-1 ring-white/40"
              style={{ backgroundColor: BOARD_THEMES[boardTheme].swatch }}
            />
          </button>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="flex items-center justify-center rounded-lg bg-slate-800 p-1.5 text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            title="How to play"
            aria-label="How to play"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-2xl ring-1 ring-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-base font-bold">How to Play Daily Chess Tactics</h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                aria-label="Close help"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>
                <strong className="text-white">Find the winning line:</strong> Every 24h (UTC), all
                Redditors share the same puzzle.
              </li>
              <li>
                <strong className="text-white">Tap to move:</strong> Tap your piece to see legal
                squares, then tap the destination square.
              </li>
              <li>
                <strong className="text-white">3 Hearts:</strong> Wrong moves cost 1 heart and snap
                back so you can try again.
              </li>
              <li>
                <strong className="text-white">Hints & Sharing:</strong> Hints highlight the moving
                piece (-50% score bonus). Share your spoiler-free grid to the comments when done!
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
