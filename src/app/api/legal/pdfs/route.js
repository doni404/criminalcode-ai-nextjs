import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Load dependencies dynamically
    const qdrantModule = await import('../../../../lib/vector/qdrant.js');
    const qdrantService = qdrantModule.default;
    
    const storageModule = await import('../../../../lib/storage/fileStorage.js');
    const fileStorage = storageModule.default;
    
    // Get PDF metadata from vector database and storage
    let pdfs = [];
    let storageInfo = fileStorage.getStorageInfo();
    
    try {
      // First try to get PDFs from storage service
      const storagePdfs = await fileStorage.listFiles();
      console.log(`📁 Found ${storagePdfs.length} PDFs in storage`);
      
      // Get PDF metadata from vector database (re-enabled with proper API key)
      const vectorPdfs = await qdrantService.getPDFMetadata();
      console.log(`📊 Found ${vectorPdfs.length} PDFs in vector database`);
      
      // Merge storage and vector data
      pdfs = storagePdfs.map(storagePdf => {
        // Find matching vector metadata
        const vectorMatch = vectorPdfs.find(vectorPdf => 
          vectorPdf.fullFileName === storagePdf.fullFileName ||
          vectorPdf.fileName === storagePdf.fullFileName
        );
        
        return {
          id: storagePdf.id,
          fileName: storagePdf.fileName,
          fullFileName: storagePdf.fullFileName,
          size: storagePdf.size,
          uploadDate: storagePdf.uploadDate,
          isEnabled: true,
          vectorStatus: vectorMatch ? 'processed' : 'pending',
          fileUrl: storagePdf.fileUrl,
          downloadUrl: storagePdf.downloadUrl,
          viewerUrl: storageInfo.type === 'blob' 
            ? `/pdfjs/web/viewer.html?file=${encodeURIComponent(storagePdf.downloadUrl)}`
            : `/pdfjs/web/viewer.html?file=${encodeURIComponent(storagePdf.fileUrl)}`,
          storage: storagePdf.storage,
          articlesProcessed: vectorMatch?.articlesProcessed || 0,
          chaptersProcessed: vectorMatch?.chaptersProcessed || 0,
          crimeTypesStored: vectorMatch?.crimeTypesStored || 0,
          articlesStored: vectorMatch?.articlesStored || 0
        };
      });
      
    } catch (error) {
      console.error('Error reading PDF metadata:', error);
      
      // Provide helpful error message with current storage info
      return NextResponse.json({
        success: false,
        pdfs: [],
        message: 'Unable to retrieve PDF list',
        error: error.message,
        storageInfo,
        troubleshooting: {
          issue: error.message.includes('Forbidden') ? 'Qdrant access forbidden' : 'Storage access error',
          solution: error.message.includes('Forbidden') 
            ? 'Check Qdrant API key configuration in environment variables'
            : 'Check storage service configuration',
          environment: storageInfo.environment,
          hasBlob: storageInfo.hasBlobToken
        },
        count: 0,
        totalSize: 0,
        note: `Storage mode: ${storageInfo.description}`
      }, { status: 500 });
    }
    
    // Sort by upload date (newest first)
    pdfs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    return NextResponse.json({
      success: true,
      pdfs,
      message: pdfs.length > 0 
        ? `Found ${pdfs.length} PDF(s) in ${storageInfo.description.toLowerCase()}` 
        : 'No PDFs found',
      count: pdfs.length,
      totalSize: pdfs.reduce((sum, pdf) => sum + (pdf.size || 0), 0),
      storageInfo,
      features: {
        upload: true,
        download: true,
        view: true,
        delete: true,
        vectorSearch: true
      }
    });

  } catch (error) {
    console.error('❌ PDF list endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      pdfs: [],
      message: 'Failed to retrieve PDF list',
      error: error.message,
      count: 0,
      totalSize: 0,
      note: 'API endpoint error'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, pdfId, enabled } = await request.json();

    switch (action) {
      case 'toggle':
        return NextResponse.json({
          success: true,
          message: `PDF ${enabled ? 'enabled' : 'disabled'} for vector database`,
          pdfId,
          enabled,
          note: 'Vector database state managed separately'
        });

      case 'delete':
        return NextResponse.json({
          success: true,
          message: 'PDF marked for deletion',
          pdfId,
          note: 'File system storage not available in serverless deployment'
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
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'No file name provided' },
        { status: 400 }
      );
    }

    // Load storage service
    const storageModule = await import('../../../../lib/storage/fileStorage.js');
    const fileStorage = storageModule.default;
    
    // Delete file from storage
    const deleteResult = await fileStorage.deleteFile(fileName);
    
    // Also try to remove from vector database if needed
    try {
      const qdrantModule = await import('../../../../lib/vector/qdrant.js');
      const qdrantService = qdrantModule.default;
      
      // Remove PDF metadata from vector database
      await qdrantService.deletePDFMetadata(fileName);
      console.log(`🗑️ Removed PDF metadata from vector database: ${fileName}`);
    } catch (vectorError) {
      console.warn('⚠️ Could not remove from vector database:', vectorError.message);
    }

    if (deleteResult.success) {
      return NextResponse.json({
        success: true,
        message: deleteResult.message,
        fileName: fileName
      });
    } else {
      return NextResponse.json({
        success: false,
        message: deleteResult.message,
        fileName: fileName
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error deleting PDF file:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to delete file: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
} 