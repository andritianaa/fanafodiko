import { ImageProcessor } from '../../infrastructure/image/ImageProcessor';
import { AppError } from '@/core/errors/AppError';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Vérifie les magic bytes du buffer pour s'assurer que c'est bien une image.
 * Le Content-Type est contrôlé par le client et ne peut pas être fiable seul.
 */
function hasValidImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG : FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // PNG  : 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // GIF  : 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WebP : RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;
  return false;
}

export class UploadImage {
  private readonly imageProcessor: ImageProcessor;
  private readonly uploadDir: string;

  constructor(uploadDir: string) {
    this.imageProcessor = new ImageProcessor();
    this.uploadDir = uploadDir;
  }

  async execute(file: File): Promise<{ filename: string; url: string }> {
    // Crée le dossier uploads s'il n'existe pas encore
    await mkdir(this.uploadDir, { recursive: true });

    // 1. Rejeter les SVG (peuvent contenir du JS → XSS stocké)
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      throw new AppError('Les fichiers SVG ne sont pas autorisés', 400, 'INVALID_FILE_TYPE');
    }

    // 2. Limite de taille : 5 MB
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('Fichier trop volumineux (5 MB maximum)', 400, 'FILE_TOO_LARGE');
    }

    // 3. Premier filtre rapide sur le Content-Type déclaré
    if (!file.type.startsWith('image/')) {
      throw new AppError('Seules les images sont autorisées', 400, 'INVALID_FILE_TYPE');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Validation par magic bytes (le Content-Type peut être falsifié par le client)
    if (!hasValidImageMagicBytes(buffer)) {
      throw new AppError('Le fichier ne correspond pas à une image valide', 400, 'INVALID_FILE_CONTENT');
    }
    
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
