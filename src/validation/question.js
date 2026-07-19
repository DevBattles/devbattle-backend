import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedTime: z.string().min(1, 'Estimated time is required'),
  techStack: z.array(z.string()).min(1, 'At least one tech stack item is required'),
  tags: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  starterFiles: z.record(z.any()).optional().default({}),
  assets: z.array(z.string()).optional().default([]),
  attachments: z.array(z.string()).optional().default([]),
  expectedOutput: z.string().optional().default(''),
  published: z.boolean().optional().default(false),
  category: z.string().optional(),
  workspaceType: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
  options: z.array(z.string()).optional(),
  previewRequired: z.boolean().optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();
