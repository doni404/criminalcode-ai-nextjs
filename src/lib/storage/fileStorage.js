import { put, del, list } from '@vercel/blob';
import { writeFile, readdir, stat, access, unlink, mkdir } from 'fs/promises';
import path from 'path';

class FileStorageService {
  constructor() {
    // Detect environment
    this.isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    this.isServerless = this.isVercel;
    this.hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    console.log(`📁 Storage mode: ${this.getStorageMode()}`);
  }

  getStorageMode() {
    if (this.isServerless && this.hasBlobToken) return 'Vercel Blob (serverless)';
    if (this.isServerless) return 'Local fallback (Blob not configured)';
    return 'Local filesystem';
  }

  async uploadFile(buffer, fileName, contentType = 'application/pdf') {
    if (this.isServerless && this.hasBlobToken) {
      return await this.uploadToBlob(buffer, fileName, contentType);
    } else {
      return await this.uploadToLocal(buffer, fileName);
    }
  }

  async uploadToBlob(buffer, fileName, contentType) {
    try {
      const uniqueFileName = `${Date.now()}_${fileName}`;
      
      const blob = await put(uniqueFileName, buffer, {
        access: 'public',
        contentType: contentType,
      });

      console.log(`📤 Uploaded to Vercel Blob: ${blob.url}`);
      
      return {
        success: true,
        fileName: uniqueFileName,
        originalFileName: fileName,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        storage: 'blob'
      };
    } catch (error) {
      console.error('❌ Blob upload failed:', error);
      throw new Error(`Blob upload failed: ${error.message}`);
    }
  }

  async uploadToLocal(buffer, fileName) {
    try {
      const uniqueFileName = `${Date.now()}_${fileName}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      await mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, uniqueFileName);
      await writeFile(filePath, buffer);

      console.log(`📤 Uploaded to local filesystem: ${filePath}`);
      
      return {
        success: true,
        fileName: uniqueFileName,
        originalFileName: fileName,
        url: `/uploads/${uniqueFileName}`,
        downloadUrl: `/uploads/${uniqueFileName}`,
        storage: this.isServerless ? 'local-fallback' : 'local'
      };
    } catch (error) {
      console.error('❌ Local upload failed:', error);
      throw new Error(`Local upload failed: ${error.message}`);
    }
  }

  async listFiles() {
    if (this.isServerless && this.hasBlobToken) {
      return await this.listBlobFiles();
    } else {
      return await this.listLocalFiles();
    }
  }

  async listBlobFiles() {
    try {
      const { blobs } = await list();
      
      const pdfBlobs = blobs.filter(blob => 
        blob.pathname.toLowerCase().endsWith('.pdf')
      );

      return pdfBlobs.map(blob => {
        const timestampMatch = blob.pathname.match(/^(\d+)_(.+)$/);
        const originalFileName = timestampMatch ? timestampMatch[2] : blob.pathname;
        const uploadTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

        return {
          id: blob.pathname.replace(/\.[^/.]+$/, ""),
          fileName: originalFileName,
          fullFileName: blob.pathname,
          size: blob.size,
          uploadDate: new Date(uploadTimestamp).toISOString(),
          isEnabled: true,
          vectorStatus: 'processed',
          fileUrl: blob.url,
          downloadUrl: blob.downloadUrl,
          storage: 'blob'
        };
      });
    } catch (error) {
      console.error('❌ Error listing blob files:', error);
      return [];
    }
  }

  async listLocalFiles() {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      try {
        await access(uploadsDir);
      } catch {
        return [];
      }

      const files = await readdir(uploadsDir);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      const pdfs = await Promise.all(
        pdfFiles.map(async (fileName) => {
          const filePath = path.join(uploadsDir, fileName);
          const stats = await stat(filePath);
          
          const timestampMatch = fileName.match(/^(\d+)_(.+)$/);
          const originalFileName = timestampMatch ? timestampMatch[2] : fileName;
          const uploadTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : stats.birthtime.getTime();
          
          return {
            id: fileName.replace(/\.[^/.]+$/, ""),
            fileName: originalFileName,
            fullFileName: fileName,
            size: stats.size,
            uploadDate: new Date(uploadTimestamp).toISOString(),
            isEnabled: true,
            vectorStatus: 'processed',
            fileUrl: `/uploads/${fileName}`,
            downloadUrl: `/uploads/${fileName}`,
            storage: this.isServerless ? 'local-fallback' : 'local'
          };
        })
      );

      return pdfs;
    } catch (error) {
      console.error('❌ Error listing local files:', error);
      return [];
    }
  }

  async deleteFile(fileName) {
    if (this.isServerless && this.hasBlobToken) {
      return await this.deleteBlobFile(fileName);
    } else {
      return await this.deleteLocalFile(fileName);
    }
  }

  async deleteBlobFile(fileName) {
    try {
      await del(fileName);
      console.log(`🗑️ Deleted from Vercel Blob: ${fileName}`);
      return { success: true, message: `File ${fileName} deleted from blob storage` };
    } catch (error) {
      console.error('❌ Error deleting blob file:', error);
      return { success: false, message: `Failed to delete blob file: ${error.message}` };
    }
  }

  async deleteLocalFile(fileName) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadsDir, fileName);
      
      try {
        await access(filePath);
        await unlink(filePath);
        console.log(`🗑️ Deleted from local filesystem: ${filePath}`);
        return { success: true, message: `File ${fileName} deleted successfully` };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return { success: true, message: `File ${fileName} was already deleted or doesn't exist` };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error deleting local file:', error);
      return { success: false, message: `Failed to delete local file: ${error.message}` };
    }
  }

  getStorageInfo() {
    return {
      type: this.isServerless && this.hasBlobToken ? 'blob' : 
            this.isServerless ? 'local-fallback' : 'local',
      description: this.getStorageMode(),
      environment: this.isVercel ? 'vercel' : 'local/ec2',
      hasBlobToken: this.hasBlobToken
    };
  }
}

const fileStorage = new FileStorageService();
export default fileStorage; 