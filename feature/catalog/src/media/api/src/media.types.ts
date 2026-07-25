export type MediaRef = {
  /** Stable identifier */
  fileId: string;

  /** Original file name */
  fileName: string;

  mimeType: string;
  size?: number;

  alt?: string;
};
