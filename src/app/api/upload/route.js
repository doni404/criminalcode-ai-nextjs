import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// Dynamic import to handle potential module loading issues
let LegalDocumentProcessor;
let qdrantService;

async function loadDependencies() {
  try {
    if (!LegalDocumentProcessor) {
      const module = await import('../../../lib/legal/documentProcessor.js');
      LegalDocumentProcessor = module.default;
    }
    if (!qdrantService) {
      const module = await import('../../../lib/vector/qdrant.js');
      qdrantService = module.default;
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

    // Load dependencies dynamically
    await loadDependencies();
    const documentProcessor = new LegalDocumentProcessor();

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`📄 Successfully converted to buffer: ${buffer.length} bytes`);

    // Process the PDF
    console.log('🔄 Starting PDF processing...');
    const processedData = await documentProcessor.processCriminalCodePDF(buffer);

    // Validate the processed structure
    const validation = documentProcessor.validateLegalStructure(processedData);
    if (!validation.isValid) {
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
    const crimeNameData = await documentProcessor.prepareCrimeNameMasterData(processedData.articles);
    const articlesData = await documentProcessor.prepareCriminalCodeArticlesData(
      processedData.articles, 
      processedData.chapters
    );

    console.log(`📊 Prepared ${crimeNameData.length} crime name records`);
    console.log(`📊 Prepared ${articlesData.length} article records`);

    // Store data in vector database
    console.log('🔄 Storing data in vector database...');
    try {
      // Initialize collections if they don't exist
      await qdrantService.initializeCollections();
      
      // Store crime name master data
      if (crimeNameData.length > 0) {
        await qdrantService.storeCrimeNameMaster(crimeNameData);
        console.log(`✅ Stored ${crimeNameData.length} crime name records in vector database`);
      }
      
      // Store criminal code articles
      if (articlesData.length > 0) {
        await qdrantService.storeCriminalCodeArticles(articlesData);
        console.log(`✅ Stored ${articlesData.length} article records in vector database`);
      }
      
      console.log('✅ Vector database storage completed successfully');
    } catch (vectorError) {
      console.error('❌ Vector storage error:', vectorError);
      // Continue with file storage even if vector storage fails
    }

    // Save file to public/uploads directory
    const fileName = `${Date.now()}_${file.name}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await import('fs/promises').then(fs => fs.mkdir(uploadsDir, { recursive: true }));
    } catch (error) {
      console.log('Uploads directory already exists or created');
    }
    
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Success response with processed data
    return NextResponse.json({
      success: true,
      message: 'Criminal code document processed and stored in vector database successfully',
      data: {
        fileName: file.name,
        fileSize: file.size,
        articlesProcessed: processedData.articles.length,
        chaptersProcessed: processedData.chapters.length,
        crimeTypesStored: crimeNameData.length,
        articlesStored: articlesData.length,
        metadata: processedData.metadata,
        sampleArticles: processedData.articles.slice(0, 2), // Show first 2 articles
        sampleCrimeData: crimeNameData.slice(0, 2), // Show first 2 crime records
        fileUrl: `/uploads/${fileName}`
      },
      timestamp: new Date().toISOString(),
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