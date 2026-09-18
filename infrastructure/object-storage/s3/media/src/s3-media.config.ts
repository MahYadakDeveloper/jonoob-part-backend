import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  S3_MEDIA_BUCKET: z.string().min(1),
});

export default registerAs('media', () => {
  const result = schema.parse(process.env);

  return {
    bucket: result.S3_MEDIA_BUCKET,
  };
});
