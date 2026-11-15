import { Hono, type Context } from 'hono';
import { serve } from '@hono/node-server';
import { context, createServer, getServerPort, reddit } from '@devvit/web/server';
import { getDailyPuzzle, getPuzzleNumber, getUtcDateKey } from '../shared/puzzles';
import type { DailyState, ShareResponse } from '../shared/types';
import { getDailyLeaderboard } from './leaderboard';
import {
  getGlobalDailyStats,
  getUserDailyState,
  hasSharedComment,
  markCommentShared,
  recordDailySubmission,
} from './redis';
import { menuRoutes, schedulerRoutes, triggerRoutes } from './scheduler';
import { ShareCommentSchema, SubmitResultSchema } from './validation';

const app = new Hono();
const api = new Hono();
const internal = new Hono();

async function resolveCurrentUser(): Promise<{ userId: string; username: string }> {
  try {
    const currentUser = await reddit.getCurrentUser();
    if (currentUser) {
      return { userId: currentUser.id, username: currentUser.username };
    }
  } catch (error) {
    console.warn('Could not load current user via reddit.getCurrentUser():', error);
  }

  return {
    userId: context.userId ?? 'anonymous',
    username: context.username ?? 'Guest',
  };
}

api.get('/health', (c) => c.json({ ok: true }));

api.get('/init', async (c) => {
  const dateKey = getUtcDateKey();
  const puzzle = getDailyPuzzle(dateKey);
  const puzzleNumber = getPuzzleNumber(dateKey);

  try {
    const { userId, username } = await resolveCurrentUser();
    const [userState, globalStats] = await Promise.all([
      getUserDailyState(userId, dateKey),
      getGlobalDailyStats(dateKey),
    ]);

    const state: DailyState = {
      dateKey,
      puzzleNumber,
      puzzle,
      user: {
        userId,
        username,
        streak: userState.streak,
        lastSolvedDate: userState.lastSolvedDate,
      },
      dailyResult: userState.dailyResult,
      globalStats,
    };

    return c.json(state, 200);
  } catch (error) {
    console.error('GET /api/init error:', error);
    return c.json({ error: 'Failed to initialize daily puzzle state' }, 500);
  }
});

api.get('/leaderboard', async (c) => {
  const dateParam = c.req.query('dateKey');
  const dateKey =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getUtcDateKey();
  try {
    const { username } = await resolveCurrentUser();
    const leaderboard = await getDailyLeaderboard(dateKey, username);
    return c.json(leaderboard, 200);
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return c.json({ error: 'Failed to load daily leaderboard' }, 500);
  }
});

api.post('/submit', async (c) => {
  try {
    const rawBody = await c.req.json();
    const parsed = SubmitResultSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json({ error: 'Invalid submission payload', issues: parsed.error.issues }, 400);
    }

    const dateKey = parsed.data.dateKey ?? getUtcDateKey();
    const expectedPuzzle = getDailyPuzzle(dateKey);
    if (parsed.data.puzzleId !== expectedPuzzle.id) {
      return c.json({ error: 'Puzzle ID does not match active daily puzzle' }, 400);
    }

    const { userId, username } = await resolveCurrentUser();
    const response = await recordDailySubmission(
      userId,
      {
        dateKey,
        puzzleId: parsed.data.puzzleId,
        solved: parsed.data.solved,
        attempts: parsed.data.attempts,
        timeSeconds: parsed.data.timeSeconds,
      },
      username
    );

    return c.json(response, 200);
  } catch (error) {
    console.error('POST /api/submit error:', error);
    return c.json({ error: 'Failed to submit puzzle result' }, 500);
  }
});

async function handleShareComment(c: Context) {
  const { postId } = context;
  if (!postId) {
    return c.json({ error: 'Missing postId in Devvit context' }, 400);
  }

  try {
    const rawBody = await c.req.json();
    const parsed = ShareCommentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json({ error: 'Comment text must be between 1 and 1000 characters' }, 400);
    }

    const dateKey = parsed.data.dateKey ?? getUtcDateKey();
    const { userId } = await resolveCurrentUser();
    if (userId === 'anonymous') {
      return c.json({ error: 'Sign in to Reddit to share your score to comments' }, 401);
    }

    const alreadyShared = await hasSharedComment(userId, dateKey);
    if (alreadyShared) {
      return c.json<ShareResponse>({ success: false, alreadyShared: true }, 409);
    }

    const comment = await reddit.submitComment({
      id: postId,
      text: parsed.data.text,
      runAs: 'USER',
    });

    await markCommentShared(userId, dateKey);
    return c.json<ShareResponse>({ success: true, commentId: comment.id }, 200);
  } catch (error) {
    console.error('POST share-comment error:', error);
    return c.json({ error: 'Failed to post comment to Reddit thread' }, 500);
  }
}

api.post('/share-comment', handleShareComment);
api.post('/comment', handleShareComment);

internal.route('/menu', menuRoutes);
internal.route('/scheduler', schedulerRoutes);
internal.route('/triggers', triggerRoutes);

app.route('/api', api);
app.route('/internal', internal);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
