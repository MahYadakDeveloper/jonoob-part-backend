import { z } from 'zod';

// ---------- Reusable fields ----------

// Accept local Iranian phone numbers and normalize to E.164.
const phoneNumber = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, 'phoneNumber must be in Iranian local format (09…)')
  .transform((phone) => `+98${phone.slice(1)}`);

// keep in sync with AuthenticationService.otpLength
const otp = z.string().regex(/^\d{4}$/, 'otp must be 4 digits');

// three base64url segments separated by dots
const jwt = z.string().regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'must be a valid JWT');

// ---------- Schemas ----------

export const RequestOtpSchema = z.object({ phoneNumber }).strict();

export const VerifyOtpSchema = z.object({ phoneNumber, otp }).strict();

export const VerifyTokenSchema = z.object({ verifyToken: jwt }).strict();

export const SignUpSchema = z
  .object({
    verifyToken: jwt,
    fullName: z.string().trim().min(2).max(100),
  })
  .strict();

export const PasswordSignInSchema = z
  .object({
    verifyToken: jwt,
    password: z.string().min(1).max(128),
  })
  .strict();

export const AdminSignInSchema = z
  .object({
    verifyToken: jwt,
    secretKey: z.string().min(1).max(256),
  })
  .strict();

export const RefreshSchema = z.object({ refreshToken: jwt }).strict();

export const HashRequestSchema = z.object({ password: z.string() }).strict();

// ---------- Inferred types ----------

export interface RequestOtpDto extends z.infer<typeof RequestOtpSchema> {}
export interface VerifyOtpDto extends z.infer<typeof VerifyOtpSchema> {}
export interface SignUpDto extends z.infer<typeof SignUpSchema> {}
export interface VerifyTokenDto extends z.infer<typeof VerifyTokenSchema> {}
export interface PasswordSignInDto extends z.infer<
  typeof PasswordSignInSchema
> {}
export interface AdminSignInDto extends z.infer<typeof AdminSignInSchema> {}
export interface RefreshDto extends z.infer<typeof RefreshSchema> {}
export interface HashRequestDto extends z.infer<typeof HashRequestSchema> {}
