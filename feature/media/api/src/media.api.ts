import {
  DeleteManyMediaRequest,
  DeleteMediaRequest,
  GetMediaUrlRequest,
  GetSignedMediaUrlRequest,
  UploadFileRequest,
  UploadManyFilesRequest,
} from './media.req';
import {
  GetMediaUrlResponse,
  GetSignedMediaUrlResponse,
  UploadFileResponse,
  UploadManyFilesResponse,
} from './media.res';

/**
 * Public contract used by other modules (Catalog, Brand, etc.).
 *
 * This interface hides the storage provider implementation
 * (Amazon S3, MinIO, Cloudflare R2, ...).
 */
export interface MediaApi {
  /**
   * Upload a new file to media storage.
   *
   * Returns a stable fileId that should be stored by domain models.
   */
  upload(request: UploadFileRequest): Promise<UploadFileResponse>;

  /**
   * Upload multiple files to media storage.
   *
   * Returns stable fileIds that should be stored by domain models.
   */
  uploadMany(request: UploadManyFilesRequest): Promise<UploadManyFilesResponse>;

  /**
   * Delete a file by its stable identifier.
   *
   * Implementations may perform a soft delete if the file
   * is still referenced by other entities. [I don't think so, each file uniquely referenced by its mediaRef]
   */
  delete(request: DeleteMediaRequest): Promise<void>;
  deleteMany(request: DeleteManyMediaRequest): Promise<void>;

  /**
   * Resolve a public URL for a stored file.
   *
   * The returned URL may point to a CDN instead of the raw S3 object.
   */
  getPublicUrl(request: GetMediaUrlRequest): Promise<GetMediaUrlResponse>;

  /**
   * Create a temporary signed URL for private files.
   *
   * Keep this method even if you do not need it today.
   */
  getSignedUrl(request: GetSignedMediaUrlRequest): Promise<GetSignedMediaUrlResponse>;
}
