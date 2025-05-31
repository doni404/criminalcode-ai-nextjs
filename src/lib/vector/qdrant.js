import { QdrantClient } from '@qdrant/js-client-rest';

class QdrantService {
  constructor() {
    // Support both local development and cloud deployment
    const qdrantUrl = process.env.QDRANT_URL;
    
    if (qdrantUrl) {
      // Cloud configuration - use full URL
      console.log(`🌐 Connecting to Qdrant Cloud: ${qdrantUrl}`);
      this.client = new QdrantClient({
        url: qdrantUrl,
        apiKey: process.env.QDRANT_API_KEY
      });
    } else {
      // Local development configuration
      console.log(`🏠 Connecting to local Qdrant: ${process.env.QDRANT_HOST || 'localhost'}:${process.env.QDRANT_PORT || 6333}`);
      this.client = new QdrantClient({
        host: process.env.QDRANT_HOST || 'localhost',
        port: process.env.QDRANT_PORT || 6333,
        apiKey: process.env.QDRANT_API_KEY || undefined
      });
    }
    
    this.collections = {
      CRIME_NAME_MASTER: 'crime_name_master',
      CASE_LAW_MASTER: 'case_law_master',
      CRIMINAL_CODE_ARTICLES: 'criminal_code_articles'
    };
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

  // Search Crime Name Master
  async searchCrimeNameMaster(queryVector, filters = {}, limit = 10) {
    try {
      const searchResult = await this.client.search(this.collections.CRIME_NAME_MASTER, {
        vector: queryVector,
        limit,
        filter: {
          must: [
            { key: 'type', match: { value: 'crime_name_master' } },
            ...this.buildFilters(filters)
          ]
        },
        with_payload: true,
        score_threshold: 0.7
      });

      return searchResult.map(result => ({
        score: result.score,
        ...result.payload
      }));
    } catch (error) {
      if (error.status === 404) {
        console.log(`📋 Collection ${this.collections.CRIME_NAME_MASTER} not found, returning empty results`);
        return [];
      }
      throw error;
    }
  }

  // Search Case Law Master
  async searchCaseLawMaster(queryVector, filters = {}, limit = 10) {
    try {
      const searchResult = await this.client.search(this.collections.CASE_LAW_MASTER, {
        vector: queryVector,
        limit,
        filter: {
          must: [
            { key: 'type', match: { value: 'case_law_master' } },
            ...this.buildFilters(filters)
          ]
        },
        with_payload: true,
        score_threshold: 0.7
      });

      return searchResult.map(result => ({
        score: result.score,
        ...result.payload
      }));
    } catch (error) {
      if (error.status === 404) {
        console.log(`📋 Collection ${this.collections.CASE_LAW_MASTER} not found, returning empty results`);
        return [];
      }
      throw error;
    }
  }

  // Search Criminal Code Articles
  async searchCriminalCodeArticles(queryVector, filters = {}, limit = 10) {
    try {
      const searchResult = await this.client.search(this.collections.CRIMINAL_CODE_ARTICLES, {
        vector: queryVector,
        limit,
        filter: {
          must: [
            { key: 'type', match: { value: 'criminal_code_article' } },
            ...this.buildFilters(filters)
          ]
        },
        with_payload: true,
        score_threshold: 0.7
      });

      return searchResult.map(result => ({
        score: result.score,
        ...result.payload
      }));
    } catch (error) {
      if (error.status === 404) {
        console.log(`📋 Collection ${this.collections.CRIMINAL_CODE_ARTICLES} not found, returning empty results`);
        return [];
      }
      throw error;
    }
  }

  // Helper method to build Qdrant filters
  buildFilters(filters) {
    const qdrantFilters = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        qdrantFilters.push({
          key,
          match: { any: value }
        });
      } else {
        qdrantFilters.push({
          key,
          match: { value }
        });
      }
    });

    return qdrantFilters;
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