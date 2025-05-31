import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a specialized Criminal Code AI Assistant designed to analyze criminal cases and provide expert legal analysis. Your role is to:

1. Analyze criminal case descriptions provided by users
2. Identify applicable criminal law statutes and code sections
3. Determine relevant criminal code chapters and articles
4. Assess potential penalties and legal consequences
5. Ask clarifying questions to better understand the case

Guidelines for your responses:
- Provide clear, structured analysis
- Reference specific criminal code sections when applicable
- Explain legal concepts in accessible language
- Always include disclaimers about seeking professional legal counsel
- Ask follow-up questions to gather missing details
- Be thorough but concise in your analysis

Format your responses with:
- **Case Analysis**: Brief summary of the situation
- **Applicable Laws**: Relevant criminal code sections
- **Potential Charges**: Possible criminal charges
- **Penalties**: Potential legal consequences
- **Recommendations**: Suggested next steps
- **Questions**: Any clarifying questions needed

Important: Always remind users that this is for informational purposes only and they should consult with a qualified attorney for legal advice.`;

export async function POST(request) {
  try {
    const { message, useAdvancedAnalysis, enabledPDFs } = await request.json();
    
    console.log('💬 Processing chat message (advanced:', useAdvancedAnalysis, ')');

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if any PDFs are enabled for vector database search
    const hasEnabledPDFs = enabledPDFs && Array.isArray(enabledPDFs) && enabledPDFs.length > 0;

    let systemPrompt;
    if (useAdvancedAnalysis) {
      if (!hasEnabledPDFs) {
        // No PDFs enabled - provide general guidance only
        systemPrompt = `You are a Criminal Code AI Assistant in LIMITED MODE.

IMPORTANT LIMITATION: Currently NO criminal code documents are enabled for analysis. You can only provide:

1. **General Legal Concepts**: Basic explanations of criminal law principles
2. **Process Guidance**: How legal analysis typically works
3. **Educational Information**: General information about criminal justice systems

YOU MUST NOT:
- Cite specific article numbers from any criminal code
- Make definitive legal determinations about cases
- Provide specific penalties or sentences
- Reference specific legal provisions

Instead, you should:
- Explain that specific article determination requires access to criminal code documents
- Suggest enabling PDFs in the Document Management section
- Provide general educational guidance about criminal law concepts
- Explain the types of evidence and factors that would typically be considered

Always remind the user that specific legal analysis requires access to the actual criminal code documents.`;
      } else {
        // PDFs enabled - normal advanced analysis
        systemPrompt = `You are a Criminal Code AI Assistant specializing in Indonesian criminal law analysis.

You have access to ${enabledPDFs.length} enabled criminal code document(s): ${enabledPDFs.join(', ')}.

Provide comprehensive legal analysis with:
1. Relevant criminal code articles
2. Legal elements and requirements
3. Potential penalties and consequences
4. Case assessment and recommendations

Base your analysis on the enabled documents and provide specific article citations when appropriate.`;
      }
    } else {
      if (!hasEnabledPDFs) {
        systemPrompt = `You are a Criminal Code AI Assistant in LIMITED MODE.

Currently NO criminal code documents are enabled. You can only provide general legal education and guidance. 

DO NOT cite specific articles or make definitive legal determinations without access to actual criminal code documents.`;
      } else {
        systemPrompt = `You are a Criminal Code AI Assistant. Provide helpful guidance about criminal law matters based on the enabled documents: ${enabledPDFs.join(', ')}.`;
      }
    }

    let response;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      response = completion.choices[0].message.content;
      
      // Add disclaimer about document access
      if (!hasEnabledPDFs) {
        response += "\n\n⚠️ **Important**: No criminal code documents are currently enabled. To get specific article citations and detailed legal analysis, please enable at least one PDF document in the Document Management section.";
      }

    } catch (error) {
      console.error('❌ Chat API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      response: response,
      timestamp: new Date().toISOString(),
      mode: useAdvancedAnalysis ? 'advanced' : 'basic',
      enabledPDFs: hasEnabledPDFs ? enabledPDFs.length : 0
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for API information
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    chatEndpoint: '/api/chat',
    features: {
      basicChat: {
        description: 'Standard OpenAI-powered criminal law chat with document awareness',
        model: 'gpt-4',
        capabilities: ['General legal consultation', 'Criminal law expertise', 'Educational guidance']
      },
      advancedAnalysis: {
        description: 'Enhanced analysis with enabled PDF document validation',
        capabilities: [
          'Document-aware legal analysis',
          'Specific article citations (when documents enabled)',
          'Contextual legal analysis',
          'Structured recommendations'
        ]
      }
    },
    usage: {
      basicChat: 'POST with { "message": "your question", "enabledPDFs": ["doc1.pdf"] }',
      advancedAnalysis: 'POST with { "message": "your question", "useAdvancedAnalysis": true, "enabledPDFs": ["doc1.pdf"] }'
    },
    timestamp: new Date().toISOString()
  });
} 