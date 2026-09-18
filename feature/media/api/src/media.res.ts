/**
 * Upload result.
 */
export type UploadFileResponse = {
  /** Stable identifier used by MediaRef. */
  fileId: string;
};

export type UploadManyFilesResponse = {
  files: UploadFileResponse[];
};

/**
 * Public URL response.
 */
export type GetMediaUrlResponse = {
  url: string;
};

/**
 * Signed URL response.
 */
export type GetSignedMediaUrlResponse = {
  url: string;

  expiresAt: Date;
};
