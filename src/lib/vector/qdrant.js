import { QdrantClient } from '@qdrant/js-client-rest';

class QdrantService {
  constructor() {
    // Don't instantiate client in constructor to prevent build-time errors
    this.collections = {
      CRIME_NAME_MASTER: 'crime_name_master',
      CASE_LAW_MASTER: 'case_law_master',
      CRIMINAL_CODE_ARTICLES: 'criminal_code_articles'
    };
  }

  // Lazy initialization of Qdrant client
  get client() {
    if (!this._client) {
      this._client = this.createClient();
    }
    return this._client;
  }

  createClient() {
    // Support both local development and cloud deployment
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;
    
    console.log(`🔍 DEBUG: QDRANT_URL = ${qdrantUrl ? '[SET]' : '[NOT SET]'}`);
    console.log(`🔍 DEBUG: QDRANT_API_KEY = ${qdrantApiKey ? '[SET - length ' + qdrantApiKey.length + ']' : '[NOT SET]'}`);
    
    if (qdrantUrl && (qdrantUrl.startsWith('http://') || qdrantUrl.startsWith('https://'))) {
      // Cloud configuration - use full URL with proper protocol
      console.log(`🌐 Connecting to Qdrant Cloud: ${qdrantUrl}`);
      
      // Ensure API key is properly formatted for Qdrant Cloud
      if (!qdrantApiKey) {
        throw new Error('QDRANT_API_KEY is required for Qdrant Cloud');
      }
      
      // Use simplified connection format as recommended by Qdrant docs
      return new QdrantClient({
        url: qdrantUrl,
        apiKey: qdrantApiKey
      });
    } else {
      // Local development configuration
      const host = process.env.QDRANT_HOST || 'localhost';
      const port = parseInt(process.env.QDRANT_PORT || '6333');
      console.log(`🏠 Connecting to local Qdrant: ${host}:${port}`);
      return new QdrantClient({
        host: host,
        port: port,
        apiKey: qdrantApiKey || undefined
      });
    }
  }

  async initializeCollections() {
    try {
      // Initialize Crime Name Master collection
      await this.createCollection(this.collections.CRIME_NAME_MASTER, {
        vectors: {
          size: 1536, // OpenAI embedding size
          distance: 'Cosine'
        }
      });

      // Initialize Case Law Master collection
      await this.createCollection(this.collections.CASE_LAW_MASTER, {
        vectors: {
          size: 1536,
          distance: 'Cosine'
        }
      });

      // Initialize Criminal Code Articles collection
      await this.createCollection(this.collections.CRIMINAL_CODE_ARTICLES, {
        vectors: {
          size: 1536,
          distance: 'Cosine'
        }
      });

      console.log('✅ All Qdrant collections initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Qdrant collections:', error);
      throw error;
    }
  }

  async createCollection(name, config) {
    try {
      // Check if collection already exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(col => col.name === name);
      
      if (!exists) {
        await this.client.createCollection(name, config);
        console.log(`✅ Created collection: ${name}`);
      } else {
        console.log(`📁 Collection already exists: ${name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating collection ${name}:`, error);
      throw error;
    }
  }

  // Store Crime Name Master data
  async storeCrimeNameMaster(crimeData) {
    const points = crimeData.map((crime, index) => ({
      id: Date.now() + index,
      vector: crime.embedding,
      payload: {
        type: 'crime_name_master',
        crime_name: crime.name,
        article_number: crime.articleNumber,
        constituent_elements: crime.constituentElements,
        definitions: crime.definitions,
        related_terms: crime.relatedTerms,
        penalty: crime.penalty,
        page: crime.page || 1,
        created_at: new Date().toISOString()
      }
    }));

    await this.client.upsert(this.collections.CRIME_NAME_MASTER, {
      wait: true,
      points
    });

    console.log(`✅ Stored ${points.length} crime name master records`);
  }

  // Store Case Law Master data
  async storeCaseLawMaster(caseData) {
    const points = caseData.map((caseItem, index) => ({
      id: Date.now() + index + 2000, // Use numeric ID with offset
      vector: caseItem.embedding,
      payload: {
        type: 'case_law_master',
        court: caseItem.court,
        date: caseItem.date,
        case_number: caseItem.caseNumber,
        crime_type: caseItem.crimeType,
        constituent_analysis: caseItem.constituentAnalysis,
        judgment: caseItem.judgment,
        precedent_value: caseItem.precedentValue,
        created_at: new Date().toISOString()
      }
    }));

    await this.client.upsert(this.collections.CASE_LAW_MASTER, {
      wait: true,
      points
    });

    console.log(`✅ Stored ${points.length} case law master records`);
  }

  // Store Criminal Code Articles
  async storeCriminalCodeArticles(articlesData) {
    const points = articlesData.map((article, index) => ({
      id: Date.now() + index + 1000, // Use numeric ID with offset to avoid conflicts
      vector: article.embedding,
      payload: {
        type: 'criminal_code_article',
        article_number: article.number,
        title: article.title,
        content: article.content,
        chapter: article.chapter,
        section: article.section,
        keywords: article.keywords,
        page: article.page || 1,
        penalty: article.penalty || 'Penalty not specified',
        created_at: new Date().toISOString()
      }
    }));

    await this.client.upsert(this.collections.CRIMINAL_CODE_ARTICLES, {
      wait: true,
      points
    });

    console.log(`✅ Stored ${points.length} criminal code articles`);
  }

  // Store PDF metadata
  async storePDFMetadata(pdfMetadata) {
    try {
      console.log('📋 PDF metadata storage STARTED');
      console.log('📋 Metadata to store:', JSON.stringify(pdfMetadata, null, 2));
      
      // Use a simple embedding for PDF metadata (just zeros since we don't need semantic search)
      const dummyVector = new Array(1536).fill(0);
      
      const point = {
        id: Date.now() + Math.floor(Math.random() * 1000), // Unique ID
        vector: dummyVector,
        payload: {
          type: 'pdf_metadata',
          file_name: pdfMetadata.fileName,
          original_file_name: pdfMetadata.originalFileName,
          file_size: pdfMetadata.fileSize,
          upload_date: pdfMetadata.uploadDate,
          articles_processed: pdfMetadata.articlesProcessed,
          chapters_processed: pdfMetadata.chaptersProcessed,
          crime_types_stored: pdfMetadata.crimeTypesStored,
          articles_stored: pdfMetadata.articlesStored,
          created_at: new Date().toISOString()
        }
      };

      console.log('📋 Point to upsert:', JSON.stringify(point, null, 2));
      console.log('📋 About to call upsert...');
      
      const result = await this.client.upsert(this.collections.CRIMINAL_CODE_ARTICLES, {
        wait: true,
        points: [point]
      });

      console.log('📋 Upsert result:', result);
      console.log('📋 Upsert completed successfully');
      
      // Add longer delay for Qdrant Cloud consistency
      console.log('📋 Waiting for consistency...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
      console.log('📋 Consistency wait complete');
      
      // Verify the data was stored by immediately querying for it
      console.log('📋 VERIFICATION: Checking if metadata was actually stored...');
      try {
        const verifyResult = await this.client.scroll(this.collections.CRIMINAL_CODE_ARTICLES, {
          with_payload: true,
          limit: 100,
          filter: {
            must: [
              {
                key: 'type',
                match: { value: 'pdf_metadata' }
              },
              {
                key: 'file_name',
                match: { value: pdfMetadata.fileName }
              }
            ]
          }
        });
        
        console.log(`📋 VERIFICATION: Found ${verifyResult.points.length} matching metadata entries`);
        if (verifyResult.points.length > 0) {
          console.log('📋 VERIFICATION: Metadata successfully stored and retrievable');
          console.log('📋 VERIFICATION: Stored data:', JSON.stringify(verifyResult.points[0].payload, null, 2));
        } else {
          console.error('📋 VERIFICATION FAILED: Metadata not found after storage!');
        }
      } catch (verifyError) {
        console.error('📋 VERIFICATION ERROR:', verifyError.message);
      }
      
      console.log(`✅ Stored PDF metadata for: ${pdfMetadata.fileName}`);
    } catch (error) {
      console.error('❌ PDF metadata storage ERROR:', error.message);
      console.error('❌ Error details:', error);
      throw error;
    }
  }

  // Get all PDF metadata
  async getPDFMetadata() {
    try {
      console.log(`🔍 Searching for PDF metadata in collection: ${this.collections.CRIMINAL_CODE_ARTICLES}`);
      
      // Increase limit to ensure we get all points
      const searchResult = await this.client.scroll(this.collections.CRIMINAL_CODE_ARTICLES, {
        with_payload: true,
        limit: 200  // Increased significantly to ensure we get all points
      });

      console.log(`🔍 Raw search result: ${searchResult.points.length} total points found`);
      if (searchResult.points.length > 0) {
        // Show first few point types to debug
        const pointTypes = searchResult.points.map(p => p.payload?.type).slice(0, 5);
        console.log('🔍 Point types found:', pointTypes);
        
        // Look for PDF metadata specifically with detailed logging
        const pdfMetadataPoints = searchResult.points.filter(p => p.payload?.type === 'pdf_metadata');
        console.log(`🔍 Found ${pdfMetadataPoints.length} PDF metadata points`);
        
        // Debug: Show ALL PDF metadata points, not just the first one
        if (pdfMetadataPoints.length > 0) {
          console.log('🔍 All PDF metadata points:');
          pdfMetadataPoints.forEach((point, index) => {
            console.log(`  ${index + 1}. ID: ${point.id}, File: ${point.payload.file_name}, Original: ${point.payload.original_file_name}, Created: ${point.payload.created_at}`);
          });
        } else {
          console.log('🔍 No PDF metadata points found! Checking first 10 points:');
          searchResult.points.slice(0, 10).forEach((point, index) => {
            console.log(`  ${index + 1}. ID: ${point.id}, Type: ${point.payload?.type}, Data: ${JSON.stringify(point.payload).substring(0, 100)}...`);
          });
        }
      }

      // Now filter for PDF metadata
      const pdfMetadataPoints = searchResult.points.filter(point => 
        point.payload?.type === 'pdf_metadata'
      );

      console.log(`🔍 FINAL: Returning ${pdfMetadataPoints.length} PDF metadata entries`);

      return pdfMetadataPoints.map(point => ({
        id: point.payload.file_name.replace(/\.[^/.]+$/, ""), // Use filename without extension as ID
        fileName: point.payload.original_file_name,
        fullFileName: point.payload.file_name,
        size: point.payload.file_size,
        uploadDate: point.payload.upload_date,
        isEnabled: true,
        vectorStatus: 'processed',
        articlesProcessed: point.payload.articles_processed || 0,
        chaptersProcessed: point.payload.chapters_processed || 0,
        note: 'Stored in vector database (serverless environment)'
      }));
    } catch (error) {
      if (error.status === 404 || error.status === 403) {
        console.log(`📋 Collection ${this.collections.CRIMINAL_CODE_ARTICLES} not found or inaccessible, returning empty list`);
        return [];
      }
      throw error;
    }
  }

  // Delete PDF metadata and related articles
  async deletePDFMetadata(fileName) {
    try {
      console.log(`🗑️ Deleting PDF metadata for file: ${fileName}`);
      
      // Get all points in the collection to find matching ones
      const scrollResult = await this.client.scroll(this.collections.CRIMINAL_CODE_ARTICLES, {
        with_payload: true,
        limit: 1000  // Get more points to ensure we find all related data
      });

      console.log(`🔍 DELETE SCAN: Found ${scrollResult.points.length} total points to scan`);

      // Find points to delete (PDF metadata and articles from this file)
      const pointsToDelete = [];
      const metadataToDelete = [];
      const articlesToDelete = [];
      
      scrollResult.points.forEach(point => {
        const payload = point.payload;
        
        // Delete PDF metadata points matching the filename
        if (payload?.type === 'pdf_metadata' && 
            (payload.file_name === fileName || payload.original_file_name === fileName)) {
          pointsToDelete.push(point.id);
          metadataToDelete.push(point);
          console.log(`🗑️ Found PDF metadata to delete: ${payload.file_name} (ID: ${point.id})`);
        }
        
        // Delete articles that came from this PDF file
        if (payload?.type === 'criminal_code_article' && 
            payload.source_file === fileName) {
          pointsToDelete.push(point.id);
          articlesToDelete.push(point);
          console.log(`🗑️ Found article to delete from file: Article ${payload.article_number} (ID: ${point.id})`);
        }
      });

      console.log(`🗑️ DELETION SUMMARY: ${metadataToDelete.length} metadata + ${articlesToDelete.length} articles = ${pointsToDelete.length} total points to delete`);

      if (pointsToDelete.length > 0) {
        // Delete the points
        const deleteResult = await this.client.delete(this.collections.CRIMINAL_CODE_ARTICLES, {
          wait: true,
          points: pointsToDelete
        });
        
        console.log(`🗑️ Qdrant delete operation result:`, deleteResult);
        console.log(`✅ Deleted ${pointsToDelete.length} points from vector database for file: ${fileName}`);
        
        // Wait a bit for Qdrant consistency (especially important for cloud)
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏱️ Waited for Qdrant consistency after deletion`);
        
        return {
          success: true,
          deletedCount: pointsToDelete.length,
          metadataDeleted: metadataToDelete.length,
          articlesDeleted: articlesToDelete.length,
          message: `Deleted ${pointsToDelete.length} points from vector database`
        };
      } else {
        console.log(`ℹ️ No vector database entries found for file: ${fileName}`);
        return {
          success: true,
          deletedCount: 0,
          message: 'No vector database entries found for this file'
        };
      }
      
    } catch (error) {
      console.error(`❌ Error deleting PDF metadata for ${fileName}:`, error);
      throw error;
    }
  }

  // Search Crime Name Master
  async searchCrimeNameMaster(queryVector, filters = {}, limit = 10) {
    try {
      console.log(`🔍 SEARCH: crime_name_master with vector length ${queryVector?.length}, limit ${limit}`);
      
      // First, let's check what's actually in the collection
      const scrollResult = await this.client.scroll(this.collections.CRIME_NAME_MASTER, {
        limit: 10,
        with_payload: true
      });
      console.log(`🔍 SCROLL CHECK: crime_name_master has ${scrollResult.points.length} total points`);
      if (scrollResult.points.length > 0) {
        const types = scrollResult.points.map(p => p.payload?.type);
        console.log(`🔍 Point types in collection: ${types}`);
      }
      
      // Try search without any threshold first
      const searchResult = await this.client.search(this.collections.CRIME_NAME_MASTER, {
        vector: queryVector,
        limit,
        with_payload: true
        // No score_threshold to see all results
      });

      console.log(`🔍 SEARCH RESULT: crime_name_master returned ${searchResult.length} results`);
      if (searchResult.length > 0) {
        console.log(`🔍 First result score: ${searchResult[0].score}`);
        console.log(`🔍 First result type: ${searchResult[0].payload?.type}`);
      }

      // Filter results by type in JavaScript
      const filteredResults = searchResult.filter(result => 
        result.payload?.type === 'crime_name_master'
      );

      console.log(`🔍 Filtered results: ${filteredResults.length} crime_name_master items`);

      return filteredResults.map(result => ({
        score: result.score,
        ...result.payload
      }));
    } catch (error) {
      console.error(`❌ SEARCH ERROR: crime_name_master - ${error.status} ${error.message}`);
      return [];
    }
  }

  // Search Case Law Master
  async searchCaseLawMaster(queryVector, filters = {}, limit = 10) {
    try {
      console.log(`🔍 SEARCH: case_law_master with vector length ${queryVector?.length}, limit ${limit}`);
      
      // Check what's in this collection
      const scrollResult = await this.client.scroll(this.collections.CASE_LAW_MASTER, {
        limit: 10,
        with_payload: true
      });
      console.log(`🔍 SCROLL CHECK: case_law_master has ${scrollResult.points.length} total points`);
      
      // Try search without threshold
      const searchResult = await this.client.search(this.collections.CASE_LAW_MASTER, {
        vector: queryVector,
        limit,
        with_payload: true
      });

      console.log(`🔍 SEARCH RESULT: case_law_master returned ${searchResult.length} results`);
      if (searchResult.length > 0) {
        console.log(`🔍 First result score: ${searchResult[0].score}`);
      }

      const filteredResults = searchResult.filter(result => 
        result.payload?.type === 'case_law_master'
      );

      return filteredResults.map(result => ({
        score: result.score,
        ...result.payload
      }));
    } catch (error) {
      console.error(`❌ SEARCH ERROR: case_law_master - ${error.status} ${error.message}`);
      return [];
    }
  }

  // Search Criminal Code Articles
  async searchCriminalCodeArticles(queryVector, filters = {}, limit = 10) {
    try {
      console.log(`🔍 SEARCH: criminal_code_articles with vector length ${queryVector?.length}, limit ${limit}`);
      
      // Check what's in this collection
      const scrollResult = await this.client.scroll(this.collections.CRIMINAL_CODE_ARTICLES, {
        limit: 10,
        with_payload: true
      });
      console.log(`🔍 SCROLL CHECK: criminal_code_articles has ${scrollResult.points.length} total points`);
      if (scrollResult.points.length > 0) {
        const types = scrollResult.points.map(p => p.payload?.type);
        console.log(`🔍 Point types in collection: ${types}`);
      }
      
      // Try search without threshold
      const searchResult = await this.client.search(this.collections.CRIMINAL_CODE_ARTICLES, {
        vector: queryVector,
        limit,
        with_payload: true
      });

      console.log(`🔍 SEARCH RESULT: criminal_code_articles returned ${searchResult.length} results`);
      if (searchResult.length > 0) {
        console.log(`🔍 First result score: ${searchResult[0].score}`);
        console.log(`🔍 First result type: ${searchResult[0].payload?.type}`);
      }

      const filteredResults = searchResult.filter(result => 
        result.payload?.type === 'criminal_code_article'
      );

      console.log(`🔍 Filtered results: ${filteredResults.length} criminal_code_article items`);

      return filteredResults.map(result => ({
        score: result.score,
        ...result.payload
      }));
    } catch (error) {
      console.error(`❌ SEARCH ERROR: criminal_code_articles - ${error.status} ${error.message}`);
      return [];
    }
  }

  // Health check
  async healthCheck() {
    try {
      const collections = await this.client.getCollections();
      return {
        status: 'healthy',
        collections: collections.collections.map(col => col.name)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Clear all data from vector database (for debugging)
  async clearAllData() {
    try {
      console.log('🧹 Starting complete vector database cleanup...');
      
      // Delete all collections
      const collections = [
        this.collections.CRIME_NAME_MASTER,
        this.collections.CASE_LAW_MASTER,
        this.collections.CRIMINAL_CODE_ARTICLES
      ];

      for (const collectionName of collections) {
        try {
          console.log(`🗑️ Deleting collection: ${collectionName}`);
          await this.client.deleteCollection(collectionName);
          console.log(`✅ Deleted collection: ${collectionName}`);
        } catch (error) {
          if (error.status === 404) {
            console.log(`ℹ️ Collection ${collectionName} doesn't exist, skipping`);
          } else {
            console.error(`❌ Error deleting collection ${collectionName}:`, error);
          }
        }
      }

      // Recreate collections
      console.log('🔄 Recreating collections...');
      await this.initializeCollections();
      
      console.log('✅ Vector database completely cleared and reinitialized');
      return {
        success: true,
        message: 'All vector database data cleared successfully',
        collectionsCleared: collections.length
      };
      
    } catch (error) {
      console.error('❌ Error clearing vector database:', error);
      throw error;
    }
  }

  // Clear only PDF-related data (alternative to full clear)
  async clearPDFData() {
    try {
      console.log('🧹 Clearing PDF-related data from vector database...');
      
      // Get all points in the criminal code articles collection
      const scrollResult = await this.client.scroll(this.collections.CRIMINAL_CODE_ARTICLES, {
        with_payload: true,
        limit: 1000
      });

      // Find all PDF metadata and article points
      const pointsToDelete = [];
      
      scrollResult.points.forEach(point => {
        const payload = point.payload;
        
        // Delete all PDF metadata
        if (payload?.type === 'pdf_metadata') {
          pointsToDelete.push(point.id);
          console.log(`🗑️ Marking PDF metadata for deletion: ${payload.file_name}`);
        }
        
        // Delete all criminal code articles
        if (payload?.type === 'criminal_code_article') {
          pointsToDelete.push(point.id);
          console.log(`🗑️ Marking article for deletion: Article ${payload.article_number || 'Unknown'}`);
        }
      });

      if (pointsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${pointsToDelete.length} PDF-related points...`);
        
        await this.client.delete(this.collections.CRIMINAL_CODE_ARTICLES, {
          wait: true,
          points: pointsToDelete
        });
        
        // Wait for consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`✅ Cleared ${pointsToDelete.length} PDF-related points from vector database`);
        return {
          success: true,
          message: `Cleared ${pointsToDelete.length} PDF-related points`,
          deletedCount: pointsToDelete.length
        };
      } else {
        console.log('ℹ️ No PDF-related data found to clear');
        return {
          success: true,
          message: 'No PDF-related data found',
          deletedCount: 0
        };
      }
      
    } catch (error) {
      console.error('❌ Error clearing PDF data:', error);
      throw error;
    }
  }
}

// Singleton instance
const qdrantService = new QdrantService();

export default qdrantService; 