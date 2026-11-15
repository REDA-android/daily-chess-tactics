import { z } from 'zod';

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const MoveAttemptSchema = z.object({
  stepIndex: z.number().int().min(0).max(50),
  status: z.enum(['correct', 'hint', 'mistake']),
});

export const SubmitResultSchema = z.object({
  dateKey: z.string().regex(DATE_KEY_REGEX).optional(),
  puzzleId: z.number().int().positive(),
  solved: z.boolean(),
  attempts: z.array(MoveAttemptSchema).max(50),
  timeSeconds: z.number().int().min(0).max(86400),
});

export const ShareCommentSchema = z.object({
  dateKey: z.string().regex(DATE_KEY_REGEX).optional(),
  text: z.string().trim().min(1).max(1000),
});
