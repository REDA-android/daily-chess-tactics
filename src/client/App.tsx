import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Toaster } from 'sonner';
import { ActionControls } from './components/ActionControls';
import { ArchiveDrawer } from './components/ArchiveDrawer';
import { BoardHeader } from './components/BoardHeader';
import { ChessBoard } from './components/ChessBoard';
import { ReplayBar } from './components/ReplayBar';
import { ResultModal } from './components/ResultModal';
import { RushResultModal } from './components/RushResultModal';
import { TopBar } from './components/TopBar';
import { type GamePhase, usePuzzleGame } from './hooks/usePuzzleGame';
import { useRushGame } from './hooks/useRushGame';
import { type BoardTheme, cycleBoardTheme, loadSavedBoardTheme, saveBoardTheme } from './utils/boardThemes';
import { isSoundMuted, setSoundMuted } from './utils/soundEngine';

function fireCelebrationConfetti(isMuted: boolean) {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (isMuted || prefersReducedMotion) return;
  try {
    void confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
  } catch {
    // Canvas unavailable in non-visual environments
  }
}

export function App() {
  const game = usePuzzleGame();
  const rush = useRushGame(game.refreshCareer);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(loadSavedBoardTheme);
  const [isMuted, setIsMuted] = useState<boolean>(() => isSoundMuted());
  const [modalDismissed, setModalDismissed] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const prevPhaseRef = useRef<GamePhase>(game.phase);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  };

  const handleToggleTheme = () => {
    setBoardTheme((prev) => {
      const next = cycleBoardTheme(prev);
      saveBoardTheme(next);
      return next;
    });
  };

  const isFinished = !rush.active && (game.phase === 'won' || game.phase === 'lost');

  useEffect(() => {
    if (game.phase === 'playing') {
      setModalDismissed(false);
    } else if (prevPhaseRef.current === 'playing' && game.phase === 'won' && !rush.active) {
      fireCelebrationConfetti(isMuted);
    }
    prevPhaseRef.current = game.phase;
  }, [game.phase, isMuted, rush.active]);

  useEffect(() => {
    if (rush.rushPhase === 'finished' && rush.solvedCount > 0) {
      fireCelebrationConfetti(isMuted);
    }
  }, [isMuted, rush.rushPhase, rush.solvedCount]);

  if (game.phase === 'loading') {
    return (
      <main className="flex h-dvh items-center justify-center bg-slate-950 text-slate-300">
        <p className="text-sm font-medium animate-pulse">Loading today’s tactical puzzle...</p>
      </main>
    );
  }

  const activePuzzle = rush.active ? rush.puzzle : game.puzzle;
  const activeSolutionIdx = rush.active ? rush.solutionIndex : game.solutionIndex;
  const totalPlayerSteps = Math.ceil(activePuzzle.solution.length / 2);
  const completedSteps = !rush.active && game.phase === 'won' ? totalPlayerSteps : Math.floor(activeSolutionIdx / 2);
  const verticalReserve = (rush.active || game.gameMode === 'practice' ? 195 : 165) + (isFinished ? 42 : 0);
  const boardMaxWidth = `min(88vw, calc(100dvh - ${verticalReserve}px), 405px)`;

  return (
    <main className="flex h-dvh max-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-slate-950 px-3 py-2 text-slate-100">
      <Toaster position="top-center" theme="dark" richColors toastOptions={{ duration: 2200 }} />
      <TopBar
        puzzleNumber={rush.active ? rush.puzzle.id : game.puzzleNumber}
        rating={activePuzzle.rating}
        {...(activePuzzle.eco ? { eco: activePuzzle.eco } : {})}
        {...(activePuzzle.opening ? { opening: activePuzzle.opening } : {})}
        lives={rush.active ? rush.lives : game.lives}
        maxLives={rush.active ? rush.maxLives : game.maxLives}
        elapsedSeconds={rush.active ? rush.timeLeft : game.elapsedSeconds}
        streak={game.streak}
        gameMode={game.gameMode}
        isMuted={isMuted}
        {...(rush.active
          ? { rushInfo: { score: rush.score, combo: rush.combo, solvedCount: rush.solvedCount, onExitRush: rush.exitRush } }
          : {})}
        onToggleMute={toggleMute}
        onReturnToDaily={game.returnToDaily}
      />

      <section className="flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-1.5 min-h-0 py-1">
        <BoardHeader
          puzzle={activePuzzle}
          toastMessage={game.toastMessage}
          feedbackType={game.feedback?.type}
          isRush={rush.active}
          totalPlayerSteps={totalPlayerSteps}
          completedSteps={completedSteps}
        />

        <div className="w-full" style={{ maxWidth: boardMaxWidth }}>
          <ChessBoard
            fen={rush.active ? rush.fen : game.fen}
            orientation={rush.active ? rush.orientation : game.orientation}
            playerColor={activePuzzle.playerColor}
            disabled={
              rush.active
                ? rush.rushPhase !== 'playing' || rush.isLocked
                : game.phase !== 'playing' || game.isOpponentThinking
            }
            isSolved={!rush.active && game.phase === 'won'}
            lastMove={rush.active ? rush.lastMove : game.lastMove}
            hintSquare={rush.active ? null : game.hintSquare}
            feedback={rush.active ? rush.feedback : game.feedback}
            shakeKey={rush.active ? rush.shakeKey : game.shakeKey}
            boardTheme={boardTheme}
            onAttemptMove={rush.active ? rush.attemptMove : game.attemptMove}
          />
        </div>

        {isFinished && (
          <ReplayBar
            step={game.replayStep}
            totalSteps={game.replayTotal}
            sanLabel={game.replaySan}
            onStepChange={game.setReplayStep}
          />
        )}
      </section>

      <ActionControls
        isPlaying={game.phase === 'playing'}
        isRush={rush.active}
        isOpponentThinking={game.isOpponentThinking}
        hasHintActive={Boolean(game.hintSquare)}
        boardTheme={boardTheme}
        onHint={game.requestHint}
        onReset={game.resetPuzzle}
        onFlip={rush.active ? rush.flipBoard : game.flipBoard}
        onToggleTheme={handleToggleTheme}
        onOpenArchive={() => setArchiveOpen(true)}
        {...(isFinished ? { onOpenResult: () => setModalDismissed(false) } : {})}
      />

      {isFinished && !modalDismissed && (
        <ResultModal
          solved={game.phase === 'won'}
          gameMode={game.gameMode}
          dateKey={game.dateKey}
          currentUsername={game.username}
          puzzleNumber={game.puzzleNumber}
          puzzle={game.puzzle}
          attempts={game.attempts}
          elapsedSeconds={game.elapsedSeconds}
          streak={game.streak}
          tacticalElo={game.career.tacticalElo}
          globalStats={game.globalStats}
          hasSharedComment={game.hasSharedComment}
          isSharing={game.isSharing}
          onShareComment={game.shareToComments}
          onRetry={game.resetPuzzle}
          onNextPuzzle={game.selectNextPracticePuzzle}
          onOpenArchive={() => {
            setModalDismissed(true);
            setArchiveOpen(true);
          }}
          onReturnToDaily={game.returnToDaily}
          onClose={() => setModalDismissed(true)}
        />
      )}

      {rush.rushPhase === 'finished' && (
        <RushResultModal
          score={rush.score}
          solvedCount={rush.solvedCount}
          bestCombo={rush.bestCombo}
          bestEverScore={game.career.bestRushScore}
          isNewBest={rush.isNewBest}
          onPlayAgain={rush.startRush}
          onExitToDaily={() => {
            rush.exitRush();
            game.returnToDaily();
          }}
        />
      )}

      {archiveOpen && (
        <ArchiveDrawer
          activePuzzleId={activePuzzle.id}
          dailyPuzzleId={game.dailyPuzzleId}
          isPracticeMode={game.gameMode === 'practice' && !rush.active}
          career={game.career}
          onSelectPuzzle={(p) => {
            rush.exitRush();
            game.selectPracticePuzzle(p);
          }}
          onStartRush={rush.startRush}
          onReturnToDaily={() => {
            rush.exitRush();
            game.returnToDaily();
          }}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </main>
  );
}
