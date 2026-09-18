import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import s3Config from './s3.config';
import { S3_CLIENT } from './s3.tokens';

@Module({
  imports: [ConfigModule.forFeature(s3Config)],
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: (config: ConfigType<typeof s3Config>) => {
        return new S3Client({
          region: config.region,
          ...(config.endpoint
            ? {
                endpoint: config.endpoint,
              }
            : {}),
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        });
      },
      inject: [s3Config.KEY],
    },
  ],
  exports: [S3_CLIENT],
})
export class S3ClientModule {}
