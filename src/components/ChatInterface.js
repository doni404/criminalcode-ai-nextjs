'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('simple_chat'); // simple_chat or interactive
  const [conversationHistory, setConversationHistory] = useState([]);
  const [articleClickNotification, setArticleClickNotification] = useState('');
  const [articlePreview, setArticlePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Get enabled PDFs count for display
  const getEnabledPDFsCount = () => {
    try {
      const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
      return savedPDFs.filter(pdf => pdf.isEnabled).length;
    } catch {
      return 0;
    }
  };

  const [enabledPDFsCount, setEnabledPDFsCount] = useState(0);

  // Update enabled PDFs count on mount and when storage changes
  useEffect(() => {
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
  }, []);

  // Update welcome message when enabled PDFs count changes
  useEffect(() => {
    if (isMounted && messages.length > 0 && messages[0].id === 'initial') {
      // Refresh the welcome message when PDF count changes
      const currentEnabledCount = enabledPDFsCount;
      
      setMessages(prev => [
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
      ]);
    }
  }, [enabledPDFsCount, analysisMode, isMounted, messages]);

  // Initialize on client side only to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    
    // Get current PDF status for welcome message
    const currentEnabledCount = getEnabledPDFsCount();
    
    // Set initial welcome message
    setMessages([{
      id: 'initial',
      type: 'bot',
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

Please describe the criminal case or situation you'd like me to analyze.`,
      timestamp: Date.now()
    }]);
  }, [analysisMode]);

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
      // Add a delay to ensure DOM is fully rendered and prevent conflicts
      const timeoutId = setTimeout(() => {
        // Only scroll if the container is visible (not hidden by tab switching)
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const isVisible = container.offsetParent !== null;
          
          if (isVisible) {
            scrollToBottom();
          }
        }
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isMounted]);
  
  // Additional effect to handle tab visibility and scroll restoration
  useEffect(() => {
    if (isMounted && messagesContainerRef.current) {
      // Scroll to bottom when component becomes visible (e.g., tab switch)
      const container = messagesContainerRef.current;
      
      // Check if container is visible and has content
      if (container.offsetParent !== null && messages.length > 0) {
        // Add a small delay to ensure smooth transition
        const timeoutId = setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isMounted, messages.length]); // Depend on messages.length instead of messages array

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Get enabled PDFs from localStorage
      const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
      const enabledPDFs = savedPDFs.filter(pdf => pdf.isEnabled).map(pdf => pdf.fileName);
      
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
        // Handle interactive mode response
        if (data.success && data.result) {
          botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: data.result.analysis,
            timestamp: Date.now(),
            metadata: {
              stage: data.result.stage,
              isComplete: data.result.isComplete,
              nextStage: data.result.nextStage,
              potentialArticles: data.result.parsedResponse.potentialArticles,
              hasQuestions: data.result.parsedResponse.hasQuestions,
              isAnalysisComplete: data.result.parsedResponse.isAnalysisComplete
            }
          };

          // Update conversation history for interactive mode
          setConversationHistory(prev => [...prev, userMessage.content, data.result.analysis]);
        } else if (!data.success && data.error === 'No criminal code documents enabled' && data.result) {
          // Handle the case where no PDFs are enabled - this is a valid response, not an error
          botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: data.result.analysis,
            timestamp: Date.now(),
            metadata: {
              stage: data.result.stage || 'limited_mode',
              isComplete: data.result.isComplete || true,
              nextStage: data.result.nextStage || 'document_required',
              potentialArticles: data.result.parsedResponse?.potentialArticles || [],
              hasQuestions: data.result.parsedResponse?.hasQuestions || false,
              isAnalysisComplete: data.result.parsedResponse?.isAnalysisComplete || false,
              requiresDocuments: true
            }
          };

          // Don't update conversation history in limited mode
        } else {
          throw new Error(data.error || 'Interactive analysis failed');
        }
      } else {
        // Handle simple chat response
        if (data.response) {
          botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: data.response,
            timestamp: Date.now()
          };
        } else {
          // Try alternative response fields
          const responseContent = data.message || data.analysis || data.content || 'Sorry, I received your message but could not generate a proper response.';
          botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: responseContent,
            timestamp: Date.now()
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
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the problem persists.',
        timestamp: Date.now(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleArticleClick = async (articleText) => {
    // Extract article number from text like "Article 362"
    const articleNumber = articleText.match(/\d+/)?.[0];
    
    if (articleNumber) {
      // Show notification
      setArticleClickNotification(`Loading ${articleText} from uploaded criminal code...`);
      
      try {
        // Get enabled PDFs from localStorage
        const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
        const enabledPDFs = savedPDFs.filter(pdf => pdf.isEnabled).map(pdf => pdf.fileName);
        
        // Fetch article content from our vector database/uploaded PDF
        const articleContent = await fetchArticleContent(articleNumber, enabledPDFs);
        
        // Always show article preview modal (either real content or fallback)
        setArticlePreview({
          article: articleText,
          number: articleNumber,
          content: articleContent.text,
          chapter: articleContent.chapter,
          penalty: articleContent.penalty,
          pdfPage: articleContent.page,
          source: articleContent.source || 'fallback'
        });
        
      } catch (error) {
        console.error('Error fetching article content:', error);
        // Show error modal with PDF link
        setArticlePreview({
          article: articleText,
          number: articleNumber,
          content: `Unable to load Article ${articleNumber} content. Please view the full PDF document below for complete details.`,
          chapter: 'Indonesian Penal Code (KUHP)',
          penalty: 'Refer to full document',
          pdfPage: 1,
          source: 'error'
        });
      }
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setArticleClickNotification('');
      }, 3000);
    }
  };

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
        
        if (data.success && data.articleContent) {
          return data.articleContent;
        } else if (data.fallback) {
          // Use fallback content when article not found in vector database
          return data.fallback;
        }
      }
      
      // If API fails, return basic fallback
      return {
        text: `Article ${articleNumber} - Content will be available in the full PDF document. Click 'View Full PDF' below to access the complete text.`,
        chapter: 'Indonesian Penal Code (KUHP)',
        penalty: 'Refer to full document for penalty details',
        page: 1 // Simple fallback page for unknown articles
      };
      
    } catch (error) {
      console.error('Error fetching article content:', error);
      
      // Return basic fallback on error
      return {
        text: `Article ${articleNumber} - Unable to load content. Please view the full PDF document for complete details.`,
        chapter: 'Indonesian Penal Code (KUHP)',
        penalty: 'Refer to full document for penalty details',
        page: 1 // Simple fallback page for unknown articles
      };
    }
  };

  const getIndonesianPenalCodeLinks = (articleNumber, actualPage = 1) => {
    const links = {
      // Primary legal database (most reliable)
      hukumOnline: `https://www.hukumonline.com/pusatdata/detail/lt4c7b09b89bbf8/kitab-undang-undang-hukum-pidana-kuhp`,
      
      // Government legal database  
      bphn: `https://peraturan.bpk.go.id/Home/Details/38771/kuhp`,
      
      // Alternative legal sources
      jdih: `https://jdih.kemenkumham.go.id/`,
      
      // Alternative online sources
      lexis: `https://www.lexisnexis.com/id/legal/`,
      
      // Local PDF if available - use actual page from content
      local: `/uploads/Indonesia-Penal-Code-1982.pdf#page=${actualPage}`,
      
      // Backup search
      search: `https://www.google.com/search?q="KUHP+pasal+${articleNumber}"+Indonesia+site:hukumonline.com`
    };

    // Add specific article anchors where possible
    if (links.hukumOnline) {
      links.hukumOnline += `#pasal-${articleNumber}`;
    }

    return links;
  };

  const toggleAnalysisMode = () => {
    setAnalysisMode(prev => prev === 'simple_chat' ? 'interactive' : 'simple_chat');
    // Clear conversation history when switching modes
    setConversationHistory([]);
  };

  const clearConversation = () => {
    setMessages([{
      id: 'initial',
      type: 'bot',
      content: `Hello! I'm your Criminal Code AI Assistant in ${analysisMode === 'interactive' ? 'Interactive' : 'Simple Chat'} mode. Please describe the criminal case or situation you'd like me to analyze.`,
      timestamp: Date.now()
    }]);
    setConversationHistory([]);
  };

  // Show loading state while mounting to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-700 px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-600 rounded-full">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Criminal Code AI</h2>
              <p className="text-slate-300 text-xs">Legal Analysis Assistant</p>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        <div className="h-80 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-slate-600 dark:text-slate-300 text-sm">Initializing assistant...</span>
          </div>
        </div>
        
        {/* Input placeholder */}
        <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800">
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex-shrink-0 w-16 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Improved Header */}
      <div className="bg-slate-900 dark:bg-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-600 rounded-full">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Criminal Code AI</h2>
              <p className="text-xs text-slate-300">
                {analysisMode === 'interactive' ? 'Interactive Analysis Mode' : 'Simple Chat Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
          
          {/* PDF Status Badge */}
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
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
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
                  {message.content}
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

      {/* Article Preview Modal */}
      {articlePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {articlePreview.article}
                  </h2>
                  {articlePreview.chapter && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {articlePreview.chapter}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setArticlePreview(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Legal Provision</h3>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {articlePreview.content}
                  </p>
                </div>
              </div>

              {articlePreview.penalty && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Penalty</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300">
                      {articlePreview.penalty}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    // Get the actual PDF filename from uploaded files
                    try {
                      const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
                      const enabledPDFs = savedPDFs.filter(pdf => pdf.isEnabled);
                      
                      if (enabledPDFs.length > 0) {
                        // Use the first enabled PDF's full filename (with timestamp prefix)
                        const pdfFile = enabledPDFs[0];
                        const actualFilename = pdfFile.fullFileName || pdfFile.fileName;
                        
                        // Create search terms for the article
                        const articleNumber = articlePreview.number;
                        const searchTerms = [
                          `Article ${articleNumber}`,
                          `Art. ${articleNumber}`,
                          `${articleNumber}.`, // Simple number with period
                          articleNumber.toString() // Just the number
                        ];
                        
                        // Use the first search term (most likely to match)
                        const searchTerm = searchTerms[0];
                        
                        // Try PDF.js viewer first (more reliable for search)
                        const pdfJsUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(`/uploads/${actualFilename}`)}&search=${encodeURIComponent(searchTerm)}`;
                        
                        // Check if PDF.js viewer is available, otherwise use direct PDF
                        try {
                          const checkPdfJs = await fetch('/pdfjs/web/viewer.html', { method: 'HEAD' });
                          if (checkPdfJs.ok) {
                            // PDF.js is available, use it with search
                            window.open(pdfJsUrl, '_blank', 'noopener,noreferrer');
                            setArticleClickNotification(`Opened PDF.js viewer and searching for "${searchTerm}"...`);
                          } else {
                            throw new Error('PDF.js not available');
                          }
                        } catch {
                          // Fallback: Open PDF directly and show search instructions
                          const localPdfUrl = `/uploads/${actualFilename}`;
                          window.open(localPdfUrl, '_blank', 'noopener,noreferrer');
                          setArticleClickNotification(`PDF opened! Use Ctrl+F (Cmd+F on Mac) to search for "${searchTerm}"`);
                        }
                        
                        setTimeout(() => setArticleClickNotification(''), 5000);
                        
                      } else {
                        // Fallback to hardcoded filename if no enabled PDFs
                        const articleNumber = articlePreview.number;
                        const searchTerm = `Article ${articleNumber}`;
                        
                        try {
                          const pdfJsUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent('/uploads/Indonesia-Penal-Code-1982.pdf')}&search=${encodeURIComponent(searchTerm)}`;
                          const checkPdfJs = await fetch('/pdfjs/web/viewer.html', { method: 'HEAD' });
                          if (checkPdfJs.ok) {
                            window.open(pdfJsUrl, '_blank', 'noopener,noreferrer');
                            setArticleClickNotification(`Opened PDF.js viewer and searching for "${searchTerm}"...`);
                          } else {
                            throw new Error('PDF.js not available');
                          }
                        } catch {
                          const localPdfUrl = `/uploads/Indonesia-Penal-Code-1982.pdf`;
                          window.open(localPdfUrl, '_blank', 'noopener,noreferrer');
                          setArticleClickNotification(`PDF opened! Use Ctrl+F (Cmd+F on Mac) to search for "${searchTerm}"`);
                        }
                        
                        setTimeout(() => setArticleClickNotification(''), 5000);
                      }
                    } catch (error) {
                      console.error('Error getting PDF filename:', error);
                      // Fallback to hardcoded filename
                      const articleNumber = articlePreview.number;
                      const searchTerm = `Article ${articleNumber}`;
                      const localPdfUrl = `/uploads/Indonesia-Penal-Code-1982.pdf`;
                      window.open(localPdfUrl, '_blank', 'noopener,noreferrer');
                      setArticleClickNotification(`PDF opened! Use Ctrl+F (Cmd+F on Mac) to search for "${searchTerm}"`);
                      setTimeout(() => setArticleClickNotification(''), 5000);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Open & Search PDF</span>
                </button>
                
                <button
                  onClick={() => setArticlePreview(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                Content from uploaded Indonesian Penal Code PDF
                {articlePreview.source && (
                  <span className="block mt-1">
                    Source: {articlePreview.source === 'criminal_code_articles' ? 'Vector Database - Articles' : 
                            articlePreview.source === 'crime_name_master' ? 'Vector Database - Crime Definitions' :
                            articlePreview.source === 'similarity_match' ? 'Vector Database - Similar Content' :
                            articlePreview.source === 'fallback' ? 'Fallback Content' :
                            articlePreview.source === 'error' ? 'Error - Content Unavailable' :
                            'Uploaded PDF Content'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Input Form */}
      <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Main input row - textarea and button aligned */}
          <div className="flex space-x-3 items-start">
            <div className="flex-1">
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