'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, X } from 'lucide-react';
import PDFViewer from './PDFViewer';

export default function ChatInterface() {
  // Core chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  // Analysis configuration
  const [analysisMode, setAnalysisMode] = useState('simple_chat'); // simple_chat or interactive
  const [conversationHistory, setConversationHistory] = useState([]);
  const [enabledPDFsCount, setEnabledPDFsCount] = useState(0);
  
  // UI state for modals and interactions
  const [articleClickNotification, setArticleClickNotification] = useState('');
  const [articlePreview, setArticlePreview] = useState(null);
  const [pdfViewer, setPdfViewer] = useState({ isOpen: false, pdfUrl: '', searchTerm: '', initialPage: 1 });
  const [tooltipMessage, setTooltipMessage] = useState(null); // Track which message has full analysis modal open
  
  // Refs for scroll management
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Get enabled PDFs count for display
  const getEnabledPDFsCount = () => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') return 0;
    
    try {
      const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
      return savedPDFs.filter(pdf => pdf.isEnabled).length;
    } catch {
      return 0;
    }
  };

  // Update enabled PDFs count on mount and when storage changes
  useEffect(() => {
    if (!isMounted) return;
    
    const updateCount = () => setEnabledPDFsCount(getEnabledPDFsCount());
    updateCount();
    
    // Listen for storage changes
    window.addEventListener('storage', updateCount);
    
    // Custom event for same-tab updates
    window.addEventListener('pdfsUpdated', updateCount);
    
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('pdfsUpdated', updateCount);
    };
  }, [isMounted]);

  // Update welcome message when enabled PDFs count changes - FIXED: removed messages from dependencies
  useEffect(() => {
    if (isMounted && enabledPDFsCount >= 0 && messages.length > 0) {
      // Only update if we have the initial message and it's already set
      setMessages(prev => {
        if (prev.length > 0 && prev[0].id === 'initial') {
          const currentEnabledCount = enabledPDFsCount;
          
          return [
            {
              ...prev[0],
              content: analysisMode === 'interactive' 
                ? `Hello! I'm your Criminal Code AI Assistant in Interactive Analysis Mode. 

**Current Status:** ${currentEnabledCount > 0 
    ? `📚 ${currentEnabledCount} PDF document${currentEnabledCount !== 1 ? 's' : ''} enabled for analysis` 
    : '⚠️ No PDF documents currently enabled - Limited mode active'}

${currentEnabledCount > 0 
    ? `**How it works with enabled documents:**
1. **Initial Assessment** - I'll provide comprehensive analysis and identify potential criminal categories
2. **Fact Gathering** - I'll ask one targeted question to clarify the most important legal elements  
3. **Narrowing Down** - We'll focus on 1-2 most likely articles with one final verification question
4. **Final Determination** - I'll provide specific articles, penalties, and comprehensive recommendations

**My approach:** Each response will include detailed legal analysis followed by ONE critical question that will help determine the exact criminal code articles. I'll continue asking questions until we reach a definitive legal determination.

Please describe the criminal case or situation you'd like me to analyze, and I'll start with a comprehensive assessment followed by the most important question.`
    : `**Limited Mode Notice:**
Currently no criminal code documents are enabled. I can provide general legal education and concepts, but cannot cite specific articles or make definitive legal determinations.

**To enable full analysis:**
1. Go to "Document Management" tab
2. Upload criminal code PDF documents  
3. Enable the toggle switches for documents you want to use
4. Return here for complete interactive analysis

Please describe your case for general guidance, or enable documents for specific article determination.`}`
                : `Hello! I'm your Criminal Code AI Assistant in Simple Chat Mode.

**Current Status:** ${currentEnabledCount > 0 
    ? `📚 ${currentEnabledCount} PDF document${currentEnabledCount !== 1 ? 's' : ''} enabled for analysis` 
    : '⚠️ No PDF documents currently enabled - Limited mode active'}

${currentEnabledCount > 0 
    ? 'I can help you with legal analysis and provide guidance on criminal law matters based on your enabled documents.'
    : 'I can provide general legal education and concepts, but cannot cite specific articles without enabled documents. Please go to Document Management to enable PDFs for full analysis.'}

Please describe the criminal case or situation you'd like me to analyze.`
            },
            ...prev.slice(1)
          ];
        }
        return prev;
      });
    }
  }, [enabledPDFsCount, analysisMode, isMounted]); // Removed messages dependency to prevent loops

  // Initialize on client side only to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []); // Only run once

  // Set initial messages after component is mounted - COMPLETELY CLIENT-SIDE
  useEffect(() => {
    if (!isMounted) return;
    
    // Only set initial message if none exist (first load)
    if (messages.length === 0) {
      // Get PDF count only after mounting
      const currentEnabledCount = getEnabledPDFsCount();
      
      const getInitialMessage = (mode, count) => {
        if (mode === 'interactive') {
          return `Hello! I'm your Criminal Code AI Assistant in Interactive Analysis Mode. 

**Current Status:** ${count > 0 
    ? `📚 ${count} PDF document${count !== 1 ? 's' : ''} enabled for analysis` 
    : '⚠️ No PDF documents currently enabled - Limited mode active'}

${count > 0 
    ? `**How it works with enabled documents:**
1. **Initial Assessment** - I'll provide comprehensive analysis and identify potential criminal categories
2. **Fact Gathering** - I'll ask one targeted question to clarify the most important legal elements  
3. **Narrowing Down** - We'll focus on 1-2 most likely articles with one final verification question
4. **Final Determination** - I'll provide specific articles, penalties, and comprehensive recommendations

**My approach:** Each response will include detailed legal analysis followed by ONE critical question that will help determine the exact criminal code articles. I'll continue asking questions until we reach a definitive legal determination.

Please describe the criminal case or situation you'd like me to analyze, and I'll start with a comprehensive assessment followed by the most important question.`
    : `**Limited Mode Notice:**
Currently no criminal code documents are enabled. I can provide general legal education and concepts, but cannot cite specific articles or make definitive legal determinations.

**To enable full analysis:**
1. Go to "Document Management" tab
2. Upload criminal code PDF documents  
3. Enable the toggle switches for documents you want to use
4. Return here for complete interactive analysis

Please describe your case for general guidance, or enable documents for specific article determination.`}`;
        } else {
          return `Hello! I'm your Criminal Code AI Assistant in Simple Chat Mode.

**Current Status:** ${count > 0 
    ? `📚 ${count} PDF document${count !== 1 ? 's' : ''} enabled for analysis` 
    : '⚠️ No PDF documents currently enabled - Limited mode active'}

${count > 0 
    ? 'I can help you with legal analysis and provide guidance on criminal law matters based on your enabled documents.'
    : 'I can provide general legal education and concepts, but cannot cite specific articles without enabled documents. Please go to Document Management to enable PDFs for full analysis.'}

Please describe the criminal case or situation you'd like me to analyze.`;
        }
      };

      const initialMessage = {
        id: 'initial',
        type: 'bot',
        content: getInitialMessage(analysisMode, currentEnabledCount),
        timestamp: Date.now()
      };

      setMessages([initialMessage]);
      setEnabledPDFsCount(currentEnabledCount);
    }
  }, [isMounted, analysisMode]); // Remove messages dependency - only run when mounted or mode changes

  /**
   * Parse AI response to create condensed and full versions
   * Condensed version shows:
   * - For ongoing analysis: Brief case summary + critical question
   * - For final determination: Case conclusion + final recommendations
   */
  const parseAIResponse = (content) => {
    if (!content) return { condensed: content, full: content };

    // Check if this is a final determination by looking for completion indicators
    const isFinalDetermination = content.includes('FINAL LEGAL DETERMINATION') || 
                                 content.includes('Case Conclusion') || 
                                 content.includes('Final Recommendations');

    if (isFinalDetermination) {
      // For final determinations, show case conclusion and final recommendations
      let condensed = '';
      
      // Extract case conclusion (without the "Case Conclusion:" label)
      const conclusionMatch = content.match(/\*\*Case Conclusion\*\*[:\s]*(.+?)(?=\n\n\*\*|$)/is);
      if (conclusionMatch) {
        condensed += conclusionMatch[1].trim() + '\n\n';
      }
      
      // Extract final recommendations
      const recommendationsMatch = content.match(/\*\*Final Recommendations\*\*[:\s]*(.+?)(?=\n\n\*\*|$)/is);
      if (recommendationsMatch) {
        condensed += `**Final Recommendations**:\n${recommendationsMatch[1].trim()}`;
      }
      
      // If we couldn't extract specific parts, look for alternative patterns
      if (!condensed.trim()) {
        // Look for any paragraph that contains "Based on the evidence" or similar
        const paragraphs = content.split('\n\n');
        let conclusionText = '';
        let recommendationsText = '';
        
        for (const paragraph of paragraphs) {
          const cleanPara = paragraph.trim();
          if (cleanPara.includes('Based on the available evidence') || cleanPara.includes('final determination')) {
            conclusionText = cleanPara.replace(/\*\*Case Conclusion\*\*[:\s]*/i, '');
          }
          if (cleanPara.includes('Final Recommendations') || cleanPara.includes('1.') && cleanPara.includes('prosecution')) {
            recommendationsText = cleanPara.replace(/\*\*Final Recommendations\*\*[:\s]*/i, '');
          }
        }
        
        if (conclusionText) condensed += conclusionText + '\n\n';
        if (recommendationsText) condensed += `**Final Recommendations**:\n${recommendationsText}`;
      }
      
      // Function to make article numbers bold
      const makeArticlesBold = (text) => {
        return text.replace(/Article (\d+)/g, '**Article $1**');
      };
      
      return {
        condensed: makeArticlesBold(condensed.trim()) || content,
        full: content
      };
    } else {
      // For non-final analyses, use the original logic
      // Extract question from the content
      const questionMatch = content.match(/\*\*Question[:\s]*\*\*[:\s]*(.+?)(?=\n\n|\n\*\*|$)/is);
      const question = questionMatch ? questionMatch[1]?.trim() : '';
      
      // Create a simple summary from the content
      // Look for the main case description/summary, usually in the first substantial paragraph
      const paragraphs = content.split('\n\n').filter(p => p.trim() && !p.startsWith('**'));
      let summary = '';
      
      // Find the first substantial paragraph that describes the case
      for (const paragraph of paragraphs) {
        const cleanParagraph = paragraph.trim();
        if (cleanParagraph.length > 100 && !cleanParagraph.includes('**')) {
          summary = cleanParagraph;
          break;
        }
      }
      
      // If no good summary found, extract from initial assessment section
      if (!summary) {
        const initialAssessmentMatch = content.match(/\*\*Initial Assessment[:\s]*\*\*[:\s]*(.+?)(?=\n\n\*\*|$)/is);
        if (initialAssessmentMatch) {
          const assessmentContent = initialAssessmentMatch[1]?.trim();
          // Take first sentence or first 200 characters
          const sentences = assessmentContent.split(/[.!?]+/);
          summary = sentences[0]?.trim();
          if (summary && summary.length < 100 && sentences[1]) {
            summary += '. ' + sentences[1]?.trim();
          }
        }
      }
      
      // Fallback to first meaningful paragraph
      if (!summary) {
        summary = content.split('\n\n')[0]?.replace(/\*\*/g, '').trim() || '';
      }
      
      // Create condensed version with just summary and question
      let condensed = '';
      if (summary) {
        condensed = summary;
      }
      if (question) {
        condensed += (condensed ? '\n\n' : '') + question;
      }
      
      return {
        condensed: condensed.trim() || content,
        full: content
      };
    }
  };

  /**
   * Render markdown-style text with proper bold formatting
   * Converts **text** to React <strong> elements
   */
  const renderFormattedText = (text) => {
    if (!text) return text;
    
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }
      return part;
    });
  };

  const scrollToBottom = () => {
    // Use requestAnimationFrame for smooth scrolling and better control
    requestAnimationFrame(() => {
      if (messagesContainerRef.current && messagesEndRef.current) {
        // Get the container and target element
        const container = messagesContainerRef.current;
        const target = messagesEndRef.current;
        
        // Calculate the scroll position
        const containerHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;
        const targetOffset = target.offsetTop;
        
        // Scroll to the bottom smoothly
        container.scrollTo({
          top: scrollHeight - containerHeight,
          behavior: 'smooth'
        });
      }
    });
  };

  useEffect(() => {
    // Only scroll when component is mounted and messages exist
    if (isMounted && messages.length > 0) {
      // Add a delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, isMounted]); // Only depend on messages.length to prevent excessive re-renders
  
  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipMessage && event.target.classList.contains('bg-gray-900')) {
        setTooltipMessage(null);
      }
    };

    if (tooltipMessage) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tooltipMessage]);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Use consistent timestamp for both messages
    const messageTimestamp = Date.now();
    const userMessageId = `user_${messageTimestamp}`;

    const userMessage = {
      id: userMessageId,
      type: 'user',
      content: input.trim(),
      timestamp: messageTimestamp
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Get enabled PDFs from localStorage only if mounted
      let enabledPDFs = [];
      if (typeof window !== 'undefined') {
        try {
          const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
          enabledPDFs = savedPDFs.filter(pdf => pdf.isEnabled).map(pdf => pdf.fileName);
        } catch (error) {
          console.warn('Failed to parse localStorage PDFs:', error);
        }
      }
      
      // Determine which API to use based on analysis mode
      const apiEndpoint = analysisMode === 'interactive' ? '/api/legal/analyze' : '/api/chat';
      
      let requestBody;
      if (analysisMode === 'interactive') {
        // For interactive mode, use legal analyze API
        requestBody = {
          mode: 'interactive',
          data: {
            description: userMessage.content
          },
          conversationHistory: conversationHistory,
          enabledPDFs: enabledPDFs
        };
      } else {
        // For simple chat, use regular chat API
        requestBody = {
          message: userMessage.content,
          useAdvancedAnalysis: true,
          enabledPDFs: enabledPDFs
        };
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to get response`);
      }

      const data = await response.json();
      
      let botResponse;
      if (analysisMode === 'interactive') {
        // Handle interactive analysis response - data is nested under result
        const result = data.result || data;
        
        if (result.analysis) {
          // Extract question from parsed response if available
          const hasQuestion = result.parsedResponse?.questions?.length > 0;
          const question = hasQuestion ? result.parsedResponse.questions[0] : null;
          
          // Format content based on whether there's a question
          let formattedContent = result.analysis;
          if (question && !result.isComplete) {
            formattedContent += `\n\n**Question:** ${question}`;
          }
          
          botResponse = {
            id: `bot_${messageTimestamp + 1}`,
            type: 'bot',
            content: formattedContent,
            timestamp: messageTimestamp + 1,
            metadata: {
              stage: result.stage || 'analysis',
              rawAnalysis: result.analysis,
              rawQuestion: question,
              potentialArticles: result.parsedResponse?.potentialArticles || [],
              isComplete: result.isComplete || false,
              requiresDocuments: result.parsedResponse?.requiresDocuments || false,
              conversationId: data.conversationId || Date.now()
            }
          };
          
          // Update conversation history with user message and bot response
          setConversationHistory(prev => [
            ...prev, 
            userMessage.content,  // Add user message
            result.analysis       // Add bot analysis for context
          ]);
          
        } else {
          // Fallback for incomplete interactive response
          const responseContent = data.analysis || data.response || data.message || 'I received your message but encountered an issue with the analysis format.';
          botResponse = {
            id: `bot_${messageTimestamp + 1}`,
            type: 'bot',
            content: responseContent,
            timestamp: messageTimestamp + 1
          };
        }
      } else {
        // Handle simple chat response
        if (data.response) {
          botResponse = {
            id: `bot_${messageTimestamp + 1}`,
            type: 'bot',
            content: data.response,
            timestamp: messageTimestamp + 1
          };
        } else {
          // Try alternative response fields
          const responseContent = data.message || data.analysis || data.content || 'Sorry, I received your message but could not generate a proper response.';
          botResponse = {
            id: `bot_${messageTimestamp + 1}`,
            type: 'bot',
            content: responseContent,
            timestamp: messageTimestamp + 1
          };
        }
      }

      if (botResponse) {
        setMessages(prev => [...prev, botResponse]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: `bot_error_${messageTimestamp + 1}`,
        type: 'bot',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the problem persists.',
        timestamp: messageTimestamp + 1,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    // Only format time on client side to prevent hydration mismatches
    if (!isMounted || typeof window === 'undefined') {
      return '';
    }
    
    try {
      const date = new Date(timestamp);
      // Use a consistent format that won't vary between server and client
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Use UTC to ensure consistency
      });
    } catch {
      return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  /**
   * Handle clicking on article badges in messages
   * Fetches article content and shows preview modal
   */
  const handleArticleClick = async (articleText) => {
    // Extract article number from text like "Article 362"
    const articleNumber = articleText.match(/\d+/)?.[0];
    
    if (articleNumber) {
      // Show notification
      setArticleClickNotification(`Loading ${articleText} content...`);
      
      try {
        // Get enabled PDFs from localStorage
        const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
        const enabledPDFs = savedPDFs.filter(pdf => pdf.isEnabled);
        
        // Fetch article content for preview
        const articleContent = await fetchArticleContent(articleNumber, enabledPDFs.map(pdf => pdf.fileName));
        
        // Prepare PDF info for later use
        let pdfUrl = '';
        let initialPage = 1;
        
        if (enabledPDFs.length > 0) {
          // Use the first enabled PDF
          const pdfFile = enabledPDFs[0];
          pdfUrl = pdfFile.downloadUrl || `/uploads/${pdfFile.fullFileName || pdfFile.fileName}`;
          
          if (articleContent.page && articleContent.page > 1) {
            initialPage = articleContent.page;
          }
        } else {
          // Fallback to hardcoded PDF
          pdfUrl = '/uploads/Indonesia-Penal-Code-1982.pdf';
          // Estimate page based on article number
          initialPage = Math.max(1, Math.ceil(parseInt(articleNumber) / 10));
        }
        
        // Show article preview modal with PDF info
        setArticlePreview({
          ...articleContent,
          pdfUrl: pdfUrl,
          initialPage: initialPage,
          searchTerm: `Article ${articleNumber}`
        });
        
        setArticleClickNotification('');
        
      } catch (error) {
        console.error('Error loading article content:', error);
        setArticleClickNotification('Error loading article content. Please try again.');
        
        // Clear notification after 3 seconds
        setTimeout(() => {
          setArticleClickNotification('');
        }, 3000);
      }
    }
  };

  /**
   * Fetch article content from vector database API
   * Returns article text, metadata, and fallback content if not found
   */
  const fetchArticleContent = async (articleNumber, enabledPDFs = []) => {
    try {
      // Call our API to get article content from vector database
      const response = await fetch('/api/legal/article-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleNumber, enabledPDFs })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.article) {
          // Use the new article structure
          return {
            text: data.article.text,
            chapter: data.article.chapter,
            penalty: data.article.penalty,
            page: data.article.page,
            source: data.article.source,
            articleNumber: data.article.articleNumber,
            keywords: data.article.keywords || [],
            crimeType: data.article.crimeType,
            elements: data.article.elements || []
          };
        } else if (data.fallback) {
          // Use fallback content when article not found in vector database
          return data.fallback;
        } else if (data.availableArticles) {
          // Show available articles when the requested one is not found
          const availableList = data.availableArticles.map(art => `Article ${art.number}`).join(', ');
          return {
            text: `Article ${articleNumber} - Not found in current documents. Available articles include: ${availableList}. ${data.suggestion || ''}`,
            chapter: 'Indonesian Penal Code',
            penalty: 'Article not found in current documents',
            page: 1,
            source: 'not_found',
            availableArticles: data.availableArticles
          };
        }
      }
      
      // If API fails, return basic fallback
      return {
        text: `Article ${articleNumber} - Content from vector database. The article content and legal provisions are stored in the system.`,
        chapter: 'Indonesian Penal Code (KUHP)',
        penalty: 'Refer to vector database content for penalty details',
        page: 1,
        source: 'fallback'
      };
      
    } catch (error) {
      console.error('Error fetching article content:', error);
      
      // Return basic fallback on error
      return {
        text: `Article ${articleNumber} - Unable to load content. Please check document uploads and try again.`,
        chapter: 'Indonesian Penal Code (KUHP)',
        penalty: 'Unable to retrieve penalty information',
        page: 1,
        source: 'error'
      };
    }
  };

  /**
   * Toggle between simple chat and interactive analysis modes
   * Clears conversation history when switching modes
   */
  const toggleAnalysisMode = () => {
    setAnalysisMode(prev => prev === 'simple_chat' ? 'interactive' : 'simple_chat');
    // Clear conversation history when switching modes
    setConversationHistory([]);
  };

  /**
   * Clear the current conversation and reset to initial welcome message
   */
  const clearConversation = () => {
    const clearTimestamp = Date.now();
    setMessages([{
      id: 'initial',
      type: 'bot',
      content: `Hello! I'm your Criminal Code AI Assistant in ${analysisMode === 'interactive' ? 'Interactive' : 'Simple Chat'} mode. Please describe the criminal case or situation you'd like me to analyze.`,
      timestamp: clearTimestamp
    }]);
    setConversationHistory([]);
  };

  // Show loading state while mounting to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden" suppressHydrationWarning>
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-700 px-4 py-3" suppressHydrationWarning>
          <div className="flex items-center space-x-2" suppressHydrationWarning>
            <div className="p-1.5 bg-blue-600 rounded-full" suppressHydrationWarning>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div suppressHydrationWarning>
              <h2 className="text-lg font-semibold text-white">Criminal Code AI</h2>
              <p className="text-slate-300 text-xs">Legal Analysis Assistant</p>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        <div className="h-80 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900" suppressHydrationWarning>
          <div className="flex items-center space-x-2" suppressHydrationWarning>
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-slate-600 dark:text-slate-300 text-sm">Initializing assistant...</span>
          </div>
        </div>
        
        {/* Input placeholder */}
        <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800" suppressHydrationWarning>
          <div className="flex space-x-3" suppressHydrationWarning>
            <div className="flex-1" suppressHydrationWarning>
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" suppressHydrationWarning></div>
            </div>
            <div className="flex-shrink-0 w-16 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" suppressHydrationWarning></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden" suppressHydrationWarning>
      {/* Improved Header */}
      <div className="bg-slate-900 dark:bg-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-600 rounded-full" suppressHydrationWarning>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div suppressHydrationWarning>
              <h2 className="text-lg font-semibold text-white">Criminal Code AI</h2>
              <p className="text-xs text-slate-300">
                {analysisMode === 'interactive' ? 'Interactive Analysis Mode' : 'Simple Chat Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2" suppressHydrationWarning>
            {/* Mode Toggle */}
            <button
              onClick={toggleAnalysisMode}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              title={`Switch to ${analysisMode === 'interactive' ? 'Simple Chat' : 'Interactive'} mode`}
            >
              {analysisMode === 'interactive' ? '💬 Simple' : '🔍 Interactive'}
            </button>
            
            {/* Clear Conversation */}
            <button
              onClick={clearConversation}
              className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
              title="Clear conversation"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Enhanced Mode Description & Status Row */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" suppressHydrationWarning>
          {/* Mode Description */}
          <div className="text-xs text-slate-300 leading-relaxed">
            {analysisMode === 'interactive' ? (
              <span>🔍 <strong>Progressive questioning</strong> to identify specific criminal code articles</span>
            ) : (
              <span>💬 <strong>Basic legal analysis</strong> and general guidance</span>
            )}
            <br />
            <span className="text-slate-400">🔗 Click article badges to view full legal text</span>
          </div>
          
          {/* PDF Status Badge - Only show after mounting */}
          {isMounted && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {enabledPDFsCount > 0 ? (
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM7 13a1 1 0 100 2h2a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>{enabledPDFsCount} PDF{enabledPDFsCount !== 1 ? 's' : ''} Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer" 
                     title="Go to Document Management to enable PDFs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>No PDFs Enabled</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Improved Messages Container with better scroll behavior */}
      <div 
        ref={messagesContainerRef}
        className="h-80 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
        }}
        suppressHydrationWarning
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
            suppressHydrationWarning
          >
            {/* Bot Avatar - only show for bot messages */}
            {message.type === 'bot' && (
              <div className="p-1.5 bg-blue-600 rounded-full flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            {/* Message Content */}
            <div className={`max-w-[85%] ${message.type === 'user' ? 'ml-auto' : ''}`}>
              <div
                className={`rounded-lg px-4 py-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.isError
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : message.metadata?.requiresDocuments
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.type === 'bot' && message.id !== 'initial' && analysisMode === 'interactive' ? (
                    (() => {
                      const { condensed, full } = parseAIResponse(message.content);
                      const hasMoreContent = condensed !== full && condensed.length < full.length;
                      
                      return (
                        <div>
                          <div>{renderFormattedText(condensed)}</div>
                          {hasMoreContent && (
                            <div className="mt-3">
                              <button
                                onClick={() => setTooltipMessage(tooltipMessage === message.id ? null : message.id)}
                                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors relative"
                              >
                                <span>💡 Show Full Analysis & Details</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    renderFormattedText(message.content)
                  )}
                </div>
                
                {/* Interactive Mode Metadata - only for bot messages */}
                {message.type === 'bot' && message.metadata && analysisMode === 'interactive' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Analysis Stage:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          message.metadata.stage === 'limited_mode' 
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        }`}>
                          {message.metadata.stage?.replace('_', ' ').toUpperCase()}
                        </span>
                        {message.metadata.isComplete && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                            ✅ COMPLETE
                          </span>
                        )}
                        {message.metadata.requiresDocuments && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
                            📋 NEEDS DOCUMENTS
                          </span>
                        )}
                      </div>
                      
                      {message.metadata.potentialArticles?.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Articles Considered:</span>
                          <div className="flex flex-wrap gap-1">
                            {message.metadata.potentialArticles.map((article, index) => (
                              <button
                                key={index}
                                onClick={() => handleArticleClick(article)}
                                className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 border border-yellow-300 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-600"
                                title={`Click to open ${article} in Indonesian Penal Code (KUHP)`}
                              >
                                🔗 {article}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {message.metadata.hasQuestions && !message.metadata.isAnalysisComplete && (
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 dark:text-blue-400">❓ Asking next critical question</span>
                        </div>
                      )}
                      
                      {message.metadata.isAnalysisComplete && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 dark:text-green-400">🎯 Final determination reached</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Improved time styling with proper contrast */}
                {isMounted && (
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' 
                      ? 'text-blue-100' // Light blue for user messages (good contrast on blue background)
                      : message.isError
                      ? 'text-red-500 dark:text-red-400' // Red tint for error messages
                      : message.metadata?.requiresDocuments
                      ? 'text-orange-500 dark:text-orange-400' // Orange tint for document requirement messages
                      : 'text-gray-500 dark:text-gray-400' // Default gray for bot messages
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
            
            {/* User Avatar - only show for user messages, positioned after message */}
            {message.type === 'user' && (
              <div className="p-1.5 bg-gray-600 rounded-full flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Compact Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 p-1.5 rounded-full bg-slate-600 dark:bg-slate-500">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">Analyzing...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Compact Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Article Click Notification */}
      {articleClickNotification && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">{articleClickNotification}</p>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <PDFViewer
        pdfUrl={pdfViewer.pdfUrl}
        searchTerm={pdfViewer.searchTerm}
        initialPage={pdfViewer.initialPage}
        isOpen={pdfViewer.isOpen}
        onClose={() => setPdfViewer({ isOpen: false, pdfUrl: '', searchTerm: '', initialPage: 1 })}
      />

      {/* Full Analysis Modal */}
      {tooltipMessage && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Full Legal Analysis
                </h2>
                <button
                  onClick={() => setTooltipMessage(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {(() => {
                  // Find the message with the matching ID
                  const message = messages.find(m => m.id === tooltipMessage);
                  if (message) {
                    const { full } = parseAIResponse(message.content);
                    return renderFormattedText(full);
                  }
                  return 'Analysis content not found.';
                })()}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-6 py-4">
              <button
                onClick={() => setTooltipMessage(null)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Preview Modal */}
      {articlePreview && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Article {articlePreview.articleNumber || 'Preview'}
                </h2>
                <button
                  onClick={() => setArticlePreview(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Article Metadata */}
              <div className="mt-3 flex flex-wrap gap-2">
                {articlePreview.chapter && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    📖 {articlePreview.chapter}
                  </span>
                )}
                {articlePreview.crimeType && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                    ⚖️ {articlePreview.crimeType}
                  </span>
                )}
                {articlePreview.page && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                    📄 Page {articlePreview.page}
                  </span>
                )}
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Article Text */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Article Content</h3>
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {articlePreview.text}
                  </p>
                </div>
              </div>
              
              {/* Penalty Information */}
              {articlePreview.penalty && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Penalty</h3>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-orange-800 dark:text-orange-200">
                      {articlePreview.penalty}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Keywords */}
              {articlePreview.keywords && articlePreview.keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {articlePreview.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                        🏷️ {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Crime Elements */}
              {articlePreview.elements && articlePreview.elements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Legal Elements</h3>
                  <div className="flex flex-wrap gap-2">
                    {articlePreview.elements.map((element, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">
                        <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-semibold mr-2">
                          {index + 1}
                        </span>
                        {element}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Available Articles Notice */}
              {articlePreview.availableArticles && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Available Articles</h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    This article was not found. Available articles include: {' '}
                    {articlePreview.availableArticles.map(art => `Article ${art.number}`).join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setArticlePreview(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                >
                  Close Preview
                </button>
                
                {articlePreview.pdfUrl && (
                  <button
                    onClick={() => {
                      setPdfViewer({
                        isOpen: true,
                        pdfUrl: articlePreview.pdfUrl,
                        searchTerm: articlePreview.searchTerm,
                        initialPage: articlePreview.initialPage
                      });
                      setArticlePreview(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📖 View Full PDF</span>
                  </button>
                )}
                
                {articlePreview.source !== 'not_found' && (
                  <a
                    href={`https://www.google.com/search?q="KUHP+pasal+${articlePreview.articleNumber}"+Indonesia`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-center"
                  >
                    🔍 Search Online
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Input Form */}
      <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800" suppressHydrationWarning>
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Main input row - textarea and button aligned */}
          <div className="flex space-x-3 items-start" suppressHydrationWarning>
            <div className="flex-1" suppressHydrationWarning>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your case..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 transition-all"
                rows="2"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 h-fit px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:block text-sm">
                {isLoading ? 'Analyzing...' : 'Send'}
              </span>
            </button>
          </div>
          
          {/* Help text row */}
          <div className="px-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 