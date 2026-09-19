import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  DeleteManyMediaRequest,
  DeleteMediaRequest,
  GetMediaUrlRequest,
  GetMediaUrlResponse,
  GetSignedMediaUrlRequest,
  GetSignedMediaUrlResponse,
  MediaApi,
  MediaFileType,
  UploadFileRequest,
  UploadFileResponse,
} from '@feature/media-api';
import { S3_CLIENT } from '@infra/object-storage-s3-client';
import { Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import s3MediaConfig from './s3-media.config';

export class S3Media implements MediaApi {
  constructor(
    @Inject(s3MediaConfig.KEY)
    private config: ConfigType<typeof s3MediaConfig>,
    @Inject(S3_CLIENT)
    private readonly client: S3Client,
  ) {}

  async upload<T extends MediaFileType>(
    request: UploadFileRequest<T>,
  ): Promise<UploadFileResponse> {
    const fileId = crypto.randomUUID();
    const key = `${request.path}/${fileId}-${request.fileName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: request.file,
        ContentType: request.mimeType,
        ContentLength: request.size,
      }),
    );

    return {
      fileId,
    };
  }

  delete(request: DeleteMediaRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteMany(request: DeleteManyMediaRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getPublicUrl(request: GetMediaUrlRequest): Promise<GetMediaUrlResponse> {
    throw new Error('Method not implemented.');
  }
  getSignedUrl(request: GetSignedMediaUrlRequest): Promise<GetSignedMediaUrlResponse> {
    throw new Error('Method not implemented.');
  }
}
