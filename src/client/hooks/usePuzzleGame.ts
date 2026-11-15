import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { pickNextPracticePuzzle } from '../../shared/puzzles';
import type { ChessPuzzle, DailyState, GameMode, MoveAttempt, PieceColor } from '../../shared/types';
import type { BoardMoveHighlight, SquareFeedback } from '../components/ChessBoard';
import { type CareerStats, loadCareerStats, recordCareerPuzzleOutcome } from '../utils/careerStats';
import {
  applyOpponentReply, buildSolutionTimeline, buildSolvedPosition, buildStartingPosition,
  createInitialDailyMeta, type DailyMeta, evaluatePuzzleMove, fetchDailyInit,
  postShareComment, postSubmitResult,
} from '../utils/puzzleApi';
import { playBoardCue, playMistake, playVictory } from '../utils/soundEngine';

export type GamePhase = 'loading' | 'playing' | 'won' | 'lost';
const MAX_LIVES = 3;

export function usePuzzleGame() {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [meta, setMeta] = useState<DailyMeta>(createInitialDailyMeta);
  const [career, setCareer] = useState<CareerStats>(loadCareerStats);
  const [fen, setFen] = useState<string>(() => buildStartingPosition(meta.puzzle).fen);
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [lastMove, setLastMove] = useState<BoardMoveHighlight | null>(null);
  const [solutionIndex, setSolutionIndex] = useState<number>(0);
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [attempts, setAttempts] = useState<MoveAttempt[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [hintUsedForStep, setHintUsedForStep] = useState<boolean>(false);
  const [isOpponentThinking, setIsOpponentThinking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SquareFeedback | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [hasSharedComment, setHasSharedComment] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [practiceRetry, setPracticeRetry] = useState<boolean>(false);
  const [replayStep, setReplayStepRaw] = useState<number | null>(null);

  const replyTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const isLockedRef = useRef<boolean>(false);
  const dailySnapshotRef = useRef<DailyState | null>(null);

  const clearTimers = useCallback(() => {
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    replyTimerRef.current = null;
    feedbackTimerRef.current = null;
    isLockedRef.current = false;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const loadBoardForPlay = useCallback((puzzle: ChessPuzzle, resetAll: boolean) => {
    clearTimers();
    const start = buildStartingPosition(puzzle);
    setFen(start.fen);
    setLastMove(start.lastMove);
    setSolutionIndex(0);
    setHintSquare(null);
    setHintUsedForStep(false);
    setIsOpponentThinking(false);
    setFeedback(null);
    setToastMessage(null);
    if (resetAll) {
      setOrientation(puzzle.playerColor);
      setLives(MAX_LIVES);
      setAttempts([]);
      setElapsedSeconds(0);
      setReplayStepRaw(null);
      setPhase('playing');
    }
  }, [clearTimers]);

  const applyDailyState = useCallback((data: DailyState) => {
    dailySnapshotRef.current = data;
    setGameMode('daily');
    setPracticeRetry(false);
    setMeta({
      dateKey: data.dateKey, puzzleNumber: data.puzzleNumber, dailyPuzzleId: data.puzzle.id,
      puzzle: data.puzzle, username: data.user.username, streak: data.user.streak, globalStats: data.globalStats,
    });
    if (data.dailyResult) {
      loadBoardForPlay(data.puzzle, false);
      const pos = data.dailyResult.solved ? buildSolvedPosition(data.puzzle) : buildStartingPosition(data.puzzle);
      setOrientation(data.puzzle.playerColor);
      setFen(pos.fen);
      setLastMove(pos.lastMove);
      setAttempts(data.dailyResult.attempts);
      setElapsedSeconds(data.dailyResult.timeSeconds);
      setHasSharedComment(data.dailyResult.hasSharedComment);
      setLives(Math.max(0, MAX_LIVES - data.dailyResult.attempts.filter((a) => a.status === 'mistake').length));
      setReplayStepRaw(data.dailyResult.solved ? data.puzzle.solution.length : 0);
      setPhase(data.dailyResult.solved ? 'won' : 'lost');
    } else {
      setHasSharedComment(false);
      loadBoardForPlay(data.puzzle, true);
    }
  }, [loadBoardForPlay]);

  useEffect(() => {
    let active = true;
    void fetchDailyInit().then((data) => { if (active) applyDailyState(data); });
    return () => { active = false; };
  }, [applyDailyState]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const showTransientFeedback = useCallback((sq: string, type: 'correct' | 'mistake', message: string | null) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    setFeedback({ square: sq, type });
    setToastMessage(message);
    if (message && type === 'mistake') toast.error(message);
    else if (message === 'Brilliant! Puzzle solved!') toast.success(message);
    feedbackTimerRef.current = window.setTimeout(() => { setFeedback(null); setToastMessage(null); }, 1500);
  }, []);

  const finalizeOutcome = useCallback(async (solved: boolean, finalAttempts: MoveAttempt[], finalSeconds: number) => {
    const usedHint = finalAttempts.some((a) => a.status === 'hint');
    const mistakes = finalAttempts.filter((a) => a.status === 'mistake').length;
    setCareer(recordCareerPuzzleOutcome(meta.puzzle.id, meta.puzzle.rating, solved, usedHint, mistakes));
    if (gameMode === 'practice' || practiceRetry) return;
    const res = await postSubmitResult({ dateKey: meta.dateKey, puzzleId: meta.puzzle.id, solved, attempts: finalAttempts, timeSeconds: finalSeconds });
    if (!res) return;
    setMeta((prev) => ({ ...prev, globalStats: res.globalStats, streak: res.streak }));
    if (dailySnapshotRef.current) {
      dailySnapshotRef.current = { ...dailySnapshotRef.current, dailyResult: res.dailyResult, globalStats: res.globalStats, user: { ...dailySnapshotRef.current.user, streak: res.streak } };
    }
  }, [gameMode, meta.dateKey, meta.puzzle.id, meta.puzzle.rating, practiceRetry]);

  const attemptMove = useCallback((from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
    if (phase !== 'playing' || isOpponentThinking || isLockedRef.current) return;
    const result = evaluatePuzzleMove(fen, meta.puzzle.solution, solutionIndex, from, to, promotion);
    if (result.kind === 'illegal') return;

    const stepIndex = Math.floor(solutionIndex / 2);
    if (result.kind === 'mistake') {
      playMistake();
      const nextLives = lives - 1;
      const nextAttempts: MoveAttempt[] = [...attempts, { stepIndex, status: 'mistake' }];
      setAttempts(nextAttempts);
      setLives(nextLives);
      setShakeKey((k) => k + 1);
      showTransientFeedback(result.to, 'mistake', 'Not the best move — try again!');
      if (nextLives <= 0) { setReplayStepRaw(0); setPhase('lost'); void finalizeOutcome(false, nextAttempts, elapsedSeconds); }
      return;
    }

    const nextAttempts: MoveAttempt[] = [...attempts, { stepIndex, status: hintUsedForStep ? 'hint' : 'correct' }];
    setAttempts(nextAttempts);
    setFen(result.nextFen);
    setLastMove({ from, to });
    setHintSquare(null);
    setHintUsedForStep(false);

    if (!result.oppUci) {
      playVictory();
      showTransientFeedback(to, 'correct', 'Brilliant! Puzzle solved!');
      setReplayStepRaw(meta.puzzle.solution.length);
      setPhase('won');
      void finalizeOutcome(true, nextAttempts, elapsedSeconds);
      return;
    }

    playBoardCue(result.isCheck, result.isCapture);
    showTransientFeedback(to, 'correct', 'Best move!');
    const oppUci = result.oppUci;
    isLockedRef.current = true;
    setIsOpponentThinking(true);
    replyTimerRef.current = window.setTimeout(() => {
      const reply = applyOpponentReply(result.nextFen, oppUci);
      playBoardCue(reply.isCheck, reply.isCapture);
      setFen(reply.fen);
      setLastMove(reply.lastMove);
      setSolutionIndex(solutionIndex + 2);
      isLockedRef.current = false;
      setIsOpponentThinking(false);
    }, 400);
  }, [attempts, elapsedSeconds, finalizeOutcome, fen, hintUsedForStep, isOpponentThinking, lives, meta.puzzle.solution, phase, showTransientFeedback, solutionIndex]);

  const requestHint = useCallback(() => {
    if (phase !== 'playing' || isOpponentThinking || isLockedRef.current) return;
    const expectedUci = meta.puzzle.solution[solutionIndex];
    if (expectedUci) { setHintSquare(expectedUci.slice(0, 2)); setHintUsedForStep(true); }
  }, [isOpponentThinking, meta.puzzle.solution, phase, solutionIndex]);

  const flipBoard = useCallback(() => setOrientation((p) => (p === 'w' ? 'b' : 'w')), []);
  const resetPuzzle = useCallback(() => {
    if (phase !== 'playing') setPracticeRetry(true);
    loadBoardForPlay(meta.puzzle, phase !== 'playing');
  }, [loadBoardForPlay, meta.puzzle, phase]);

  const selectPracticePuzzle = useCallback((puzzle: ChessPuzzle) => {
    setGameMode('practice');
    setPracticeRetry(true);
    setMeta((prev) => ({ ...prev, puzzleNumber: puzzle.id, puzzle }));
    loadBoardForPlay(puzzle, true);
  }, [loadBoardForPlay]);

  const selectNextPracticePuzzle = useCallback(() => {
    selectPracticePuzzle(pickNextPracticePuzzle(meta.puzzle.id, career.solvedIds));
  }, [career.solvedIds, meta.puzzle.id, selectPracticePuzzle]);

  const returnToDaily = useCallback(() => { if (dailySnapshotRef.current) applyDailyState(dailySnapshotRef.current); }, [applyDailyState]);

  const shareToComments = useCallback(async (text: string): Promise<boolean> => {
    if (gameMode === 'practice' || hasSharedComment || isSharing) return false;
    setIsSharing(true);
    const res = await postShareComment(meta.dateKey, text);
    setIsSharing(false);
    if (res.ok) {
      setHasSharedComment(true);
      if (dailySnapshotRef.current?.dailyResult) dailySnapshotRef.current.dailyResult.hasSharedComment = true;
      toast.success('Score shared to Reddit comments!');
      return true;
    }
    if (res.alreadyShared) setHasSharedComment(true);
    toast.error(res.error ?? 'Unable to post comment right now.');
    return false;
  }, [gameMode, hasSharedComment, isSharing, meta.dateKey]);

  const replayFrames = useMemo(() => buildSolutionTimeline(meta.puzzle), [meta.puzzle]);
  const setReplayStep = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(meta.puzzle.solution.length, next));
    setReplayStepRaw((prev) => {
      if (prev !== null && clamped > prev && replayFrames[clamped]) {
        playBoardCue(Boolean(replayFrames[clamped]?.isCheck), Boolean(replayFrames[clamped]?.isCapture));
      }
      return clamped;
    });
  }, [meta.puzzle.solution.length, replayFrames]);

  const isFinished = phase === 'won' || phase === 'lost';
  const activeFrame = isFinished && replayStep !== null ? replayFrames[replayStep] : undefined;

  return {
    phase, gameMode, ...meta, career, refreshCareer: () => setCareer(loadCareerStats()),
    fen: activeFrame?.fen ?? fen, orientation, lastMove: activeFrame ? activeFrame.lastMove : lastMove,
    lives, maxLives: MAX_LIVES, attempts, elapsedSeconds, hintSquare, isOpponentThinking, feedback,
    toastMessage, shakeKey, hasSharedComment, isSharing, solutionIndex,
    replayStep: replayStep ?? 0, replayTotal: meta.puzzle.solution.length, replaySan: activeFrame?.sanLabel ?? null,
    attemptMove, requestHint, flipBoard, resetPuzzle, selectPracticePuzzle, selectNextPracticePuzzle,
    returnToDaily, setReplayStep, shareToComments,
  };
}
