import { NextResponse } from 'next/server';
import qdrantService from '../../../../lib/vector/qdrant.js';

export async function POST(request) {
  try {
    const { articleNumber, enabledPDFs } = await request.json();

    if (!articleNumber) {
      return NextResponse.json(
        { error: 'Article number is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for Article ${articleNumber} content...`);
    
    // If enabledPDFs is provided and empty, return early
    if (enabledPDFs && Array.isArray(enabledPDFs) && enabledPDFs.length === 0) {
      console.log('⚠️ No PDFs enabled for search');
      return NextResponse.json({ 
        success: false,
        error: 'No PDFs enabled for vector database search',
        fallback: {
          text: `Article ${articleNumber} - No documents are currently enabled for search. Please enable at least one PDF in Document Management.`,
          chapter: 'Indonesian Penal Code',
          penalty: 'Enable documents to view penalty information',
          page: 1 // Simple fallback when no PDFs enabled
        }
      });
    }

    // Generate search query for the specific article
    const searchQuery = `Article ${articleNumber} Indonesian Penal Code KUHP`;
    
    // Generate embedding for search using the same method as document processor
    const queryEmbedding = generateSimpleEmbedding(searchQuery);

    // Search both criminal code articles and crime name master collections
    const [articlesResults, crimeResults] = await Promise.all([
      qdrantService.searchCriminalCodeArticles(queryEmbedding, {}, 10),
      qdrantService.searchCrimeNameMaster(queryEmbedding, {}, 10)
    ]);

    // Find exact article match by number
    let articleContent = null;
    
    // First try to find in criminal code articles
    const exactArticle = articlesResults.find(result => 
      result.article_number === articleNumber || 
      result.article_number === parseInt(articleNumber) ||
      (result.title && result.title.toLowerCase().includes(`article ${articleNumber}`))
    );

    if (exactArticle) {
      articleContent = {
        text: exactArticle.content || exactArticle.text || `Article ${articleNumber} content`,
        chapter: exactArticle.chapter || 'Criminal Code',
        penalty: exactArticle.penalty || 'Penalty information not available',
        page: exactArticle.page || 1, // Use actual page from PDF extraction
        source: 'criminal_code_articles'
      };
    } else {
      // Try crime name master
      const crimeArticle = crimeResults.find(result => 
        result.article_number === articleNumber || 
        result.article_number === parseInt(articleNumber)
      );

      if (crimeArticle) {
        articleContent = {
          text: crimeArticle.definitions || crimeArticle.content || `${crimeArticle.crime_name}: ${crimeArticle.constituent_elements?.join(', ') || 'No details available'}`,
          chapter: crimeArticle.chapter || 'Criminal Code',
          penalty: crimeArticle.penalty || 'Penalty information not available',
          page: crimeArticle.page || 1, // Use actual page from PDF extraction
          source: 'crime_name_master'
        };
      }
    }

    // If still no exact match, try to find by similarity (best match)
    if (!articleContent && (articlesResults.length > 0 || crimeResults.length > 0)) {
      const bestMatch = [...articlesResults, ...crimeResults]
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];

      if (bestMatch && (bestMatch.score || 0) > 0.7) {
        articleContent = {
          text: bestMatch.content || bestMatch.definitions || bestMatch.text || `Related content for Article ${articleNumber}`,
          chapter: bestMatch.chapter || 'Criminal Code',
          penalty: bestMatch.penalty || 'Penalty information not available',
          page: bestMatch.page || 1, // Use actual page from PDF extraction
          source: 'similarity_match',
          confidence: bestMatch.score
        };
      }
    }

    if (articleContent) {
      console.log(`✅ Found Article ${articleNumber} content from ${articleContent.source}`);
      return NextResponse.json({ 
        success: true,
        articleContent,
        searchResults: {
          articlesFound: articlesResults.length,
          crimesFound: crimeResults.length
        }
      });
    } else {
      console.log(`❌ Article ${articleNumber} not found in vector database`);
      return NextResponse.json({ 
        success: false,
        error: 'Article content not found',
        articleContent: null,
        fallback: {
          text: `Article ${articleNumber} - Content not available in uploaded documents. Please refer to the full PDF.`,
          chapter: 'Indonesian Penal Code',
          penalty: 'Please refer to the full document',
          page: 1 // Simple fallback page for unknown articles
        }
      });
    }

  } catch (error) {
    console.error('❌ Error fetching article content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch article content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/legal/article-content',
    description: 'Fetch specific article content from uploaded criminal code',
    usage: 'POST with { "articleNumber": "362" }',
    timestamp: new Date().toISOString()
  });
}

// Simple embedding generation (matching document processor approach)
function generateSimpleEmbedding(text) {
  const hash = simpleHash(text);
  const embedding = new Array(1536).fill(0).map((_, i) => {
    return Math.sin(hash + i) * 0.1; // Simple deterministic values
  });
  return embedding;
}

// Simple hash function for consistent embeddings
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
} 