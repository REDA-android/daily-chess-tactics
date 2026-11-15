import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import type { LeaderboardResponse } from '../../shared/types';
import { fetchDailyLeaderboard } from '../utils/puzzleApi';
import { formatElapsedTime } from '../utils/shareFormatter';

interface LeaderboardTabProps {
  dateKey: string;
  currentUsername: string;
}

const MEDALS = ['🥇', '🥈', '🥉'] as const;

export function LeaderboardTab({ dateKey, currentUsername }: LeaderboardTabProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    let active = true;
    void fetchDailyLeaderboard(dateKey).then((res) => {
      if (active) setData(res);
    });
    return () => {
      active = false;
    };
  }, [dateKey]);

  if (!data) {
    return (
      <div className="mt-3 rounded-xl bg-slate-800/60 p-4 text-center text-xs text-slate-400 animate-pulse">
        Loading today’s subreddit leaderboard...
      </div>
    );
  }

  if (data.entries.length === 0) {
    return (
      <div className="mt-3 rounded-xl bg-slate-800/60 p-4 text-center text-xs text-slate-400">
        No ranked solves recorded yet today — be the first to claim #1!
      </div>
    );
  }

  const userInTop5 = data.entries.some((e) => e.username === currentUsername);

  return (
    <div className="mt-3 space-y-1.5">
      {data.entries.map((entry) => {
        const isCurrentUser = entry.username === currentUsername;
        const badge = MEDALS[entry.rank - 1] ?? `#${entry.rank}`;
        return (
          <div
            key={`${entry.rank}-${entry.username}`}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
              isCurrentUser
                ? 'bg-emerald-500/15 ring-1 ring-emerald-400/50 text-white'
                : 'bg-slate-800/70 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 text-center text-sm font-bold">{badge}</span>
              <span className="truncate font-semibold">u/{entry.username}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 font-mono">
              <span className="text-[11px] text-slate-400">
                {formatElapsedTime(entry.timeSeconds)}
              </span>
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
                {entry.score} pts
              </span>
            </div>
          </div>
        );
      })}

      {data.currentUser && !userInTop5 && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-500/15 px-3 py-2 text-xs text-white ring-1 ring-emerald-400/40">
          <div className="flex items-center gap-2 min-w-0">
            <Award className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="truncate font-semibold">
              #{data.currentUser.rank} • u/{data.currentUser.username}
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 font-mono">
            <span className="text-[11px] text-slate-300">
              {formatElapsedTime(data.currentUser.timeSeconds)}
            </span>
            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
              {data.currentUser.score} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
