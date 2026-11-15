import { redis } from '@devvit/web/server';
import type {
  GlobalDailyStats,
  PlayerDailyResult,
  SubmitResultPayload,
  SubmitResultResponse,
} from '../shared/types';
import { recordLeaderboardEntry } from './leaderboard';
import { computeEffectiveStreak, computeNextStreak } from './streak';

const keys = {
  streak: (userId: string) => `user:${userId}:streak`,
  lastSolved: (userId: string) => `user:${userId}:lastSolvedDate`,
  userDaily: (userId: string, dateKey: string) => `user:${userId}:daily:${dateKey}`,
  dailyPlays: (dateKey: string) => `daily:${dateKey}:plays`,
  dailySolves: (dateKey: string) => `daily:${dateKey}:solves`,
  dailyTotalTime: (dateKey: string) => `daily:${dateKey}:totalTime`,
  dailyPostId: (dateKey: string) => `daily:${dateKey}:postId`,
};

export async function getGlobalDailyStats(dateKey: string): Promise<GlobalDailyStats> {
  const [playsRaw, solvesRaw, timeRaw] = await redis.mGet([
    keys.dailyPlays(dateKey),
    keys.dailySolves(dateKey),
    keys.dailyTotalTime(dateKey),
  ]);

  const totalPlays = playsRaw ? parseInt(playsRaw, 10) || 0 : 0;
  const totalSolves = solvesRaw ? parseInt(solvesRaw, 10) || 0 : 0;
  const totalTime = timeRaw ? parseInt(timeRaw, 10) || 0 : 0;

  return {
    totalPlays,
    totalSolves,
    averageTimeSeconds: totalPlays > 0 ? Math.round(totalTime / totalPlays) : 0,
  };
}

export async function getUserDailyState(
  userId: string,
  dateKey: string
): Promise<{
  streak: number;
  lastSolvedDate: string | null;
  dailyResult: PlayerDailyResult | null;
}> {
  if (userId === 'anonymous') {
    return { streak: 0, lastSolvedDate: null, dailyResult: null };
  }

  const [streakRaw, lastSolvedRaw, dailyRaw] = await redis.mGet([
    keys.streak(userId),
    keys.lastSolved(userId),
    keys.userDaily(userId, dateKey),
  ]);

  const storedStreak = streakRaw ? parseInt(streakRaw, 10) || 0 : 0;
  const lastSolvedDate = lastSolvedRaw ?? null;
  let dailyResult: PlayerDailyResult | null = null;
  if (dailyRaw) {
    try {
      dailyResult = JSON.parse(dailyRaw) as PlayerDailyResult;
    } catch {
      dailyResult = null;
    }
  }

  return {
    streak: computeEffectiveStreak(storedStreak, lastSolvedDate, dateKey),
    lastSolvedDate,
    dailyResult,
  };
}

export async function recordDailySubmission(
  userId: string,
  payload: SubmitResultPayload,
  username = 'Guest'
): Promise<SubmitResultResponse> {
  const { dateKey, puzzleId, solved, attempts } = payload;
  const timeSeconds = Math.max(0, Math.round(payload.timeSeconds));
  const isAuthUser = userId !== 'anonymous';

  if (isAuthUser) {
    const existingRaw = await redis.get(keys.userDaily(userId, dateKey));
    if (existingRaw) {
      try {
        const existing = JSON.parse(existingRaw) as PlayerDailyResult;
        const globalStats = await getGlobalDailyStats(dateKey);
        return { dailyResult: existing, globalStats, streak: existing.streak };
      } catch {
        // Proceed to overwrite corrupted record
      }
    }
  }

  await redis.incrBy(keys.dailyPlays(dateKey), 1);
  if (solved) {
    await redis.incrBy(keys.dailySolves(dateKey), 1);
  }
  if (timeSeconds > 0) {
    await redis.incrBy(keys.dailyTotalTime(dateKey), timeSeconds);
  }

  let nextStreak = solved ? 1 : 0;
  if (isAuthUser) {
    const [streakRaw, lastSolvedRaw] = await redis.mGet([
      keys.streak(userId),
      keys.lastSolved(userId),
    ]);
    const storedStreak = streakRaw ? parseInt(streakRaw, 10) || 0 : 0;
    const lastSolvedDate = lastSolvedRaw ?? null;
    nextStreak = computeNextStreak(storedStreak, lastSolvedDate, dateKey, solved);

    await redis.set(keys.streak(userId), String(nextStreak));
    if (solved) {
      await redis.set(keys.lastSolved(userId), dateKey);
    }
  }

  const dailyResult: PlayerDailyResult = {
    puzzleId,
    dateKey,
    solved,
    attempts,
    timeSeconds,
    streak: nextStreak,
    hasSharedComment: false,
  };

  if (isAuthUser) {
    await redis.set(keys.userDaily(userId, dateKey), JSON.stringify(dailyResult));
    if (solved && username !== 'Guest') {
      await recordLeaderboardEntry(dateKey, username, timeSeconds, attempts);
    }
  }

  const globalStats = await getGlobalDailyStats(dateKey);
  return { dailyResult, globalStats, streak: nextStreak };
}

export async function hasSharedComment(userId: string, dateKey: string): Promise<boolean> {
  if (userId === 'anonymous') return false;
  const raw = await redis.get(keys.userDaily(userId, dateKey));
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as PlayerDailyResult;
    return Boolean(parsed.hasSharedComment);
  } catch {
    return false;
  }
}

export async function markCommentShared(
  userId: string,
  dateKey: string
): Promise<PlayerDailyResult | null> {
  if (userId === 'anonymous') return null;
  const raw = await redis.get(keys.userDaily(userId, dateKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlayerDailyResult;
    const updated: PlayerDailyResult = { ...parsed, hasSharedComment: true };
    await redis.set(keys.userDaily(userId, dateKey), JSON.stringify(updated));
    return updated;
  } catch {
    return null;
  }
}

export async function getDailyPostId(dateKey: string): Promise<string | undefined> {
  return redis.get(keys.dailyPostId(dateKey));
}

export async function setDailyPostId(dateKey: string, postId: string): Promise<void> {
  await redis.set(keys.dailyPostId(dateKey), postId);
}
