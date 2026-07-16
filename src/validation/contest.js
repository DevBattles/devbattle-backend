import { z } from 'zod';

const contestBaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  startTime: z.string().datetime('Start time must be a valid ISO timestamp'),
  endTime: z.string().datetime('End time must be a valid ISO timestamp'),
  published: z.boolean().optional().default(false),
  questions: z.array(z.object({
    questionId: z.string().uuid('Question ID must be a valid UUID'),
    order: z.number().int().min(1).default(1),
    points: z.number().int().min(0).default(100)
  })).min(1, 'At least one question is required for the contest')
});

export const createContestSchema = contestBaseSchema.refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: 'End time must be after start time',
  path: ['endTime']
});

export const updateContestSchema = contestBaseSchema.partial();
