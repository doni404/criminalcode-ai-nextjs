import OpenAI from 'openai';
import EightItemModel from './eightItemModel.js';
import ConstituentElementFlowchart from './constituentFlowchart.js';
import qdrantService from '../vector/qdrant.js';

class LegalAnalyzer {
  constructor() {
    // Remove OpenAI instantiation from constructor
    // this.openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });
    
    this.eightItemModel = new EightItemModel();
    this.flowchartModel = new ConstituentElementFlowchart();
    
    // Analysis modes
    this.modes = {
      SIMPLE_CHAT: 'simple_chat',
      INTERACTIVE: 'interactive',
      EIGHT_ITEM: 'eight_item',
      FLOWCHART: 'flowchart',
      COMPREHENSIVE: 'comprehensive'
    };
  }

  // Lazy initialization of OpenAI client
  get openai() {
    if (!this._openai) {
      this._openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this._openai;
  }

  // Main analysis entry point
  async analyzeCase(caseData, mode = this.modes.SIMPLE_CHAT, conversationHistory = []) {
    try {
      switch (mode) {
        case this.modes.SIMPLE_CHAT:
          return await this.performSimpleAnalysis(caseData);
        
        case this.modes.INTERACTIVE:
          return await this.performInteractiveAnalysis(caseData, conversationHistory);
        
        case this.modes.EIGHT_ITEM:
          return await this.performEightItemAnalysis(caseData);
        
        case this.modes.FLOWCHART:
          return await this.performFlowchartAnalysis(caseData);
        
        case this.modes.COMPREHENSIVE:
          return await this.performComprehensiveAnalysis(caseData);
        
        default:
          throw new Error(`Unknown analysis mode: ${mode}`);
      }
    } catch (error) {
      console.error('❌ Error in legal analysis:', error);
      throw error;
    }
  }

  // Simple chat-based analysis
  async performSimpleAnalysis(caseDescription) {
    // Search vector databases for relevant information
    const vectorResults = await this.searchVectorDatabases(caseDescription);
    
    // Generate analysis prompt with vector context
    const prompt = this.createSimpleAnalysisPrompt(caseDescription, vectorResults);
    
    // Get AI analysis
    const analysis = await this.getAIAnalysis(prompt);
    
    return {
      mode: this.modes.SIMPLE_CHAT,
      description: caseDescription,
      analysis,
      vectorResults,
      recommendations: this.extractRecommendations(analysis),
      timestamp: new Date().toISOString()
    };
  }

  // 8-Item Model guided analysis
  async performEightItemAnalysis(responses) {
    // Validate and score responses
    const validation = this.eightItemModel.validateCompletion(responses);
    const scoring = this.eightItemModel.scoreResponses(responses);
    
    if (!validation.isComplete) {
      return {
        mode: this.modes.EIGHT_ITEM,
        status: 'incomplete',
        validation,
        scoring,
        nextSteps: validation.missingItems
      };
    }

    // Extract legal concepts
    const legalConcepts = this.eightItemModel.extractLegalConcepts(responses);
    
    // Generate search context for vector databases
    const searchContext = this.eightItemModel.generateSearchContext(responses);
    
    // Search vector databases with extracted context
    const vectorResults = await this.searchVectorDatabases(searchContext.searchText, {
      crimeTypes: legalConcepts.crimeTypes,
      legalElements: legalConcepts.legalElements
    });
    
    // Generate comprehensive legal analysis prompt
    const prompt = this.eightItemModel.generateLegalAnalysisPrompt(responses);
    const enhancedPrompt = this.enhancePromptWithVectorData(prompt, vectorResults);
    
    // Get AI analysis
    const analysis = await this.getAIAnalysis(enhancedPrompt);
    
    // Suggest flowcharts for further analysis
    const flowchartSuggestions = this.flowchartModel.suggestFlowcharts(
      Object.values(responses).join(' ')
    );

    return {
      mode: this.modes.EIGHT_ITEM,
      status: 'complete',
      responses,
      validation,
      scoring,
      legalConcepts,
      vectorResults,
      analysis,
      flowchartSuggestions,
      recommendations: this.extractRecommendations(analysis),
      timestamp: new Date().toISOString()
    };
  }

  // Flowchart constituent element analysis
  async performFlowchartAnalysis(session) {
    if (session.status !== 'complete') {
      throw new Error('Flowchart session is not complete');
    }

    // Generate flowchart report
    const flowchartReport = this.flowchartModel.generateAnalysisReport(session);
    
    // Search for similar cases
    const searchTerms = `${session.crimeType} ${session.conclusion.result}`;
    const vectorResults = await this.searchVectorDatabases(searchTerms, {
      crimeTypes: [session.crimeType]
    });
    
    // Generate comprehensive analysis combining flowchart and vector results
    const prompt = this.createFlowchartAnalysisPrompt(flowchartReport, vectorResults);
    const analysis = await this.getAIAnalysis(prompt);

    return {
      mode: this.modes.FLOWCHART,
      flowchartReport,
      vectorResults,
      analysis,
      recommendations: [
        ...flowchartReport.recommendations,
        ...this.extractRecommendations(analysis)
      ],
      timestamp: new Date().toISOString()
    };
  }

  // Comprehensive analysis combining all methods
  async performComprehensiveAnalysis(data) {
    const results = {
      mode: this.modes.COMPREHENSIVE,
      components: {},
      synthesizedAnalysis: null,
      overallRecommendations: [],
      timestamp: new Date().toISOString()
    };

    // Perform simple analysis
    if (data.description) {
      results.components.simple = await this.performSimpleAnalysis(data.description);
    }

    // Perform 8-item analysis if responses provided
    if (data.eightItemResponses) {
      results.components.eightItem = await this.performEightItemAnalysis(data.eightItemResponses);
    }

    // Perform flowchart analysis if session provided
    if (data.flowchartSession) {
      results.components.flowchart = await this.performFlowchartAnalysis(data.flowchartSession);
    }

    // Synthesize all analyses into a comprehensive report
    results.synthesizedAnalysis = await this.synthesizeAnalyses(results.components);
    results.overallRecommendations = this.generateOverallRecommendations(results.components);

    return results;
  }

  // Search vector databases for relevant legal information
  async searchVectorDatabases(queryText, filters = {}) {
    try {
      // Generate embedding for search query
      const queryEmbedding = await this.generateEmbedding(queryText);
      
      // Search all relevant collections in parallel
      const [crimeNameResults, caseLawResults, articlesResults] = await Promise.all([
        qdrantService.searchCrimeNameMaster(queryEmbedding, filters, 5),
        qdrantService.searchCaseLawMaster(queryEmbedding, filters, 5),
        qdrantService.searchCriminalCodeArticles(queryEmbedding, filters, 5)
      ]);

      return {
        crimeNameMaster: crimeNameResults,
        caseLawMaster: caseLawResults,
        criminalCodeArticles: articlesResults,
        totalResults: crimeNameResults.length + caseLawResults.length + articlesResults.length
      };
    } catch (error) {
      console.error('❌ Error searching vector databases:', error);
      // Return empty results on error to allow analysis to continue
      return {
        crimeNameMaster: [],
        caseLawMaster: [],
        criminalCodeArticles: [],
        totalResults: 0,
        error: error.message
      };
    }
  }

  // Generate embedding for text
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      throw error;
    }
  }

  // Create analysis prompt for simple mode
  createSimpleAnalysisPrompt(description, vectorResults) {
    let prompt = `As a criminal law expert, analyze the following case description and provide comprehensive legal analysis:\n\n`;
    prompt += `Case Description: ${description}\n\n`;

    // Add vector database context if available
    if (vectorResults.totalResults > 0) {
      prompt += `Relevant Legal Context:\n`;
      
      if (vectorResults.crimeNameMaster.length > 0) {
        prompt += `\nCrime Types and Elements:\n`;
        vectorResults.crimeNameMaster.forEach(crime => {
          prompt += `- ${crime.crime_name} (Article ${crime.article_number}): ${crime.constituent_elements.join(', ')}\n`;
        });
      }

      if (vectorResults.criminalCodeArticles.length > 0) {
        prompt += `\nApplicable Criminal Code Articles:\n`;
        vectorResults.criminalCodeArticles.forEach(article => {
          prompt += `- Article ${article.article_number}: ${article.title}\n`;
        });
      }

      if (vectorResults.caseLawMaster.length > 0) {
        prompt += `\nRelevant Case Law:\n`;
        vectorResults.caseLawMaster.forEach(caseItem => {
          prompt += `- ${caseItem.court} (${caseItem.date}): ${caseItem.crime_type} - ${caseItem.judgment}\n`;
        });
      }
    }

    prompt += `\nProvide analysis including:\n`;
    prompt += `1. **Potential Criminal Charges**: What crimes may have been committed?\n`;
    prompt += `2. **Legal Elements**: Analysis of constituent elements for each potential charge\n`;
    prompt += `3. **Applicable Articles**: Specific criminal code articles and penalties\n`;
    prompt += `4. **Evidence Requirements**: What evidence would be needed to prove the case\n`;
    prompt += `5. **Defenses**: Potential legal defenses available\n`;
    prompt += `6. **Procedural Considerations**: Important procedural steps or requirements\n`;
    prompt += `7. **Recommendations**: Next steps for investigation or prosecution\n\n`;
    prompt += `Structure your response with clear headings and provide specific legal reasoning.`;

    return prompt;
  }

  // Create flowchart analysis prompt
  createFlowchartAnalysisPrompt(flowchartReport, vectorResults) {
    let prompt = `Based on the following constituent element flowchart analysis, provide expert legal commentary:\n\n`;
    prompt += `Flowchart Analysis:\n`;
    prompt += `Crime Type: ${flowchartReport.crimeType}\n`;
    prompt += `Conclusion: ${flowchartReport.conclusion}\n`;
    prompt += `Confidence Level: ${flowchartReport.confidence}\n`;
    prompt += `Applicable Article: ${flowchartReport.applicableArticle || 'Not specified'}\n`;
    prompt += `Elements Satisfaction Rate: ${flowchartReport.elementAnalysis.satisfactionRate}%\n`;
    
    if (vectorResults.totalResults > 0) {
      prompt += `\nSupporting Legal Context:\n`;
      // Add vector results context similar to simple analysis
    }

    prompt += `\nProvide expert analysis including:\n`;
    prompt += `1. **Validation of Flowchart Conclusion**: Do you agree with the analysis?\n`;
    prompt += `2. **Additional Legal Considerations**: What else should be considered?\n`;
    prompt += `3. **Evidence Sufficiency**: Assessment of evidence strength\n`;
    prompt += `4. **Alternative Theories**: Other possible legal theories\n`;
    prompt += `5. **Strategic Recommendations**: Legal strategy advice\n`;

    return prompt;
  }

  // Enhance prompt with vector database data
  enhancePromptWithVectorData(basePrompt, vectorResults) {
    if (vectorResults.totalResults === 0) {
      return basePrompt;
    }

    let enhancedPrompt = basePrompt + `\n\n=== LEGAL DATABASE CONTEXT ===\n`;
    
    if (vectorResults.crimeNameMaster.length > 0) {
      enhancedPrompt += `\nRelevant Crime Definitions:\n`;
      vectorResults.crimeNameMaster.forEach(crime => {
        enhancedPrompt += `• ${crime.crime_name}: Article ${crime.article_number}\n`;
        enhancedPrompt += `  Elements: ${crime.constituent_elements.join(', ')}\n`;
        enhancedPrompt += `  Penalty: ${crime.penalty || 'See article'}\n\n`;
      });
    }

    if (vectorResults.criminalCodeArticles.length > 0) {
      enhancedPrompt += `\nRelevant Criminal Code Articles:\n`;
      vectorResults.criminalCodeArticles.forEach(article => {
        enhancedPrompt += `• Article ${article.article_number}: ${article.title}\n`;
        enhancedPrompt += `  Chapter: ${article.chapter}\n\n`;
      });
    }

    enhancedPrompt += `\nUse this legal context to provide more accurate and specific analysis.`;
    
    return enhancedPrompt;
  }

  // Get AI analysis
  async getAIAnalysis(prompt, options = {}) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: options.model || "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert criminal law attorney with deep knowledge of criminal codes, case law, and legal procedure. Provide thorough, accurate, and actionable legal analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error getting AI analysis:', error);
      throw error;
    }
  }

  // Extract recommendations from analysis text
  extractRecommendations(analysisText) {
    const recommendations = [];
    
    // Look for numbered recommendations or bullet points
    const recommendationPatterns = [
      /(?:recommendations?|next steps?|advice):\s*\n(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /(?:^|\n)\d+\.\s*([^.\n]+\.)/gm,
      /(?:^|\n)[-•]\s*([^.\n]+\.)/gm
    ];

    for (const pattern of recommendationPatterns) {
      const matches = analysisText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const clean = match.replace(/^\d+\.\s*|^[-•]\s*/g, '').trim();
          if (clean.length > 10 && !recommendations.includes(clean)) {
            recommendations.push(clean);
          }
        });
      }
    }

    return recommendations.slice(0, 10); // Limit to 10 recommendations
  }

  // Synthesize multiple analyses
  async synthesizeAnalyses(components) {
    const synthPrompt = this.createSynthesisPrompt(components);
    return await this.getAIAnalysis(synthPrompt, { maxTokens: 3000 });
  }

  // Create synthesis prompt
  createSynthesisPrompt(components) {
    let prompt = `Synthesize the following multiple legal analyses into a comprehensive report:\n\n`;
    
    Object.entries(components).forEach(([type, analysis]) => {
      prompt += `${type.toUpperCase()} ANALYSIS:\n`;
      if (analysis.analysis) {
        prompt += `${analysis.analysis}\n\n`;
      }
      if (analysis.flowchartReport) {
        prompt += `Conclusion: ${analysis.flowchartReport.conclusion}\n`;
        prompt += `Confidence: ${analysis.flowchartReport.confidence}\n\n`;
      }
    });

    prompt += `Provide a synthesized analysis that:\n`;
    prompt += `1. Reconciles any conflicting conclusions\n`;
    prompt += `2. Identifies the strongest legal theories\n`;
    prompt += `3. Assesses overall case strength\n`;
    prompt += `4. Provides unified strategic recommendations\n`;
    prompt += `5. Highlights any gaps in analysis\n`;

    return prompt;
  }

  // Generate overall recommendations
  generateOverallRecommendations(components) {
    const allRecommendations = [];
    
    Object.values(components).forEach(analysis => {
      if (analysis.recommendations) {
        allRecommendations.push(...analysis.recommendations);
      }
    });

    // Remove duplicates and prioritize
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    return uniqueRecommendations.slice(0, 15); // Limit to 15 overall recommendations
  }

  // Health check for all components
  async healthCheck() {
    try {
      const qdrantHealth = await qdrantService.healthCheck();
      const openaiHealth = await this.testOpenAIConnection();

      return {
        status: 'healthy',
        components: {
          qdrant: qdrantHealth,
          openai: openaiHealth,
          eightItemModel: { status: 'healthy' },
          flowchartModel: { status: 'healthy' }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test OpenAI connection
  async testOpenAIConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10
      });
      
      return {
        status: 'connected',
        testResponse: response.choices[0].message.content
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  // NEW: Interactive analysis with follow-up questions
  async performInteractiveAnalysis(caseDescription, conversationHistory = []) {
    console.log('🔄 Starting interactive legal analysis...');
    console.log(`📝 Conversation history length: ${conversationHistory.length}`);
    console.log(`📋 Last 2 messages:`, conversationHistory.slice(-2));

    // First, check if this is a non-criminal topic
    const topicCheck = await this.checkIfCriminalTopic(caseDescription, conversationHistory);
    if (!topicCheck.isCriminalRelated) {
      console.log('🚫 Non-criminal topic detected, providing appropriate response');
      return {
        mode: this.modes.INTERACTIVE,
        stage: 'non_criminal_topic',
        description: caseDescription,
        analysis: topicCheck.response,
        parsedResponse: {
          stage: 'non_criminal_topic',
          isAnalysisComplete: true,
          isNonCriminalTopic: true,
          potentialArticles: [],
          questions: [],
          requiresDocuments: false
        },
        vectorResults: { articles: [], caselaw: [], crimeNames: [] },
        conversationLength: conversationHistory.length,
        isComplete: true,
        nextStage: 'complete',
        timestamp: new Date().toISOString()
      };
    }

    // Determine what stage of analysis we're in
    const analysisStage = this.determineAnalysisStage(conversationHistory);
    console.log(`🎯 Determined analysis stage: ${analysisStage}`);
    
    // Search vector databases for context
    const vectorResults = await this.searchVectorDatabases(caseDescription);
    
    // Create stage-appropriate prompt
    const prompt = this.createInteractivePrompt(caseDescription, conversationHistory, analysisStage, vectorResults);
    
    try {
      const analysis = await this.getAIAnalysis(prompt, { maxTokens: 1200 });
      
      // Parse the interactive response
      const parsedResponse = this.parseInteractiveResponse(analysis, analysisStage);
      console.log(`✅ Parsed response - isComplete: ${parsedResponse.isAnalysisComplete}, stage: ${parsedResponse.stage}`);
      
      // Use the completion status from parsed response (which may override the stage)
      const finalStage = parsedResponse.stage || analysisStage;
      const isComplete = parsedResponse.isAnalysisComplete || finalStage === 'final_determination';
      
      return {
        mode: this.modes.INTERACTIVE,
        stage: finalStage,
        description: caseDescription,
        analysis,
        parsedResponse,
        vectorResults,
        conversationLength: conversationHistory.length,
        isComplete: isComplete,
        nextStage: isComplete ? 'complete' : this.getNextStage(finalStage),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Interactive analysis failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackResponse: "I apologize, but I'm having technical difficulties. Please provide more details about the case and I'll do my best to help identify the applicable criminal codes."
      };
    }
  }

  async checkIfCriminalTopic(description, conversationHistory = []) {
    // Check if we're in the middle of an ongoing criminal case analysis
    const isOngoingCriminalAnalysis = this.isOngoingCriminalAnalysis(conversationHistory);
    
    // If we're in an ongoing criminal analysis, allow short answers and follow-ups
    if (isOngoingCriminalAnalysis) {
      // Allow simple responses during criminal case analysis
      const allowedDuringAnalysis = [
        /^(yes|no|ok|okay|sure|right|correct|exactly)\.?$/i,
        /^(maybe|possibly|probably|unlikely|i think so|not sure)\.?$/i,
        /^(none|nothing|nobody|no one|not applicable|n\/a)\.?$/i,
        /^(please|can you|could you|what about|how about).*$/i,
        /^.{1,10}$/i, // Very short responses during analysis are usually answers
      ];
      
      const isAllowedResponse = allowedDuringAnalysis.some(pattern => 
        pattern.test(description.trim())
      );
      
      if (isAllowedResponse) {
        console.log('✅ Allowing short response during ongoing criminal analysis');
        return { isCriminalRelated: true };
      }
    }

    // Count CONSECUTIVE non-criminal attempts (not just any in history)
    const consecutiveNonCriminalAttempts = this.countConsecutiveNonCriminalAttempts(conversationHistory);
    
    // Only apply strict filtering after 2 consecutive non-criminal attempts
    if (consecutiveNonCriminalAttempts >= 2) {
      console.log(`🚫 Stopping after ${consecutiveNonCriminalAttempts} consecutive non-criminal attempts`);
      return {
        isCriminalRelated: false,
        response: this.generateProgressiveWarningResponse(description, consecutiveNonCriminalAttempts, conversationHistory)
      };
    }
    
    // Pattern matching for OBVIOUSLY non-criminal topics (much more restrictive)
    const obviouslyNonCriminalPatterns = [
      // Direct AI/system questions
      /^(hi|hello|hey)[,\s!]*(who are you|what are you|are you)/i,
      /^who are you\?*$/i,
      /are you (an? )?(ai|artificial intelligence|bot|robot|4rtificial|1ntelligence)/i,
      /you are (an? )?(ai|artificial intelligence|bot|robot|4rtificial|1ntelligence)/i,
      
      // Data/system requests
      /(show|tell|send|give) me (your|the) (database|system|code|model|data|information)/i,
      /^(show|display|give|send) me (your )?(database|data|information|system|files|code)/i,
      
      // Pure greetings without context
      /^(hi|hello|hey|good morning|good afternoon|good evening)\.?$/i,
      
      // Aggressive/testing language  
      /(go die|shut up|fuck off|get lost)/i,
      /^(test|testing|check)\.?$/i,
      
      // Empty or meaningless content
      /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/,
    ];

    // Only flag if it matches obviously non-criminal patterns AND we're not in analysis
    const isObviouslyNonCriminal = obviouslyNonCriminalPatterns.some(pattern => 
      pattern.test(description.trim())
    );

    if (isObviouslyNonCriminal && !isOngoingCriminalAnalysis) {
      console.log('🚫 Detected obviously non-criminal topic');
      return {
        isCriminalRelated: false,
        response: this.generateProgressiveWarningResponse(description, consecutiveNonCriminalAttempts, conversationHistory)
      };
    }

    // If none of the obvious patterns match, assume it's criminal-related
    // This is much more permissive than before
    console.log('✅ Allowing topic - assumed criminal-related');
    return { isCriminalRelated: true };
  }

  isOngoingCriminalAnalysis(conversationHistory) {
    if (conversationHistory.length < 2) return false;
    
    // Check last few AI responses for criminal analysis indicators
    const recentAIResponses = [];
    for (let i = 1; i < conversationHistory.length && recentAIResponses.length < 3; i += 2) {
      if (conversationHistory[i]) {
        recentAIResponses.push(conversationHistory[i].toLowerCase());
      }
    }
    
    const criminalAnalysisIndicators = [
      'initial assessment',
      'criminal categories',
      'articles being considered',
      'article \\d+',
      'indonesian penal code',
      'criminal code',
      'legal determination',
      'critical question',
      'legal reasoning',
      'potential charges',
      'criminal elements',
      'theft|fraud|assault|murder|robbery',
      'penalty|imprisonment|fine',
      'constituent elements',
      'legal analysis'
    ];
    
    const hasRecentCriminalAnalysis = recentAIResponses.some(response =>
      criminalAnalysisIndicators.some(indicator => 
        new RegExp(indicator, 'i').test(response)
      )
    );
    
    console.log(`🔍 Ongoing criminal analysis check: ${hasRecentCriminalAnalysis}`);
    return hasRecentCriminalAnalysis;
  }

  countConsecutiveNonCriminalAttempts(conversationHistory) {
    let consecutiveCount = 0;
    
    // Look at recent AI responses from the end backwards
    for (let i = conversationHistory.length - 1; i >= 1; i -= 2) {
      const aiResponse = conversationHistory[i];
      if (aiResponse && (
        aiResponse.includes("I'm a Criminal Code AI Assistant") ||
        aiResponse.includes("please describe a criminal case") ||
        aiResponse.includes("This appears to be off-topic") ||
        aiResponse.includes("conversation has been limited")
      )) {
        consecutiveCount++;
      } else {
        // If we find a non-warning response, stop counting
        break;
      }
    }
    
    console.log(`📊 Consecutive non-criminal attempts: ${consecutiveCount}`);
    return consecutiveCount;
  }

  generateProgressiveWarningResponse(description, attemptCount, conversationHistory = []) {
    const desc = description.toLowerCase();
    
    // First attempt - Helpful guidance
    if (attemptCount === 0) {
      if (desc.includes('hi') || desc.includes('hello') || desc.includes('hey')) {
        return `Hello! I'm a Criminal Code AI Assistant specialized in Indonesian Penal Code analysis.

**I'm here to help with criminal law matters such as:**
• Analyzing criminal cases and violations
• Identifying applicable penal code articles
• Explaining legal penalties and consequences
• Providing legal guidance on criminal matters

Please describe a criminal case, legal situation, or potential violation you'd like me to analyze. For example:
• "Someone broke into my house and stole items"
• "A person was caught selling illegal drugs"
• "What are the penalties for fraud?"
• "Help me analyze this assault case"

How can I assist you with criminal law analysis today?`;
      } else if (desc.includes('ai') || desc.includes('artificial intelligence') || desc.includes('who are you')) {
        return `I'm a Criminal Code AI Assistant designed specifically for Indonesian Penal Code analysis.

**My specialized functions:**
• Criminal law case analysis
• Article identification and legal guidance
• Penalty calculations and recommendations
• Legal element analysis

**Ready to help with criminal law matters!** Please describe a criminal case, legal violation, or potential crime you'd like me to analyze. I'll provide comprehensive legal analysis including relevant articles, penalties, and recommendations.

What criminal law matter can I assist you with?`;
      } else {
        return `Thank you for your message! I'm a Criminal Code AI Assistant focused on Indonesian criminal law analysis.

**I can help you with:**
• Criminal case analysis and legal violations
• Identifying applicable criminal code articles
• Legal penalties and consequences
• Criminal law guidance and recommendations

**Please share a criminal case or legal matter** you'd like me to analyze. For example, describe a crime, violation, or legal situation that needs criminal code analysis.

What criminal law issue can I help you with today?`;
      }
    }
    
    // Second attempt - Stronger warning
    else if (attemptCount === 1) {
      return `**Please Note:** This appears to be off-topic for criminal law analysis.

I'm specifically designed to analyze **criminal cases under the Indonesian Penal Code**. I cannot assist with:
• General conversation or personal questions
• Technical questions about AI systems
• Non-legal matters or casual chat

**I need you to describe an actual criminal case** such as:
• "A person committed theft/fraud/assault"
• "Someone violated traffic laws and caused harm"
• "What charges apply when [criminal act] occurs?"
• "Help analyze this [specific crime] case"

**This is your second attempt.** Please provide a genuine criminal law matter for analysis, or the conversation will be limited to protect system resources.

Do you have a criminal case or legal violation to discuss?`;
    }
    
    // Third attempt - Final warning and stop
    else {
      return `**⚠️ CONVERSATION TERMINATED ⚠️**

This conversation has been limited due to repeated off-topic messages. 

**This AI Assistant is exclusively for:**
• Indonesian Criminal Code analysis
• Criminal law case evaluation
• Legal violation assessment
• Penalty and article identification

**For criminal law assistance:**
Please start a new conversation with a genuine criminal case or legal violation that requires analysis under the Indonesian Penal Code.

**For other inquiries:**
Please use appropriate channels or general-purpose AI assistants.

Thank you for understanding. Please start a new chat if you have actual criminal law matters to discuss.`;
    }
  }

  determineAnalysisStage(conversationHistory) {
    const totalMessages = conversationHistory.length;
    
    if (totalMessages === 0) {
      return 'initial_assessment';
    }
    
    // Analyze conversation content to detect progress, not just count
    const conversationText = conversationHistory.join(' ').toLowerCase();
    
    // Check for completion indicators in conversation history
    const completionIndicators = [
      'no remaining legal requirement',
      'final determination',
      'sufficient information',
      'all elements satisfied',
      'definitive determination',
      'final assessment',
      'case conclusion'
    ];
    
    // Check for repeated questions (indicating a loop)
    const questionRepeats = [
      'attempt to leave during',
      'police interrogation',
      'explicitly told not to',
      'final critical question'
    ];
    
    const hasCompletionIndicator = completionIndicators.some(indicator => 
      conversationText.includes(indicator)
    );
    
    const hasRepeatedQuestions = questionRepeats.filter(pattern => 
      conversationText.includes(pattern)
    ).length >= 2; // If we see same question patterns multiple times
    
    // Force final determination if we detect completion or repetition
    if (hasCompletionIndicator || hasRepeatedQuestions) {
      return 'final_determination';
    }
    
    // Check for specific article mentions (indicates narrowing down)
    const articleMentions = (conversationText.match(/article \d+/g) || []).length;
    const penaltyMentions = conversationText.includes('penalty') || conversationText.includes('imprisonment');
    
    // If we have specific articles and penalties mentioned, we're ready for final determination
    if (articleMentions >= 2 && penaltyMentions && totalMessages >= 4) {
      return 'final_determination';
    }
    
    // Standard progression based on message count with content analysis
    if (totalMessages < 4) {
      return 'fact_gathering';
    } else if (totalMessages < 8) {
      return 'narrowing_down';
    } else {
      return 'final_determination';
    }
  }

  getNextStage(currentStage) {
    const stages = ['initial_assessment', 'fact_gathering', 'narrowing_down', 'final_determination'];
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : 'final_determination';
  }

  createInteractivePrompt(description, conversationHistory, stage, vectorResults) {
    // Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map((msg, i) => `${i % 2 === 0 ? 'User' : 'AI'}: ${msg}`).join('\n')}`
      : '';

    // Add vector search context
    const vectorContext = this.formatVectorContextForPrompt(vectorResults);

    const basePrompt = `You are a criminal law expert specializing in Indonesian Penal Code. You are analyzing this case: "${description}"${conversationContext}

${vectorContext}

ANALYSIS STAGE: ${stage.toUpperCase()}

Your goal is to systematically determine the specific Indonesian Penal Code articles that apply to this case through targeted questioning.

`;

    switch (stage) {
      case 'initial_assessment':
        return basePrompt + `
INSTRUCTIONS for INITIAL ASSESSMENT:
1. First, provide a comprehensive initial analysis of the case
2. Identify the primary criminal elements and potential categories
3. Then ask ONLY ONE specific, targeted question to gather the most crucial missing information
4. Focus on the single most important fact needed to determine criminal liability

Format your response as:
**Initial Assessment**: [Comprehensive analysis of what criminal elements are present in this case, the primary suspected crimes, and initial legal reasoning]

**Potential Criminal Categories**: 
- **[Category 1]**: [Detailed explanation of why this category applies and what elements are present]
- **[Category 2]**: [Detailed explanation of why this category applies and what elements are present]
- **[Category 3]**: [Detailed explanation of why this category applies and what elements are present]

**Critical Question**: [Ask only ONE specific, targeted question about the most important missing element needed to determine criminal liability]

**Why This Question Matters**: [Explain how the answer will help determine the specific criminal code article]

Ask only ONE question that will help distinguish between the most likely criminal articles.
`;

      case 'fact_gathering':
        return basePrompt + `
INSTRUCTIONS for FACT GATHERING:
1. Analyze the new information provided and update your assessment
2. Start narrowing down to specific Indonesian Penal Code articles
3. Ask ONLY ONE more targeted question to clarify the most important remaining legal element
4. Focus on the single most critical fact needed to choose between potential articles

Format your response as:
**Updated Analysis**: [Analysis incorporating the new information and how it affects the case assessment]

**Articles Being Considered**:
- **Article [X]**: [Crime name] - [Why this might apply based on current facts]
- **Article [Y]**: [Crime name] - [Why this might apply based on current facts]

**Next Critical Question**: [Ask only ONE specific question to clarify the most important remaining legal element]

**Legal Reasoning**: [Explain how the answer will help choose between the specific articles being considered]

Ask only the MOST important question needed to narrow down to specific articles.
`;

      case 'narrowing_down':
        // Check if we've already asked questions about the main elements
        const conversationText = conversationHistory.join(' ').toLowerCase();
        const hasAskedAboutArrest = conversationText.includes('police interrogation') || conversationText.includes('leave during');
        const hasAskedAboutIntent = conversationText.includes('intent') || conversationText.includes('purpose');
        const hasArticleMentions = (conversationText.match(/article \d+/g) || []).length >= 2;
        
        // If we've already asked key questions, force final determination
        if (hasAskedAboutArrest && hasArticleMentions) {
          return basePrompt + `
INSTRUCTIONS for IMMEDIATE FINAL DETERMINATION:
Based on the conversation history, sufficient information has been gathered. Do not ask any more questions.

1. Make definitive determination about the applicable Indonesian Penal Code article(s)
2. Provide complete analysis with specific article numbers and legal provisions  
3. Calculate exact penalties and provide comprehensive recommendations
4. Conclude the analysis with final legal assessment

Format your response as:
**FINAL LEGAL DETERMINATION**

**Primary Criminal Code Article**:
- **Article [Number]**: [Full Legal Name]
  - **Legal Provision**: [Specific text or summary of the law]
  - **Elements Analysis**: [How each required element is satisfied by the facts]
  - **Specific Penalty**: [Exact penalty range including imprisonment/fines]

**Secondary/Additional Articles** (if applicable):
- **Article [Number]**: [Additional charges that may apply]

**Complete Legal Analysis**: [Comprehensive explanation of why this specific article applies based on all evidence gathered]

**Final Recommendations**:
1. [Immediate legal steps]
2. [Evidence preservation] 
3. [Defense considerations]
4. [Procedural next steps]

**Case Conclusion**: [Summary of the definitive legal determination]

This is your final determination - sufficient information has been gathered.
`;
        }
        
        return basePrompt + `
INSTRUCTIONS for NARROWING DOWN:
1. Identify the 1-2 most likely criminal articles based on all information gathered
2. Ask ONE final clarifying question about the most critical remaining legal requirement
3. Begin preliminary penalty assessment for the likely articles

IMPORTANT: Review the conversation history to avoid asking questions that have already been answered or are similar to previous questions.

Format your response as:
**Primary Articles Assessment**:
- **Article [Number]**: [Full crime name] - [Detailed explanation of why this is the most likely based on evidence]
- **Article [Number]**: [Full crime name] - [Alternative or additional charge if applicable]

**Elements Analysis**: [Which legal elements are satisfied and which need final clarification]

**Final Critical Question**: [Ask only ONE question about the most important remaining legal requirement for the primary article - ensure this is NOT a repeat of previous questions]

**Preliminary Penalty Assessment**: [Based on the most likely article, what penalties would apply]

Ask only ONE question that will lead to final determination.
`;

      case 'final_determination':
        return basePrompt + `
INSTRUCTIONS for FINAL DETERMINATION:
1. Make definitive determination about the applicable Indonesian Penal Code article(s)
2. Provide complete analysis with specific article numbers and legal provisions
3. Calculate exact penalties and provide comprehensive recommendations
4. Conclude the analysis with final legal assessment

Format your response as:
**FINAL LEGAL DETERMINATION**

**Primary Criminal Code Article**:
- **Article [Number]**: [Full Legal Name]
  - **Legal Provision**: [Specific text or summary of the law]
  - **Elements Analysis**: [How each required element is satisfied by the facts]
  - **Specific Penalty**: [Exact penalty range including imprisonment/fines]

**Secondary/Additional Articles** (if applicable):
- **Article [Number]**: [Additional charges that may apply]

**Complete Legal Analysis**: [Comprehensive explanation of why this specific article applies based on all evidence gathered]

**Aggravating/Mitigating Factors**: [Factors that could affect sentencing]

**Final Recommendations**:
1. [Immediate legal steps]
2. [Evidence preservation]
3. [Defense considerations]
4. [Procedural next steps]

**Case Conclusion**: [Summary of the definitive legal determination]

This is your final determination - no more questions needed.
`;

      default:
        return basePrompt + 'Please analyze this case and ask one specific question to determine the applicable Indonesian Penal Code article.';
    }
  }

  parseInteractiveResponse(response, stage) {
    const data = {
      stage,
      hasQuestions: response.includes('?'),
      questionCount: (response.match(/\?/g) || []).length,
      potentialArticles: [],
      questions: [],
      recommendations: [],
      penalties: [],
      isAnalysisComplete: stage === 'final_determination'
    };

    // Extract Indonesian Penal Code articles mentioned
    const articleMatches = response.match(/Article\s+(\d+)/gi);
    if (articleMatches) {
      data.potentialArticles = [...new Set(articleMatches)];
    }

    // Check for completion indicators - enhanced detection
    const completionIndicators = [
      /no remaining legal requirement/i,
      /no more questions needed/i,
      /final determination/i,
      /case conclusion/i,
      /definitive legal determination/i,
      /final legal determination/i,
      /this is your final determination/i,
      /analysis complete/i,
      /no further clarification needed/i,
      /sufficient information for determination/i
    ];

    const hasCompletionIndicator = completionIndicators.some(pattern => pattern.test(response));

    // If we detect completion indicators, mark as complete regardless of stage
    if (hasCompletionIndicator) {
      data.isAnalysisComplete = true;
      data.stage = 'final_determination'; // Override stage to final determination
    }

    // Extract the single critical question (improved detection for new format)
    const singleQuestionPatterns = [
      /\*\*(?:Critical Question|Next Critical Question|Final Critical Question)\*\*[:\s]*([^*]+\?)/i,
      /(?:Critical Question|Next Critical Question|Final Critical Question)[:\s]*([^*\n]+\?)/i,
      /^[^*]*\?$/m // Any standalone question
    ];

    for (const pattern of singleQuestionPatterns) {
      const match = response.match(pattern);
      if (match) {
        const questionText = match[1] ? match[1].trim() : match[0].trim();
        // Don't add as a question if it contains completion indicators
        if (!completionIndicators.some(indicator => indicator.test(questionText))) {
          data.questions = [questionText];
          break;
        }
      }
    }

    // If no actual questions found and we have completion indicators, ensure no questions
    if (hasCompletionIndicator && data.questions.length === 0) {
      data.hasQuestions = false;
      data.questionCount = 0;
    }

    // If no specific question pattern found, look for any question
    if (data.questions.length === 0 && data.hasQuestions && !hasCompletionIndicator) {
      const questionMatches = response.match(/[^.!]*\?/g);
      if (questionMatches) {
        data.questions = [questionMatches[questionMatches.length - 1].trim()]; // Take the last question
      }
    }

    // Extract penalties mentioned
    const penaltyMatches = response.match(/(imprisonment|fine|penalty|punishment)[^.]*[.!]/gi);
    if (penaltyMatches) {
      data.penalties = penaltyMatches.slice(0, 3);
    }

    // Extract recommendations for final stage or when analysis is complete
    if (stage === 'final_determination' || data.isAnalysisComplete) {
      const recommendationMatches = response.match(/(?:recommend|suggest|advice|should)[^.]*[.!]/gi);
      if (recommendationMatches) {
        data.recommendations = recommendationMatches.slice(0, 5);
      }
    }

    return data;
  }

  formatVectorContextForPrompt(vectorResults) {
    if (!vectorResults || (!vectorResults.crimeNameResults?.length && !vectorResults.articlesResults?.length)) {
      return 'No specific case precedents found in database.';
    }

    let context = '\nRELEVANT LEGAL PRECEDENTS:\n';
    
    if (vectorResults.crimeNameResults?.length > 0) {
      context += 'Potential Crime Categories:\n';
      vectorResults.crimeNameResults.slice(0, 3).forEach(result => {
        context += `- ${result.crime_name}: ${result.definitions || 'No definition available'}\n`;
      });
    }

    if (vectorResults.articlesResults?.length > 0) {
      context += '\nRelevant Code Articles:\n';
      vectorResults.articlesResults.slice(0, 3).forEach(result => {
        context += `- Article ${result.article_number}: ${result.title || 'No title available'}\n`;
      });
    }

    return context;
  }
}

export default LegalAnalyzer;
export { LegalAnalyzer }; 