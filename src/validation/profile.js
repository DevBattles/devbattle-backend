import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  departmentId: z.string().uuid('Department ID must be a valid UUID'),
  collegeId: z.string().uuid('College ID must be a valid UUID'),
  batch: z.string().min(1, 'Batch is required').max(100)
});

export const updateTeacherProfileSchema = z.object({
  departmentId: z.string().uuid('Department ID must be a valid UUID').optional().nullable(),
  collegeId: z.string().uuid('College ID must be a valid UUID').optional().nullable(),
  bio: z.string().max(2000).optional().nullable()
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(255).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  avatar: z.string().optional()
});
