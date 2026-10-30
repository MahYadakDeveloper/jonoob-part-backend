import { z } from 'zod';

// ---------- Reusable fields ----------

// Accept local Iranian phone numbers and normalize to E.164.
const phone = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, 'phone number must be in Iranian local format (09…)')
  .transform((phone) => `+98${phone.slice(1)}`);

// keep in sync with AuthenticationService.otpLength
const otp = z.string().regex(/^\d{4}$/, 'otp must be 4 digits');

// three base64url segments separated by dots
const jwt = z.string().regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'must be a valid JWT');

// ---------- Schemas ----------

export const requestOtpSchema = z.object({ phone }).strict();

export const verifyOtpSchema = z.object({ challengeToken: jwt, otp }).strict();

export const adminSignInSchema = z
  .object({
    verifyToken: jwt,
    secretKey: z.string().min(1).max(256),
  })
  .strict();

export const refreshSchema = z.object({ refreshToken: jwt }).strict();

export const hashRequestSchema = z.object({ password: z.string() }).strict();

// ---------- Inferred types ----------

export interface RequestOtpDto extends z.infer<typeof requestOtpSchema> {}
export interface VerifyOtpDto extends z.infer<typeof verifyOtpSchema> {}
export interface AdminSignInDto extends z.infer<typeof adminSignInSchema> {}
export interface RefreshDto extends z.infer<typeof refreshSchema> {}
export interface HashRequestDto extends z.infer<typeof hashRequestSchema> {}
