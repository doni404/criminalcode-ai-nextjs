import { NextResponse } from 'next/server';

// Dynamic imports
let qdrantService;

async function loadQdrantService() {
  if (!qdrantService) {
    const qdrantModule = await import('../../../../lib/vector/qdrant.js');
    qdrantService = qdrantModule.default;
  }
  return qdrantService;
}

// Simple embedding function to match the one used during upload
function generateSimpleEmbedding(text) {
  const hash = simpleHash(text);
  return new Array(1536).fill(0).map((_, i) => {
    return Math.sin(hash + i) * 0.1;
  });
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/legal/article-content',
    description: 'Fetch specific article content from uploaded criminal code',
    usage: 'POST with { "articleNumber": "362" }',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request) {
  let articleNumber = 'unknown';
  
  try {
    const { articleNumber: requestedArticle, enabledPDFs } = await request.json();
    articleNumber = requestedArticle;

    if (!articleNumber) {
      return NextResponse.json(
        { error: 'Article number is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for Article ${articleNumber} content in vector database...`);
    
    // Load Qdrant service
    const qdrant = await loadQdrantService();

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
          page: 1
        }
      });
    }

    // Generate search query for the specific article
    const searchQuery = `Article ${articleNumber} Indonesian Penal Code KUHP`;
    
    // Generate embedding for search
    const queryEmbedding = generateSimpleEmbedding(searchQuery);

    // Search both criminal code articles and crime name master collections
    const [articlesResults, crimeResults] = await Promise.all([
      qdrant.searchCriminalCodeArticles(queryEmbedding, {}, 10),
      qdrant.searchCrimeNameMaster(queryEmbedding, {}, 10)
    ]);

    console.log(`🔍 Found ${articlesResults.length} articles and ${crimeResults.length} crime results`);

    // Find exact article match by number
    let articleContent = null;
    
    // First try to find in criminal code articles collection
    const exactArticle = articlesResults.find(result => 
      result.article_number === parseInt(articleNumber) ||
      (result.title && result.title.toLowerCase().includes(`article ${articleNumber}`))
    );

    if (exactArticle) {
      console.log(`✅ Found exact article match: Article ${exactArticle.article_number}`);
      articleContent = {
        text: exactArticle.content || exactArticle.title || `Article ${articleNumber} content from uploaded PDF`,
        chapter: exactArticle.chapter || 'Indonesian Penal Code',
        penalty: exactArticle.penalty || 'Penalty information from uploaded document',
        page: exactArticle.page || 1,
        source: 'criminal_code_articles',
        articleNumber: exactArticle.article_number,
        keywords: exactArticle.keywords || []
      };
    } else {
      // Try crime name master collection
      const crimeArticle = crimeResults.find(result => 
        result.article_number === parseInt(articleNumber)
      );

      if (crimeArticle) {
        console.log(`✅ Found crime article match: Article ${crimeArticle.article_number}`);
        articleContent = {
          text: crimeArticle.definitions || `${crimeArticle.crime_name}: ${crimeArticle.constituent_elements?.join(', ') || 'Legal elements from uploaded PDF'}`,
          chapter: crimeArticle.chapter || 'Indonesian Penal Code',
          penalty: crimeArticle.penalty || 'Penalty information from uploaded document',
          page: crimeArticle.page || 1,
          source: 'crime_name_master',
          articleNumber: crimeArticle.article_number,
          crimeType: crimeArticle.crime_name,
          elements: crimeArticle.constituent_elements || []
        };
      } else {
        // Search more broadly for similar content in uploaded documents
        const broadSearchResults = articlesResults.filter(result => 
          result.content && result.content.toLowerCase().includes(articleNumber.toString()) ||
          result.title && result.title.toLowerCase().includes(articleNumber.toString())
        );

        if (broadSearchResults.length > 0) {
          const bestMatch = broadSearchResults[0];
          console.log(`✅ Found broad match for Article ${articleNumber}`);
          articleContent = {
            text: bestMatch.content || bestMatch.title || `Article content related to Article ${articleNumber}`,
            chapter: bestMatch.chapter || 'Indonesian Penal Code',
            penalty: bestMatch.penalty || 'Refer to uploaded document for penalty details',
            page: bestMatch.page || 1,
            source: 'broad_search',
            articleNumber: articleNumber,
            note: 'Content found through broad search - may be related article'
          };
        }
      }
    }

    if (articleContent) {
      console.log(`✅ Returning dynamic article content for Article ${articleNumber} from uploaded PDF`);
      return NextResponse.json({
        success: true,
        article: {
          number: parseInt(articleNumber),
          ...articleContent
        }
      });
    }

    // If no content found, provide info about available articles from uploaded documents
    console.log(`⚠️ Article ${articleNumber} not found in uploaded documents`);
    
    // Get some available articles to show user what's actually in the uploaded PDF
    const availableArticles = articlesResults.slice(0, 5).map(result => ({
      number: result.article_number,
      title: result.title || result.content?.substring(0, 50) + '...',
      source: result.source || 'uploaded_pdf'
    }));

    return NextResponse.json({
      success: false,
      error: `Article ${articleNumber} not found in uploaded documents`,
      availableArticles,
      suggestion: `Try searching for one of the available articles from your uploaded PDF, or check if Article ${articleNumber} is covered in the documents.`,
      fallback: {
        text: `Article ${articleNumber} - Not found in uploaded documents. The uploaded PDF may not contain this specific article, or it may be numbered differently.`,
        chapter: 'Indonesian Penal Code',
        penalty: 'Article not found in uploaded documents',
        page: 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching article content from uploaded PDF:', error);
    
    // Check if it's specifically a Qdrant authentication error
    if (error.status === 403 || error.statusText === 'Forbidden') {
      return NextResponse.json(
        { 
          error: 'Vector database authentication failed',
          details: 'Unable to access uploaded PDF content due to Qdrant Cloud authentication issues',
          troubleshooting: {
            issue: 'Qdrant Cloud API key or permissions issue',
            solution: 'Check QDRANT_API_KEY environment variable in Vercel settings',
            note: 'PDF upload works but retrieval fails - this is an API key issue'
          },
          fallback: {
            text: `Article ${articleNumber} - Unable to access uploaded PDF content due to database authentication issues.`,
            chapter: 'Database Error',
            penalty: 'Unable to retrieve penalty information from uploaded documents',
            page: 1
          }
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch article content from uploaded PDF',
        details: error.message,
        fallback: {
          text: `Article ${articleNumber} - Error retrieving content from uploaded documents. Please try again or check if the documents are properly uploaded.`,
          chapter: 'Error',
          penalty: 'Unable to retrieve penalty information',
          page: 1
        }
      },
      { status: 500 }
    );
  }
} 