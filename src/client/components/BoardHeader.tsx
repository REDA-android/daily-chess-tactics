import type { ChessPuzzle } from '../../shared/types';

interface BoardHeaderProps {
  puzzle: ChessPuzzle;
  toastMessage: string | null;
  feedbackType?: 'correct' | 'mistake' | undefined;
  isRush: boolean;
  totalPlayerSteps: number;
  completedSteps: number;
}

export function BoardHeader({
  puzzle,
  toastMessage,
  feedbackType,
  isRush,
  totalPlayerSteps,
  completedSteps,
}: BoardHeaderProps) {
  const sideToMoveColor = puzzle.playerColor === 'w' ? 'White' : 'Black';
  const statusBanner = !isRush && toastMessage ? toastMessage : `${puzzle.title} • ${sideToMoveColor} to move`;

  return (
    <div className="flex w-full items-center justify-between gap-2 px-1 text-xs">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/30 ${
            puzzle.playerColor === 'w' ? 'bg-white' : 'bg-slate-800'
          }`}
        />
        <span
          className={`truncate font-semibold ${
            !isRush && toastMessage
              ? feedbackType === 'mistake'
                ? 'text-rose-400'
                : 'text-emerald-400'
              : 'text-slate-200'
          }`}
        >
          {statusBanner}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {totalPlayerSteps > 1 && (
          <div
            className="flex items-center gap-1"
            title={`Move ${Math.min(completedSteps + 1, totalPlayerSteps)} of ${totalPlayerSteps}`}
          >
            {Array.from({ length: totalPlayerSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i < completedSteps ? 'bg-emerald-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
        <span className="text-[11px] font-medium text-slate-400">{puzzle.theme}</span>
      </div>
    </div>
  );
}
