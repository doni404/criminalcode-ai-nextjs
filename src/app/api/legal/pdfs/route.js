import { NextResponse } from 'next/server';
import { readdir, stat, access, unlink } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Check if uploads directory exists
    try {
      await access(uploadsDir);
    } catch {
      // Directory doesn't exist, return empty list
      return NextResponse.json({
        success: true,
        pdfs: [],
        message: 'No uploads directory found'
      });
    }

    // Read all files in uploads directory
    const files = await readdir(uploadsDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    // Get file stats for each PDF
    const pdfs = await Promise.all(
      pdfFiles.map(async (fileName) => {
        const filePath = path.join(uploadsDir, fileName);
        const stats = await stat(filePath);
        
        // Extract timestamp from filename if it exists (format: timestamp_filename.pdf)
        const timestampMatch = fileName.match(/^(\d+)_(.+)$/);
        const originalFileName = timestampMatch ? timestampMatch[2] : fileName;
        const uploadTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : stats.birthtime.getTime();
        
        return {
          id: fileName.replace(/\.[^/.]+$/, ""), // Use filename without extension as ID
          fileName: originalFileName,
          fullFileName: fileName,
          size: stats.size,
          uploadDate: new Date(uploadTimestamp).toISOString(),
          isEnabled: true, // Default to enabled, will be overridden by localStorage on client
          vectorStatus: 'processed',
          fileUrl: `/uploads/${fileName}`,
          articlesProcessed: 0, // This could be enhanced to read from metadata
          chaptersProcessed: 0
        };
      })
    );

    // Sort by upload date (newest first)
    pdfs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    return NextResponse.json({
      success: true,
      pdfs,
      count: pdfs.length,
      totalSize: pdfs.reduce((sum, pdf) => sum + pdf.size, 0)
    });

  } catch (error) {
    console.error('Error reading PDF files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read PDF files',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, pdfId, enabled } = await request.json();

    switch (action) {
      case 'toggle':
        // In a real implementation, this would update a database
        // For now, we'll just return success since the client handles state
        return NextResponse.json({
          success: true,
          message: `PDF ${enabled ? 'enabled' : 'disabled'} for vector database`,
          pdfId,
          enabled
        });

      case 'delete':
        // In a real implementation, this would delete the file
        // For now, just return success
        return NextResponse.json({
          success: true,
          message: 'PDF marked for deletion',
          pdfId
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage PDF',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { fileName } = await request.json();
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadsDir, fileName);
    
    try {
      // Check if file exists
      await access(filePath);
      
      // Delete the file
      await unlink(filePath);
      
      console.log(`🗑️ Successfully deleted file: ${fileName}`);
      
      return NextResponse.json({
        success: true,
        message: `File ${fileName} deleted successfully`
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          message: `File ${fileName} was already deleted or doesn't exist`
        });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error deleting PDF file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete PDF file',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 