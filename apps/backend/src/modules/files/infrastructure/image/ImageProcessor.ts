import sharp from 'sharp';

export class ImageProcessor {
  private static readonly MAX_WIDTH = 500;

  async resize(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .resize({ width: ImageProcessor.MAX_WIDTH, withoutEnlargement: true })
      .toBuffer();
  }

  async getInfo(input: Buffer) {
    return sharp(input).metadata();
  }
}
