import { NextResponse } from 'next/server';
import { LegalAnalyzer } from '../../../../lib/legal/legalAnalyzer.js';

const legalAnalyzer = new LegalAnalyzer();

export async function POST(request) {
  try {
    console.log('🏛️ Starting legal analysis...');
    
    const { mode, data, conversationHistory, enabledPDFs } = await request.json();
    
    if (!mode) {
      return NextResponse.json(
        { error: 'Analysis mode is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Legal analysis mode: ${mode}`);

    // Check if any PDFs are enabled for vector database search
    const hasEnabledPDFs = enabledPDFs && Array.isArray(enabledPDFs) && enabledPDFs.length > 0;

    if (!hasEnabledPDFs) {
      // No PDFs enabled - return error with guidance
      return NextResponse.json({
        success: false,
        error: 'No criminal code documents enabled',
        result: {
          analysis: `**⚠️ LIMITED MODE: No Criminal Code Documents Available**

I cannot provide specific article determinations or detailed legal analysis because no criminal code documents are currently enabled for analysis.

**What I can provide:**
- General legal concepts and principles
- Explanation of typical criminal law processes
- Educational information about legal analysis

**What I cannot provide without criminal code documents:**
- Specific article citations
- Exact penalty information
- Definitive legal determinations
- Precise criminal code references

**To enable full legal analysis:**
1. Go to the "Document Management" tab
2. Upload criminal code PDF documents
3. Enable the toggle switches for the documents you want to use
4. Return to this chat for complete analysis

**Your case:** ${data?.description || 'No case description provided'}

Without access to the actual criminal code documents, I can only suggest that you should consult the appropriate criminal code provisions and seek professional legal advice for specific determinations.`,
          stage: 'limited_mode',
          isComplete: true,
          nextStage: 'document_required',
          parsedResponse: {
            hasQuestions: false,
            isAnalysisComplete: false,
            potentialArticles: [],
            requiresDocuments: true
          }
        }
      });
    }

    // Continue with normal analysis if PDFs are enabled

    let result;

    switch (mode) {
      case 'simple_chat':
        if (!data?.description) {
          return NextResponse.json(
            { error: 'Description is required for simple chat mode' },
            { status: 400 }
          );
        }
        result = await legalAnalyzer.analyzeCase(data.description, 'simple_chat');
        break;

      case 'interactive':
        if (!data?.description) {
          return NextResponse.json(
            { error: 'Description is required for interactive mode' },
            { status: 400 }
          );
        }
        result = await legalAnalyzer.analyzeCase(
          data.description, 
          'interactive', 
          conversationHistory || []
        );
        break;

      case 'eight_item':
        if (!data?.responses) {
          return NextResponse.json(
            { error: 'Eight-item responses are required' },
            { status: 400 }
          );
        }
        result = await legalAnalyzer.analyzeCase(data.responses, 'eight_item');
        break;

      case 'flowchart':
        if (!data?.session) {
          return NextResponse.json(
            { error: 'Flowchart session data is required' },
            { status: 400 }
          );
        }
        result = await legalAnalyzer.analyzeCase(data.session, 'flowchart');
        break;

      case 'comprehensive':
        if (!data) {
          return NextResponse.json(
            { error: 'Analysis data is required' },
            { status: 400 }
          );
        }
        result = await legalAnalyzer.analyzeCase(data, 'comprehensive');
        break;

      default:
        return NextResponse.json(
          { error: `Unknown analysis mode: ${mode}` },
          { status: 400 }
        );
    }

    console.log(`✅ Legal analysis completed in ${mode} mode`);
    
    return NextResponse.json({
      success: true,
      mode,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Legal analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform legal analysis',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Health check and available modes
    const healthCheck = await legalAnalyzer.healthCheck();
    
    return NextResponse.json({
      status: 'ready',
      availableModes: [
        {
          mode: 'simple_chat',
          description: 'Basic legal analysis with simple Q&A',
          requiredData: ['description']
        },
        {
          mode: 'interactive',
          description: 'Progressive questioning until specific criminal codes are identified',
          requiredData: ['description'],
          optionalData: ['conversationHistory']
        },
        {
          mode: 'eight_item',
          description: 'Structured 8-item analysis framework',
          requiredData: ['responses (8-item object)']
        },
        {
          mode: 'flowchart',
          description: 'Constituent element flowchart analysis',
          requiredData: ['session (flowchart session)']
        },
        {
          mode: 'comprehensive',
          description: 'Combined analysis using multiple methods',
          requiredData: ['varies based on included analyses']
        }
      ],
      systemHealth: healthCheck,
      examples: {
        interactive: {
          mode: 'interactive',
          data: {
            description: 'A person was found with a stolen motorcycle and attempted to flee when questioned by police.'
          },
          conversationHistory: [
            'Initial case description',
            'AI asked about intent and knowledge',
            'User provided more details',
            'AI narrowed down to specific articles'
          ]
        },
        simple_chat: {
          mode: 'simple_chat',
          data: {
            description: 'Someone stole a car at gunpoint'
          }
        }
      }
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