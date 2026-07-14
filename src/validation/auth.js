import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(50, { message: 'Username cannot exceed 50 characters' })
    .trim(),
  email: z.string()
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
  role: z.enum(['student', 'teacher'], {
    errorMap: () => ({ message: "Role must be either 'student' or 'teacher'" })
  })
});

export const loginSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, { message: 'Password is required' }),
});
