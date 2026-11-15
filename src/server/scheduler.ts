import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type { OnAppInstallRequest, TriggerResponse, UiResponse } from '@devvit/web/shared';
import { getDailyPuzzle, getPuzzleNumber, getUtcDateKey } from '../shared/puzzles';
import { getDailyPostId, setDailyPostId } from './redis';

export interface PostCreationOutcome {
  created: boolean;
  postId: string;
  dateKey: string;
  puzzleNumber: number;
}

export async function createDailyTacticsPost(options?: {
  idempotentForToday?: boolean;
}): Promise<PostCreationOutcome> {
  const dateKey = getUtcDateKey();
  const puzzleNumber = getPuzzleNumber(dateKey);
  const puzzle = getDailyPuzzle(dateKey);

  if (options?.idempotentForToday) {
    const existingPostId = await getDailyPostId(dateKey);
    if (existingPostId) {
      return { created: false, postId: existingPostId, dateKey, puzzleNumber };
    }
  }

  const title = `♟️ Daily Chess Tactics #${puzzleNumber} — ${puzzle.title} (${puzzle.rating})`;
  const post = await reddit.submitCustomPost({
    title,
    entry: 'default',
  });

  await setDailyPostId(dateKey, post.id);
  return { created: true, postId: post.id, dateKey, puzzleNumber };
}

export const menuRoutes = new Hono();

menuRoutes.post('/post-create', async (c) => {
  try {
    const outcome = await createDailyTacticsPost({ idempotentForToday: false });
    const subredditName = context.subredditName;

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${subredditName}/comments/${outcome.postId}`,
      },
      200
    );
  } catch (error) {
    console.error('Error creating Daily Chess Tactics post:', error);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create Daily Chess Tactics post.',
      },
      400
    );
  }
});

export const schedulerRoutes = new Hono();

schedulerRoutes.post('/daily-post', async (c) => {
  try {
    const outcome = await createDailyTacticsPost({ idempotentForToday: true });
    return c.json(
      {
        status: 'ok',
        created: outcome.created,
        postId: outcome.postId,
        dateKey: outcome.dateKey,
      },
      200
    );
  } catch (error) {
    console.error('Daily scheduler post error:', error);
    return c.json({ status: 'error', message: 'Failed to run daily post job' }, 500);
  }
});

export const triggerRoutes = new Hono();

triggerRoutes.post('/on-app-install', async (c) => {
  try {
    const input = await c.req.json<OnAppInstallRequest>();
    const outcome = await createDailyTacticsPost({ idempotentForToday: true });

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Daily Chess Tactics #${outcome.puzzleNumber} post ready (${outcome.postId}) on ${input.type}`,
      },
      200
    );
  } catch (error) {
    console.error('App install trigger error:', error);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to create initial post on install',
      },
      400
    );
  }
});
