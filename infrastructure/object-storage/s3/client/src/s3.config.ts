import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  S3_REGION: z.string().min(1),
  S3_ENDPOINT: z.url().optional(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
});

export default registerAs('s3-client', () => {
  const result = schema.parse(process.env);
  return {
    region: result.S3_REGION,
    endpoint: result.S3_ENDPOINT,
    accessKeyId: result.S3_ACCESS_KEY_ID,
    secretAccessKey: result.S3_SECRET_ACCESS_KEY,
  };
});
