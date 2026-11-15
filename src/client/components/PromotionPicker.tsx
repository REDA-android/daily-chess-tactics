import type { PieceColor } from '../../shared/types';
import { ChessPiece } from './ChessPiece';

const PROMOTION_PIECES: readonly ('q' | 'r' | 'b' | 'n')[] = ['q', 'r', 'b', 'n'];

interface PromotionPickerProps {
  playerColor: PieceColor;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

export function PromotionPicker({ playerColor, onSelect, onCancel }: PromotionPickerProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-[1px]"
      onClick={onCancel}
    >
      <div
        className="flex items-center gap-2 rounded-xl bg-slate-900 p-2.5 shadow-2xl ring-1 ring-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        {PROMOTION_PIECES.map((promo) => (
          <button
            key={promo}
            type="button"
            onClick={() => onSelect(promo)}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 p-1.5 hover:bg-emerald-600 transition-colors cursor-pointer"
            aria-label={`Promote to ${promo}`}
          >
            <ChessPiece type={promo} color={playerColor} />
          </button>
        ))}
      </div>
    </div>
  );
}
