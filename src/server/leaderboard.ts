import { redis } from '@devvit/web/server';
import type { LeaderboardEntry, LeaderboardResponse, MoveAttempt } from '../shared/types';

const lbKeys = {
  board: (dateKey: string) => `daily:${dateKey}:leaderboard`,
  times: (dateKey: string) => `daily:${dateKey}:leaderboardTimes`,
};

export function computeDailyScore(timeSeconds: number, attempts: readonly MoveAttempt[]): number {
  const safeTime = Math.max(0, Math.round(timeSeconds));
  const mistakes = attempts.filter((a) => a.status === 'mistake').length;
  const hintsUsed = attempts.filter((a) => a.status === 'hint').length;
  return Math.max(100, 1000 - safeTime * 3 - mistakes * 150 - hintsUsed * 200);
}

export async function recordLeaderboardEntry(
  dateKey: string,
  username: string,
  timeSeconds: number,
  attempts: readonly MoveAttempt[]
): Promise<void> {
  const safeTime = Math.max(0, Math.round(timeSeconds));
  const score = computeDailyScore(safeTime, attempts);
  await Promise.all([
    redis.zAdd(lbKeys.board(dateKey), { member: username, score }),
    redis.hSet(lbKeys.times(dateKey), { [username]: String(safeTime) }),
  ]);
}

export async function getDailyLeaderboard(
  dateKey: string,
  username: string
): Promise<LeaderboardResponse> {
  const boardKey = lbKeys.board(dateKey);
  const timesKey = lbKeys.times(dateKey);

  const topRaw = await redis.zRange(boardKey, 0, 4, { by: 'rank', reverse: true });
  const members = topRaw.map((item) => item.member);
  const timesRaw = members.length > 0 ? await redis.hMGet(timesKey, members) : [];

  const entries: LeaderboardEntry[] = topRaw.map((item, idx) => ({
    rank: idx + 1,
    username: item.member,
    score: Math.round(item.score),
    timeSeconds: timesRaw[idx] ? parseInt(timesRaw[idx], 10) || 0 : 0,
  }));

  let currentUser: LeaderboardEntry | null =
    entries.find((e) => e.username === username) ?? null;

  if (!currentUser && username && username !== 'Guest') {
    const [card, ascRank, userScore, userTimeRaw] = await Promise.all([
      redis.zCard(boardKey),
      redis.zRank(boardKey, username),
      redis.zScore(boardKey, username),
      redis.hMGet(timesKey, [username]),
    ]);
    if (ascRank !== undefined && userScore !== undefined) {
      currentUser = {
        rank: Math.max(1, card - ascRank),
        username,
        score: Math.round(userScore),
        timeSeconds: userTimeRaw[0] ? parseInt(userTimeRaw[0], 10) || 0 : 0,
      };
    }
  }

  return { dateKey, entries, currentUser };
}
