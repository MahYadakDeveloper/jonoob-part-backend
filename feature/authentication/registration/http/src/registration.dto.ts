import { phone } from '@feature/shared/zod/schema';
import { z } from 'zod';

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]+$/,
    'Password must contain at least one uppercase letter and one number, and only Latin letters and numbers',
  );

export const registerUserSchema = z.object({
  nickname: z.string().min(3).max(16),
  phone,
});

export const resetManagerPasswordSchema = z.object({
  password,
});

export type ResetManagerPasswordDto = z.infer<
  typeof resetManagerPasswordSchema
>;
export type RegisterUserDto = z.infer<typeof registerUserSchema>;
