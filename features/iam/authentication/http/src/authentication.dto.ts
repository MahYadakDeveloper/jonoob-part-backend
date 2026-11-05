import { phone } from '@feature/shared/zod/schema';
import { z } from 'zod';

// ---------- Reusable fields ----------

const otp = z.string().regex(/^\d{4}$/, 'otp must be 4 digits');

// three base64url segments separated by dots
const jwt = z.string().regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'must be a valid JWT');

// ---------- Schemas ----------

export const requestOtpSchema = z.object({ phone }).strict();

export const verifyOtpSchema = z.object({ challengeToken: jwt, otp }).strict();

export const managerSignInSchema = z
  .object({
    verifyToken: jwt,
    password: z.string().min(1).max(32),
  })
  .strict();

export const adminSignInSchema = z
  .object({
    verifyToken: jwt,
    secretKey: z.string().min(1).max(256),
  })
  .strict();

export const refreshSchema = z.object({ refreshToken: jwt }).strict();

// ---------- Inferred types ----------

export interface RequestOtpDto extends z.infer<typeof requestOtpSchema> {}
export interface VerifyOtpDto extends z.infer<typeof verifyOtpSchema> {}
export interface ManagerSignInDto extends z.infer<typeof managerSignInSchema> {}
export interface AdminSignInDto extends z.infer<typeof adminSignInSchema> {}
export interface RefreshDto extends z.infer<typeof refreshSchema> {}
