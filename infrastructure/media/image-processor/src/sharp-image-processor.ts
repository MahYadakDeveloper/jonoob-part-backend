import { ImageMimeType } from '@feature/media-api';
import {
  CompressImageOptions,
  ImageFormat,
  ImageProcessor,
  ProcessedImage,
  ResizeImageOptions,
} from '@feature/media-image';
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class SharpImageProcessor implements ImageProcessor {
  async resize(file: Buffer, options: ResizeImageOptions): Promise<ProcessedImage> {
    const processor = sharp(file);
    const metadata = await processor.metadata();

    const output = await processor
      .resize({
        width: options.width,
        height: options.height,
        fit: options.fit,
        withoutEnlargement: options.withoutEnlargement,
      })
      .toBuffer();

    return {
      mimeType: this.toMimeType(metadata.format),
      file: output,
      size: output.length,
    };
  }

  async compress(file: Buffer, options: CompressImageOptions): Promise<ProcessedImage> {
    const output = await this.toFormat(sharp(file), options.format, options.quality);

    return {
      mimeType: this.toMimeType(options.format),
      file: output,
      size: output.length,
    };
  }

  private toMimeType(format: string | undefined): ImageMimeType {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';

      case 'png':
        return 'image/png';

      case 'webp':
        return 'image/webp';

      case 'avif':
        return 'image/avif';

      default:
        throw new Error(`Unsupported image format: ${format}`);
    }
  }

  private toFormat(image: sharp.Sharp, format: ImageFormat, quality?: number): Promise<Buffer> {
    switch (format) {
      case 'jpeg':
        return image.jpeg({ quality }).toBuffer();

      case 'png':
        return image.png().toBuffer();

      case 'webp':
        return image.webp({ quality }).toBuffer();

      case 'avif':
        return image.avif({ quality }).toBuffer();
    }
  }
}
