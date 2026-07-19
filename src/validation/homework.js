import { z } from 'zod';

export const createHomeworkSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  dueDate: z.string().datetime('Due date must be a valid ISO timestamp'),
  published: z.boolean().optional().default(false),
  questions: z.array(z.string().uuid('Each question ID must be a valid UUID')).min(1, 'At least one question is required'),
});

export const updateHomeworkSchema = createHomeworkSchema.partial();

export const assignHomeworkSchema = z.object({
  studentId: z.string().uuid('Student ID must be a valid UUID').optional(),
  batch: z.string().min(1, 'Batch is required').optional(),
  departmentId: z.string().uuid('Department ID must be a valid UUID').optional(),
}).refine(data => data.studentId || data.batch || data.departmentId, {
  message: 'Must provide either studentId, batch, or departmentId to assign homework',
  path: ['studentId']
});
