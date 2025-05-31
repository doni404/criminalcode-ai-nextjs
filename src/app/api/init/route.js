import qdrant from '@/lib/vector/qdrant';

export async function POST() {
  try {
    console.log('🚀 Initializing Qdrant collections...');

    // Just initialize collections first
    await qdrant.initializeCollections();

    return Response.json({
      success: true,
      message: 'Qdrant collections initialized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error initializing Qdrant:', error);
    return Response.json(
      { 
        error: 'Failed to initialize Qdrant collections',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 