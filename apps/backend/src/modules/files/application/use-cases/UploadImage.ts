import { ImageProcessor } from '../../infrastructure/image/ImageProcessor';
import { AppError } from '@/core/errors/AppError';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export class UploadImage {
  private readonly imageProcessor: ImageProcessor;
  private readonly uploadDir: string;

  constructor(uploadDir: string) {
    this.imageProcessor = new ImageProcessor();
    this.uploadDir = uploadDir;
  }

  async execute(file: File): Promise<{ filename: string; url: string }> {
    if (!file.type.startsWith('image/')) {
      throw new AppError('Only images are allowed', 400, 'INVALID_FILE_TYPE');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    try {
      const processedBuffer = await this.imageProcessor.resize(buffer);
      const metadata = await this.imageProcessor.getInfo(processedBuffer);
      
      const extension = metadata.format || 'jpg';
      const filename = `${randomUUID()}.${extension}`;
      const filePath = path.join(this.uploadDir, filename);

      await writeFile(filePath, processedBuffer);

      return {
        filename,
          url: `${process.env.SOURCE_URL || 'http://localhost:3000'}/files/${filename}`
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new AppError('Failed to process image', 500, 'IMAGE_PROCESSING_FAILED');
    }
  }
}
