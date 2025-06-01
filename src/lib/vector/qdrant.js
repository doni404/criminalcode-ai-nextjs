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

      console.log('📋 About to call upsert...');
      
      const result = await this.client.upsert(this.collections.CRIMINAL_CODE_ARTICLES, {
        wait: true,
        points: [point]
      });

      console.log('📋 Upsert result:', result);
      console.log('📋 Upsert completed successfully');
      
      // Add small delay for Qdrant Cloud consistency
      console.log('📋 Waiting for consistency...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('📋 Consistency wait complete');
      
      console.log(`✅ Stored PDF metadata for: ${pdfMetadata.fileName}`);
    } catch (error) {
      console.error('❌ PDF metadata storage ERROR:', error.message);
      throw error;
    }
  }

  // Get all PDF metadata
  async getPDFMetadata() {
    try {
      console.log(`🔍 Searching for PDF metadata in collection: ${this.collections.CRIMINAL_CODE_ARTICLES}`);
      
      // Temporarily get ALL points to see what's actually there
      const searchResult = await this.client.scroll(this.collections.CRIMINAL_CODE_ARTICLES, {
        with_payload: true,
        limit: 50  // Increased to see all points including PDF metadata
      });

      console.log(`🔍 Raw search result: ${searchResult.points.length} total points found`);
      if (searchResult.points.length > 0) {
        // Show first few point types to debug
        const pointTypes = searchResult.points.map(p => p.payload?.type).slice(0, 5);
        console.log('🔍 Point types found:', pointTypes);
        
        // Look for PDF metadata specifically
        const pdfMetadataPoints = searchResult.points.filter(p => p.payload?.type === 'pdf_metadata');
        console.log(`🔍 Found ${pdfMetadataPoints.length} PDF metadata points`);
        
        if (pdfMetadataPoints.length > 0) {
          console.log('🔍 First PDF metadata:', JSON.stringify(pdfMetadataPoints[0].payload, null, 2));
        }
      }

      // Now filter for PDF metadata
      const pdfMetadataPoints = searchResult.points.filter(point => 
        point.payload?.type === 'pdf_metadata'
      );

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
}

// Singleton instance
const qdrantService = new QdrantService();

export default qdrantService; 