import '@fastify/multipart';
import { UploadFileRequest } from '@feature/media-api';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Readable } from 'node:stream';

export const UploadedMediaFile = createParamDecorator(
  async (path: string, ctx: ExecutionContext): Promise<UploadFileRequest> => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();

    // [NOTE] If req.file() or req.parts() is not recognized by the TypeScript
    // compiler, check for a version mismatch between fastify and
    // @fastify/multipart.
    const file = await req.file();

    if (!file) {
      throw new Error('Media file is required.');
    }

    const body = Readable.from(file.file);

    return {
      path,
      fileName: file.filename,
      mimeType: file.mimetype,
      body,
    };
  },
);
