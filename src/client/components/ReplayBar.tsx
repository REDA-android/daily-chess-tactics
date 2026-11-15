import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play } from 'lucide-react';

interface ReplayBarProps {
  step: number;
  totalSteps: number;
  sanLabel: string | null;
  onStepChange: (nextStep: number) => void;
}

export function ReplayBar({ step, totalSteps, sanLabel, onStepChange }: ReplayBarProps) {
  const [autoPlaying, setAutoPlaying] = useState(false);
  const atStart = step <= 0;
  const atEnd = step >= totalSteps;

  useEffect(() => {
    if (!autoPlaying) return;
    if (step >= totalSteps) {
      setAutoPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      onStepChange(step + 1);
    }, 800);
    return () => window.clearTimeout(id);
  }, [autoPlaying, onStepChange, step, totalSteps]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        setAutoPlaying(false);
        onStepChange(Math.max(0, step - 1));
      } else if (e.key === 'ArrowRight') {
        setAutoPlaying(false);
        onStepChange(Math.min(totalSteps, step + 1));
      } else if (e.key === 'Home') {
        setAutoPlaying(false);
        onStepChange(0);
      } else if (e.key === 'End') {
        setAutoPlaying(false);
        onStepChange(totalSteps);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStepChange, step, totalSteps]);

  const togglePlay = () => {
    if (autoPlaying) {
      setAutoPlaying(false);
      return;
    }
    if (step >= totalSteps) onStepChange(0);
    setAutoPlaying(true);
  };

  return (
    <div className="flex w-full items-center justify-between gap-1 rounded-xl bg-slate-900/90 px-2 py-1 ring-1 ring-white/10">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setAutoPlaying(false);
            onStepChange(0);
          }}
          disabled={atStart}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          title="First move (Home)"
          aria-label="Jump to start"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoPlaying(false);
            onStepChange(step - 1);
          }}
          disabled={atStart}
          className="flex items-center gap-0.5 rounded-lg bg-slate-800 px-1.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          title="Previous move (Left Arrow)"
          aria-label="Previous move"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </button>
      </div>

      <div className="flex items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={togglePlay}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition cursor-pointer ${
            autoPlaying
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-emerald-600/85 text-white hover:bg-emerald-500'
          }`}
          title={autoPlaying ? 'Pause solution replay' : 'Auto-play solution'}
          aria-label={autoPlaying ? 'Pause solution replay' : 'Auto-play solution'}
        >
          {autoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <span className="text-[11px] font-mono font-semibold text-slate-400 shrink-0">
          {step}/{totalSteps}
        </span>
        <span className="truncate rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
          {sanLabel ?? 'Start'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setAutoPlaying(false);
            onStepChange(step + 1);
          }}
          disabled={atEnd}
          className="flex items-center gap-0.5 rounded-lg bg-slate-800 px-1.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          title="Next move (Right Arrow)"
          aria-label="Next move"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoPlaying(false);
            onStepChange(totalSteps);
          }}
          disabled={atEnd}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          title="Final move (End)"
          aria-label="Jump to end"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
