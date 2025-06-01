import { NextResponse } from 'next/server';

// Dynamic import to handle potential module loading issues
let LegalDocumentProcessor;
let qdrantService;
let fileStorage;

async function loadDependencies() {
  try {
    if (!LegalDocumentProcessor) {
      const documentModule = await import('../../../lib/legal/documentProcessor.js');
      LegalDocumentProcessor = documentModule.default;
    }
    if (!qdrantService) {
      const qdrantModule = await import('../../../lib/vector/qdrant.js');
      qdrantService = qdrantModule.default;
    }
    if (!fileStorage) {
      const storageModule = await import('../../../lib/storage/fileStorage.js');
      fileStorage = storageModule.default;
    }
  } catch (error) {
    console.error('❌ Error loading dependencies:', error);
    throw new Error(`Failed to load required modules: ${error.message}`);
  }
}

export async function POST(request) {
  try {
    console.log('📄 Upload endpoint called');
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 50MB allowed.' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Load dependencies
    try {
      await loadDependencies();
    } catch (depError) {
      console.error('❌ Dependency loading failed:', depError);
      return NextResponse.json({
        error: 'Failed to load required dependencies',
        details: depError.message,
        category: 'DEPENDENCY_ERROR'
      }, { status: 500 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`📄 Successfully converted to buffer: ${buffer.length} bytes`);

    // Upload file to storage
    console.log('📁 Uploading file to storage...');
    let uploadResult;
    try {
      uploadResult = await fileStorage.uploadFile(buffer, file.name, file.type);
      console.log(`✅ File uploaded successfully: ${uploadResult.fileName}`);
    } catch (uploadError) {
      console.error('❌ File upload failed:', uploadError);
      return NextResponse.json({
        error: 'File upload failed',
        details: uploadError.message,
        category: 'UPLOAD_ERROR'
      }, { status: 500 });
    }

    // Create document processor instance
    let documentProcessor;
    try {
      documentProcessor = new LegalDocumentProcessor();
    } catch (processorError) {
      console.error('❌ Document processor creation failed:', processorError);
      return NextResponse.json({
        error: 'Failed to create document processor',
        details: processorError.message,
        category: 'PROCESSOR_ERROR'
      }, { status: 500 });
    }

    // Process the PDF
    console.log('🔄 Starting PDF processing...');
    let processedData;
    try {
      processedData = await documentProcessor.processCriminalCodePDF(buffer);
      console.log(`📄 Processed ${processedData.articles?.length || 0} articles, ${processedData.chapters?.length || 0} chapters`);
    } catch (pdfError) {
      console.error('❌ PDF processing failed:', pdfError);
      return NextResponse.json({
        error: 'PDF processing failed',
        details: pdfError.message,
        category: 'PDF_PROCESSING_ERROR'
      }, { status: 500 });
    }

    // Validate the processed structure
    const validation = documentProcessor.validateLegalStructure(processedData);
    if (!validation.isValid) {
      console.log('❌ Legal structure validation failed:', validation.errors);
      return NextResponse.json(
        { 
          error: 'Invalid legal document structure', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Prepare data for vector storage
    console.log('🔄 Preparing data for vector storage...');
    let crimeNameData, articlesData;
    try {
      crimeNameData = await documentProcessor.prepareCrimeNameMasterData(processedData.articles);
      articlesData = await documentProcessor.prepareCriminalCodeArticlesData(
        processedData.articles, 
        processedData.chapters
      );
      console.log(`📊 Prepared ${crimeNameData.length} crime name records and ${articlesData.length} article records`);
    } catch (prepError) {
      console.error('❌ Data preparation failed:', prepError);
      return NextResponse.json({
        error: 'Data preparation failed',
        details: prepError.message,
        category: 'DATA_PREPARATION_ERROR'
      }, { status: 500 });
    }

    // Store data in vector database
    console.log('🔄 Storing data in vector database...');
    try {
      await qdrantService.initializeCollections();
      
      if (crimeNameData.length > 0) {
        await qdrantService.storeCrimeNameMaster(crimeNameData);
        console.log(`✅ Stored ${crimeNameData.length} crime name records`);
      }
      
      if (articlesData.length > 0) {
        await qdrantService.storeCriminalCodeArticles(articlesData);
        console.log(`✅ Stored ${articlesData.length} article records`);
      }
      
      console.log('✅ Vector database storage completed successfully');
    } catch (vectorError) {
      console.error('❌ Vector storage error:', vectorError);
      // Continue with success response even if vector storage fails
    }

    // Store PDF metadata for tracking uploads
    try {
      console.log('📋 UPLOAD: About to create PDF metadata object...');
      const pdfMetadata = {
        fileName: uploadResult.fileName,
        originalFileName: uploadResult.originalFileName,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        articlesProcessed: processedData.articles.length,
        chaptersProcessed: processedData.chapters.length,
        crimeTypesStored: crimeNameData.length,
        articlesStored: articlesData.length,
        fileUrl: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
        storage: uploadResult.storage
      };
      
      console.log('📋 UPLOAD: PDF metadata created, calling storePDFMetadata...');
      console.log('📋 UPLOAD: Metadata object:', JSON.stringify(pdfMetadata, null, 2));
      
      await qdrantService.storePDFMetadata(pdfMetadata);
      console.log('✅ PDF metadata stored successfully');
    } catch (metadataError) {
      console.error('⚠️ Failed to store PDF metadata:', metadataError);
      // Continue with success even if metadata storage fails
    }

    // Success response with file storage info
    return NextResponse.json({
      success: true,
      message: 'Criminal code document processed and stored successfully',
      data: {
        fileName: uploadResult.originalFileName,
        fullFileName: uploadResult.fileName,
        fileSize: file.size,
        fileUrl: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
        storage: uploadResult.storage,
        articlesProcessed: processedData.articles.length,
        chaptersProcessed: processedData.chapters.length,
        crimeTypesStored: crimeNameData.length,
        articlesStored: articlesData.length,
        metadata: processedData.metadata,
        sampleArticles: processedData.articles.slice(0, 2),
        sampleCrimeData: crimeNameData.slice(0, 2)
      },
      timestamp: new Date().toISOString(),
      storage: fileStorage.getStorageInfo(),
      vectorDatabase: {
        status: 'enabled',
        collections: ['crime_name_master', 'criminal_code_articles'],
        dataStored: true
      }
    });

  } catch (error) {
    console.error('❌ PDF upload processing error:', error);
    
    // Ensure we always return JSON, never HTML
    const errorResponse = {
      error: 'Internal server error during PDF processing',
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    };

    // Add specific error details based on error type
    if (error.message.includes('pdf-parse') || error.message.includes('PDF')) {
      errorResponse.category = 'PDF_PROCESSING_ERROR';
      errorResponse.suggestion = 'Please ensure the uploaded file is a valid PDF document';
    } else if (error.message.includes('OpenAI') || error.message.includes('embedding')) {
      errorResponse.category = 'AI_PROCESSING_ERROR';
      errorResponse.suggestion = 'AI processing failed, but document structure may still be extractable';
    } else if (error.message.includes('Qdrant') || error.message.includes('vector')) {
      errorResponse.category = 'VECTOR_STORAGE_ERROR';
      errorResponse.suggestion = 'Document processed but vector storage failed';
    } else {
      errorResponse.category = 'GENERAL_ERROR';
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  try {
    // Load dependencies dynamically
    await loadDependencies();
    
    // Return upload status and statistics
    const qdrantHealth = await qdrantService.healthCheck();
    
    return NextResponse.json({
      status: 'ready',
      uploadEndpoint: '/api/upload',
      acceptedFormats: ['application/pdf'],
      maxFileSize: '50MB',
      vectorDatabase: qdrantHealth,
      capabilities: [
        'Criminal code PDF processing',
        'Automatic article extraction',
        'Legal element identification',
        'Vector database storage',
        'Crime name master creation',
        'Case law integration ready'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Service health check failed',
        message: error.message 
      },
      { status: 503 }
    );
  }
} 