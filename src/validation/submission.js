import { z } from 'zod';

export const createSubmissionSchema = z.object({
  questionId: z.string().uuid('Question ID must be a valid UUID'),
  questionVersion: z.number().int().min(1, 'Question version must be at least 1'),
  files: z.record(z.any()).refine(files => Object.keys(files).length > 0, {
    message: 'At least one file must be submitted'
  }),
  githubRepo: z.string().url('GitHub Repository must be a valid URL').optional().nullable(),
  livePreview: z.string().url('Live Preview must be a valid URL').optional().nullable(),
  homeworkId: z.string().uuid('Homework ID must be a valid UUID').optional(),
  contestId: z.string().uuid('Contest ID must be a valid UUID').optional()
});

export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0).max(100, 'Score must be between 0 and 100'),
  grade: z.string().min(1, 'Grade is required'),
  feedback: z.string().min(1, 'Feedback is required'),
  report: z.record(z.any()).optional()
});
