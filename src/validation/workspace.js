import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  questionId: z.string().uuid('Question ID must be a valid UUID').optional().nullable(),
  homeworkId: z.string().uuid('Homework ID must be a valid UUID').optional().nullable(),
  contestId: z.string().uuid('Contest ID must be a valid UUID').optional().nullable()
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255).optional(),
  isDraft: z.boolean().optional()
});

export const createFileSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  fileName: z.string().min(1, 'File name is required').max(255),
  language: z.string().min(1, 'Language is required').max(50),
  content: z.string().default(''),
  isMain: z.boolean().optional().default(false)
});

export const updateFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255).optional(),
  content: z.string().optional()
});
