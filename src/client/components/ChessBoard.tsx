import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import clsx from 'clsx';
import type { PieceColor } from '../../shared/types';
import { BOARD_THEMES, type BoardTheme } from '../utils/boardThemes';
import { initSoundEngine } from '../utils/soundEngine';
import { ChessPiece } from './ChessPiece';
import { PromotionPicker } from './PromotionPicker';

export type { BoardTheme };

export interface BoardMoveHighlight {
  from: string;
  to: string;
}

export interface SquareFeedback {
  square: string;
  type: 'correct' | 'mistake';
}

interface ChessBoardProps {
  fen: string;
  orientation: PieceColor;
  playerColor: PieceColor;
  disabled: boolean;
  isSolved?: boolean;
  lastMove: BoardMoveHighlight | null;
  hintSquare: string | null;
  feedback: SquareFeedback | null;
  shakeKey: number;
  boardTheme?: BoardTheme;
  onAttemptMove: (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

export function ChessBoard({
  fen, orientation, playerColor, disabled, isSolved = false, lastMove,
  hintSquare, feedback, shakeKey, boardTheme = 'classic', onAttemptMove,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [fen, disabled]);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = useMemo(() => chess.board(), [chess]);

  const legalMovesFromSelected = useMemo(() => {
    if (!selectedSquare || disabled) return [];
    return chess.moves({ square: selectedSquare, verbose: true });
  }, [chess, selectedSquare, disabled]);

  const legalTargetSet = useMemo(
    () => new Set(legalMovesFromSelected.map((m) => m.to)),
    [legalMovesFromSelected]
  );

  const kingInCheckSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r]?.[f];
        if (piece && piece.type === 'k' && piece.color === turn) return `${FILES[f]}${RANKS[r]}`;
      }
    }
    return null;
  }, [board, chess]);

  const orderedRanks = orientation === 'w' ? RANKS : [...RANKS].reverse();
  const orderedFiles = orientation === 'w' ? FILES : [...FILES].reverse();
  const palette = BOARD_THEMES[boardTheme];

  const tryCommitMove = (from: Square, to: Square) => {
    const moves = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (moves.length === 0) return false;
    if (moves.some((m) => Boolean(m.promotion))) {
      setPendingPromotion({ from, to });
      return true;
    }
    setSelectedSquare(null);
    onAttemptMove(from, to);
    return true;
  };

  const handleSquareClick = (sq: Square, pieceColor?: PieceColor) => {
    initSoundEngine();
    if (disabled || pendingPromotion) return;

    if (selectedSquare && legalTargetSet.has(sq) && tryCommitMove(selectedSquare, sq)) {
      return;
    }
    if (selectedSquare === sq) {
      setSelectedSquare(null);
      return;
    }
    if (pieceColor === playerColor && chess.turn() === playerColor) {
      setSelectedSquare(sq);
    } else {
      setSelectedSquare(null);
    }
  };

  const canDragPiece = (pieceColor?: PieceColor) =>
    !disabled && !pendingPromotion && pieceColor === playerColor && chess.turn() === playerColor;

  return (
    <div
      key={shakeKey}
      className={clsx(
        'relative aspect-square w-full select-none overflow-hidden rounded-lg shadow-lg transition-shadow',
        isSolved ? 'animate-victory-glow ring-2 ring-emerald-400/80' : 'ring-1 ring-black/25',
        shakeKey > 0 && 'animate-shake'
      )}
    >
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {orderedRanks.map((rank, rowIdx) =>
          orderedFiles.map((file, colIdx) => {
            const sq = `${file}${rank}` as Square;
            const rankIdx = RANKS.indexOf(rank);
            const fileIdx = FILES.indexOf(file);
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            const piece = board[rankIdx]?.[fileIdx] ?? null;

            const isSelected = selectedSquare === sq;
            const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
            const isHint = hintSquare === sq;
            const isCheck = kingInCheckSquare === sq;
            const isLegalTarget = legalTargetSet.has(sq);
            const isFeedbackCorrect = feedback?.square === sq && feedback.type === 'correct';
            const isFeedbackMistake = feedback?.square === sq && feedback.type === 'mistake';
            const draggable = canDragPiece(piece?.color);

            return (
              <button
                key={sq}
                type="button"
                disabled={disabled}
                onClick={() => handleSquareClick(sq, piece?.color)}
                onDragOver={(e) => {
                  if (!disabled && selectedSquare && legalTargetSet.has(sq)) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (disabled || pendingPromotion || !selectedSquare) return;
                  if (selectedSquare !== sq) tryCommitMove(selectedSquare, sq);
                }}
                style={{ backgroundColor: isLight ? palette.light : palette.dark }}
                className={clsx(
                  'relative flex items-center justify-center focus:outline-none',
                  disabled ? 'cursor-default' : 'cursor-pointer'
                )}
                aria-label={`Square ${sq}${piece ? ` ${piece.color}${piece.type}` : ''}`}
              >
                {isLastMove && <span className="pointer-events-none absolute inset-0 bg-yellow-300/35" />}
                {isSelected && (
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundColor: 'rgba(255, 255, 51, 0.5)' }} />
                )}
                {isHint && (
                  <span className="pointer-events-none absolute inset-0.5 rounded-sm ring-3 ring-amber-400 animate-pulse bg-amber-300/25" />
                )}
                {isCheck && (
                  <span
                    className="pointer-events-none absolute inset-0 animate-check-pulse"
                    style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(220,38,38,0.45) 55%, transparent 78%)' }}
                  />
                )}
                {(isFeedbackCorrect || isFeedbackMistake) && (
                  <span className={clsx('pointer-events-none absolute inset-0 transition-opacity', isFeedbackCorrect ? 'bg-emerald-400/55' : 'bg-rose-500/55')} />
                )}
                {colIdx === 0 && (
                  <span style={{ color: isLight ? palette.dark : palette.light }} className="pointer-events-none absolute top-0.5 left-1 text-[10px] font-bold leading-none">
                    {rank}
                  </span>
                )}
                {rowIdx === 7 && (
                  <span style={{ color: isLight ? palette.dark : palette.light }} className="pointer-events-none absolute right-1 bottom-0.5 text-[10px] font-bold leading-none">
                    {file}
                  </span>
                )}
                {piece && (
                  <div
                    draggable={draggable}
                    onDragStart={(e) => {
                      if (!draggable) return;
                      initSoundEngine();
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', sq);
                      setSelectedSquare(sq);
                    }}
                    className={clsx('relative z-10 h-[84%] w-[84%]', draggable && 'cursor-grab active:cursor-grabbing')}
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}
                {isLegalTarget && (
                  <span
                    className={clsx(
                      'pointer-events-none z-20 rounded-full',
                      piece ? 'absolute inset-[6%] border-[4px] border-black/25' : 'relative h-[28%] w-[28%] bg-black/25'
                    )}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {pendingPromotion && (
        <PromotionPicker
          playerColor={playerColor}
          onCancel={() => setPendingPromotion(null)}
          onSelect={(promo) => {
            const { from, to } = pendingPromotion;
            setPendingPromotion(null);
            setSelectedSquare(null);
            onAttemptMove(from, to, promo);
          }}
        />
      )}
    </div>
  );
}
