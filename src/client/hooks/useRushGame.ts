import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PUZZLE_BANK } from '../../shared/puzzles';
import type { ChessPuzzle, PieceColor } from '../../shared/types';
import type { BoardMoveHighlight, SquareFeedback } from '../components/ChessBoard';
import { recordCareerRushResult } from '../utils/careerStats';
import { applyOpponentReply, buildStartingPosition, evaluatePuzzleMove } from '../utils/puzzleApi';
import { playBoardCue, playMistake, playVictory } from '../utils/soundEngine';

export type RushPhase = 'idle' | 'playing' | 'finished';
const RUSH_SECONDS = 180;
const MAX_STRIKES = 3;

function buildRushDeck(): ChessPuzzle[] {
  const sorted = [...PUZZLE_BANK].sort((a, b) => a.rating - b.rating);
  for (let i = 0; i < sorted.length; i += 4) {
    const end = Math.min(i + 4, sorted.length);
    for (let j = end - 1; j > i; j--) {
      const k = i + Math.floor(Math.random() * (j - i + 1));
      const tmp = sorted[j]!;
      sorted[j] = sorted[k]!;
      sorted[k] = tmp;
    }
  }
  return sorted;
}

export function useRushGame(onCareerUpdated: () => void) {
  const [rushPhase, setRushPhase] = useState<RushPhase>('idle');
  const [deck, setDeck] = useState<ChessPuzzle[]>(() => [...PUZZLE_BANK]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [fen, setFen] = useState(() => buildStartingPosition(PUZZLE_BANK[0]!).fen);
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [lastMove, setLastMove] = useState<BoardMoveHighlight | null>(null);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RUSH_SECONDS);
  const [strikes, setStrikes] = useState(0);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [feedback, setFeedback] = useState<SquareFeedback | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const solvedRef = useRef(0);
  scoreRef.current = score;
  solvedRef.current = solvedCount;

  const clearPending = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsLocked(false);
  }, []);

  useEffect(() => clearPending, [clearPending]);

  const loadPuzzle = useCallback((puzzle: ChessPuzzle) => {
    clearPending();
    const start = buildStartingPosition(puzzle);
    setFen(start.fen);
    setLastMove(start.lastMove);
    setOrientation(puzzle.playerColor);
    setSolutionIndex(0);
    setFeedback(null);
  }, [clearPending]);

  const finishRush = useCallback((finalScore: number, finalSolved: number) => {
    clearPending();
    const res = recordCareerRushResult(finalScore, finalSolved);
    setIsNewBest(res.isNewBest && finalScore > 0);
    setRushPhase('finished');
    onCareerUpdated();
  }, [clearPending, onCareerUpdated]);

  useEffect(() => {
    if (rushPhase !== 'playing') return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          finishRush(scoreRef.current, solvedRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finishRush, rushPhase]);

  const startRush = useCallback(() => {
    const nextDeck = buildRushDeck();
    setDeck(nextDeck);
    setDeckIndex(0);
    setTimeLeft(RUSH_SECONDS);
    setStrikes(0);
    setScore(0);
    setSolvedCount(0);
    setCombo(0);
    setBestCombo(0);
    setIsNewBest(false);
    setRushPhase('playing');
    loadPuzzle(nextDeck[0]!);
    toast.success('⚡ 3-Min Puzzle Rush started! Go!');
  }, [loadPuzzle]);

  const exitRush = useCallback(() => {
    clearPending();
    setRushPhase('idle');
  }, [clearPending]);

  const flipBoard = useCallback(() => setOrientation((p) => (p === 'w' ? 'b' : 'w')), []);

  const puzzle = deck[deckIndex] ?? PUZZLE_BANK[0]!;

  const attemptMove = useCallback((from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
    if (rushPhase !== 'playing' || isLocked) return;
    const result = evaluatePuzzleMove(fen, puzzle.solution, solutionIndex, from, to, promotion);
    if (result.kind === 'illegal') return;

    if (result.kind === 'mistake') {
      playMistake();
      const nextStrikes = strikes + 1;
      setStrikes(nextStrikes);
      setCombo(0);
      setShakeKey((k) => k + 1);
      setFeedback({ square: result.to, type: 'mistake' });
      toast.error(`Strike ${nextStrikes}/${MAX_STRIKES}!`);
      if (nextStrikes >= MAX_STRIKES) {
        finishRush(score, solvedCount);
      }
      return;
    }

    setFen(result.nextFen);
    setLastMove({ from, to });
    setFeedback({ square: to, type: 'correct' });

    if (!result.oppUci) {
      playVictory();
      const nextCombo = combo + 1;
      const multiplier = Math.min(5, 1 + Math.floor(nextCombo / 3));
      const gained = 100 * multiplier;
      const nextScore = score + gained;
      const nextSolved = solvedCount + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
      setScore(nextScore);
      setSolvedCount(nextSolved);
      toast.success(`+${gained} pts${multiplier > 1 ? ` • 🔥 x${multiplier}` : ''}`);

      setIsLocked(true);
      const nextIdx = (deckIndex + 1) % deck.length;
      timerRef.current = window.setTimeout(() => {
        setDeckIndex(nextIdx);
        loadPuzzle(deck[nextIdx]!);
      }, 450);
      return;
    }

    playBoardCue(result.isCheck, result.isCapture);
    const oppUci = result.oppUci;
    setIsLocked(true);
    timerRef.current = window.setTimeout(() => {
      const reply = applyOpponentReply(result.nextFen, oppUci);
      playBoardCue(reply.isCheck, reply.isCapture);
      setFen(reply.fen);
      setLastMove(reply.lastMove);
      setSolutionIndex(solutionIndex + 2);
      setFeedback(null);
      setIsLocked(false);
    }, 320);
  }, [combo, deck, deckIndex, fen, finishRush, isLocked, loadPuzzle, puzzle.solution, rushPhase, score, solutionIndex, solvedCount, strikes]);

  return {
    active: rushPhase !== 'idle',
    rushPhase,
    puzzle,
    fen,
    orientation,
    lastMove,
    timeLeft,
    lives: Math.max(0, MAX_STRIKES - strikes),
    maxLives: MAX_STRIKES,
    score,
    solvedCount,
    combo,
    bestCombo,
    isNewBest,
    isLocked,
    feedback,
    shakeKey,
    solutionIndex,
    startRush,
    exitRush,
    flipBoard,
    attemptMove,
  };
}
