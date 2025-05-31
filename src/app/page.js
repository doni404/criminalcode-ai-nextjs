'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import PDFManager from '@/components/PDFManager';
import { MessageSquare, FileText } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Criminal Code AI Assistant
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Analyze criminal cases and manage legal documents for AI-powered analysis with vector database integration.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex space-x-1">
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

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'documents' && <PDFManager />}
      </div>
    </div>
  );
}
