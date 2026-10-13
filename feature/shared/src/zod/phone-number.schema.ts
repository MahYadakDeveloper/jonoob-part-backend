import { z } from 'zod';

export const phoneNumberSchema = z.string().regex(/^09\d{9}$/);
