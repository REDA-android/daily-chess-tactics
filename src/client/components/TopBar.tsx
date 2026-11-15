import { Clock, Flame, Heart, Sparkles, Swords, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { GameMode } from '../../shared/types';
import { formatElapsedTime } from '../utils/shareFormatter';

export interface RushBannerInfo {
  score: number;
  combo: number;
  solvedCount: number;
  onExitRush: () => void;
}

interface TopBarProps {
  puzzleNumber: number;
  rating: number;
  eco?: string;
  opening?: string;
  lives: number;
  maxLives: number;
  elapsedSeconds: number;
  streak: number;
  gameMode: GameMode;
  isMuted: boolean;
  rushInfo?: RushBannerInfo;
  onToggleMute: () => void;
  onReturnToDaily: () => void;
}

export function TopBar({
  puzzleNumber, rating, eco, opening, lives, maxLives, elapsedSeconds,
  streak, gameMode, isMuted, rushInfo, onToggleMute, onReturnToDaily,
}: TopBarProps) {
  const isRushLowTime = Boolean(rushInfo && elapsedSeconds <= 30);

  return (
    <div className="flex w-full max-w-[440px] shrink-0 flex-col gap-1">
      <header className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-900/90 px-2.5 py-2 ring-1 ring-white/10 shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              rushInfo ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {rushInfo ? <Zap className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
          </div>
          <div className="flex items-baseline gap-1 truncate">
            <span className="text-sm font-bold tracking-tight text-white truncate">
              {rushInfo
                ? `Rush #${rushInfo.solvedCount + 1}`
                : gameMode === 'practice'
                  ? `Archive #${puzzleNumber}`
                  : `Tactics #${puzzleNumber}`}
            </span>
            <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
              {rating}
            </span>
            {eco && (
              <span
                className="shrink-0 rounded-md bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-300"
                title={opening ? `${eco} • ${opening}` : eco}
              >
                {eco}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!rushInfo && streak > 0 && (
            <div
              className="flex items-center gap-0.5 rounded-md bg-orange-500/15 px-1.5 py-0.5 text-xs font-bold text-orange-300"
              title="Current daily streak"
            >
              <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
              <span>{streak}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5" aria-label={`${lives} of ${maxLives} lives left`}>
            {Array.from({ length: maxLives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`h-4 w-4 transition-transform ${
                  idx < lives
                    ? 'fill-rose-500 text-rose-500 scale-100'
                    : 'fill-slate-800 text-slate-700 scale-90'
                }`}
              />
            ))}
          </div>

          <div
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${
              isRushLowTime ? 'bg-rose-500/25 text-rose-300 animate-pulse' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5 opacity-75" />
            <span>{formatElapsedTime(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white cursor-pointer"
            title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-slate-500" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {rushInfo ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-500/15 px-2.5 py-1 ring-1 ring-amber-400/35">
          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-200">
            <span>⚡ {rushInfo.score} pts</span>
            {rushInfo.combo > 0 && (
              <span className="rounded bg-orange-500/25 px-1.5 py-0.5 text-[10px] text-orange-200">
                🔥 {rushInfo.combo} streak
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={rushInfo.onExitRush}
            className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>End Rush</span>
          </button>
        </div>
      ) : (
        gameMode === 'practice' && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-sky-500/15 px-2.5 py-1 ring-1 ring-sky-400/30">
            <span className="text-[11px] font-semibold text-sky-300">
              Practice Mode — Daily Streak &amp; Rank unaffected
            </span>
            <button
              type="button"
              onClick={onReturnToDaily}
              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Return to Daily</span>
            </button>
          </div>
        )
      )}
    </div>
  );
}
