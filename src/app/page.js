'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import PDFManager from '@/components/PDFManager';
import { MessageSquare, FileText } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [titleText, setTitleText] = useState('');
  const [showContent, setShowContent] = useState(false);

  const fullTitle = "Criminal Code AI Assistant";

  // Listen for custom event to switch to document management
  useEffect(() => {
    const handleSwitchToDocumentManagement = () => {
      setActiveTab('documents');
    };

    window.addEventListener('switchToDocumentManagement', handleSwitchToDocumentManagement);
    
    return () => {
      window.removeEventListener('switchToDocumentManagement', handleSwitchToDocumentManagement);
    };
  }, []);

  // Cool typing animation for title only
  useEffect(() => {
    let index = 0;
    const titleInterval = setInterval(() => {
      if (index <= fullTitle.length) {
        setTitleText(fullTitle.slice(0, index));
        index++;
      } else {
        clearInterval(titleInterval);
        // Show the rest of the content after title completes
        setTimeout(() => setShowContent(true), 300);
      }
    }, 100);

    return () => clearInterval(titleInterval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8" suppressHydrationWarning>
      <div className="text-center mb-8" suppressHydrationWarning>
        {/* Cool typing animation for title */}
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4 min-h-[3.5rem] flex items-center justify-center">
          <span className="bg-gradient-to-r from-slate-800 via-blue-600 to-slate-800 dark:from-slate-100 dark:via-blue-400 dark:to-slate-100 bg-clip-text text-transparent">
            {titleText}
          </span>
          <span className={`ml-1 animate-pulse text-blue-500 ${titleText.length < fullTitle.length ? 'opacity-100' : 'opacity-0'}`}>|</span>
        </h1>
        
        {/* Simple fade-in for subtitle */}
        <div className={`transition-all duration-700 ${
          showContent ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-4'
        }`}>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Analyze criminal cases and manage legal documents for AI-powered analysis with vector database integration.
          </p>
        </div>
      </div>

      {/* Tab Navigation - simple fade-in */}
      <div className={`flex justify-center mb-8 transition-all duration-700 delay-100 ${
        showContent ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-4'
      }`} suppressHydrationWarning>
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex space-x-1" suppressHydrationWarning>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Legal Analysis Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Management</span>
          </button>
        </div>
      </div>

      {/* Tab Content - simple fade-in */}
      <div className={`min-h-[600px] transition-all duration-700 delay-200 ${
        showContent ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-4'
      }`} suppressHydrationWarning>
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'documents' && <PDFManager />}
      </div>
    </div>
  );
}
