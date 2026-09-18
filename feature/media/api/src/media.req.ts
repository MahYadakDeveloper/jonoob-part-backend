import { Readable } from 'node:stream';

/**
 * Upload input.
 */
export type UploadFileRequest = {
  /** Logical storage path, not a physical bucket key. */
  path: string;

  fileName: string;
  mimeType: string;
  size?: number;

  /** File content (Buffer, stream, etc.). */
  body: Buffer | Readable;
};

export type UploadManyFilesRequest = {
  files: UploadFileRequest[];
};

/**
 * Delete request.
 */
export type DeleteMediaRequest = {
  fileId: string;
};

export type DeleteManyMediaRequest = {
  fileIds: string[];
};

/**
 * Public URL request.
 */
export type GetMediaUrlRequest = {
  fileId: string;
};

/**
 * Signed URL request.
 */
export type GetSignedMediaUrlRequest = {
  fileId: string;

  /** URL lifetime in seconds. */
  expiresInSeconds: number;
};
