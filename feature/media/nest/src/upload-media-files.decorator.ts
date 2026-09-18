import '@fastify/multipart';
import { UploadFileRequest, UploadManyFilesRequest } from '@feature/media-api';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Readable } from 'node:stream';

export const UploadedMediaFiles = createParamDecorator(
  async (path: string, ctx: ExecutionContext): Promise<UploadManyFilesRequest> => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();

    // [NOTE] If req.files() or req.parts() is not recognized by the TypeScript
    // compiler, check for a version mismatch between fastify and
    // @fastify/multipart.
    const files: UploadFileRequest[] = [];

    for await (const file of req.files()) {
      files.push({
        path,
        fileName: file.filename,
        mimeType: file.mimetype,
        body: Readable.from(file.file),
      });
    }

    if (files.length === 0) {
      throw new Error('At least one media file is required.');
    }

    return {
      files,
    };
  },
);
