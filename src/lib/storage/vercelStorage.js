// Vercel-compatible file storage handler
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class VercelStorage {
  constructor() {
    // In production, you might want to use external storage like AWS S3, Cloudinary, etc.
    this.isProduction = process.env.NODE_ENV === 'production';
    this.uploadDir = this.isProduction ? '/tmp/uploads' : join(process.cwd(), 'public', 'uploads');
  }

  async ensureUploadDirectory() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(filename, buffer) {
    await this.ensureUploadDirectory();
    const filePath = join(this.uploadDir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }

  getFileUrl(filename) {
    if (this.isProduction) {
      // In production, files in /tmp are temporary
      // Consider using external storage for persistence
      console.warn('⚠️ File stored in /tmp - consider external storage for production');
      return `/api/files/${filename}`;
    }
    return `/uploads/${filename}`;
  }

  // For production, implement external storage
  async uploadToExternalStorage(filename, buffer) {
    // TODO: Implement AWS S3, Cloudinary, or other external storage
    // Example: return await uploadToS3(filename, buffer);
    throw new Error('External storage not implemented yet');
  }
} 