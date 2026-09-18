/**
 * Upload result.
 */
export type UploadFileResponse = {
  /** Stable identifier used by MediaRef. */
  fileId: string;
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
