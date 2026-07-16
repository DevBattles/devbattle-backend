import { z } from 'zod';

export const createCollegeSchema = z.object({
  name: z.string().min(2, 'College name must be at least 2 characters long').max(255)
});

export const createDepartmentSchema = z.object({
  collegeId: z.string().uuid('College ID must be a valid UUID'),
  name: z.string().min(2, 'Department name must be at least 2 characters long').max(255)
});

export const approveTeacherSchema = z.object({
  isApproved: z.boolean()
});
