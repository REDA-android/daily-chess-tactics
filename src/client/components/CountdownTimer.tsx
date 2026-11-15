import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatUtcCountdownHms } from '../utils/shareFormatter';

export function CountdownTimer() {
  const [countdown, setCountdown] = useState<string>(() => formatUtcCountdownHms());

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(formatUtcCountdownHms());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-slate-950/50 px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-white/5">
      <Clock className="h-3.5 w-3.5 text-sky-400" />
      <span>
        Next Daily Puzzle in{' '}
        <strong className="font-mono font-bold text-slate-100 tabular-nums">{countdown}</strong> UTC
      </span>
    </div>
  );
}
