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
  role: z.enum(['student', 'teacher', 'admin'], {
    errorMap: () => ({ message: "Role must be either 'student', 'teacher', or 'admin'" })
  }),
  adminCode: z.string().optional(),
  joinCode: z.string().optional().or(z.literal(''))
}).refine((data) => {
  // If role is admin, adminCode is required and must match
  if (data.role === 'admin') {
    const expectedAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'DEVBATTLES_ADMIN_2024';
    return data.adminCode === expectedAdminCode;
  }
  return true;
}, {
  message: "Invalid admin registration code",
  path: ["adminCode"]
});

export const loginSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, { message: 'Password is required' }),
});

export const verifyOtpSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim(),
  otp: z.string()
    .length(6, { message: 'OTP must be exactly 6 digits long' })
    .regex(/^[0-9]+$/, { message: 'OTP must contain only numbers' }),
});

export const resendOtpSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim(),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1, { message: 'Google ID Token is required' }),
});
