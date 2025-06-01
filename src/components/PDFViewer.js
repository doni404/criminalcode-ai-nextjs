'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import react-pdf CSS for text layer support
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

// Set up PDF.js worker - client-side only
let isWorkerConfigured = false;

const configurePDFWorker = async () => {
  if (typeof window !== 'undefined' && !isWorkerConfigured) {
    const { pdfjs } = await import('react-pdf');
    
    // Clear any existing worker configuration
    delete pdfjs.GlobalWorkerOptions.workerSrc;
    
    // Use the worker file copied to public directory with matching version
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    isWorkerConfigured = true;
    console.log('🔧 PDF.js worker configured with compatible version:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.log('🔧 Worker source set to:', pdfjs.GlobalWorkerOptions.workerSrc);
  }
};

export default function PDFViewer({ 
  pdfUrl, 
  searchTerm = '', 
  initialPage = 1, 
  isOpen = false, 
  onClose 
}) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Configure PDF worker on client mount
  useEffect(() => {
    configurePDFWorker();
    setIsClientMounted(true);
  }, []);

  // Reset when PDF changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(searchTerm);
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setLoading(true);
      setError(null);
    }
  }, [pdfUrl, isOpen, searchTerm]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    console.log(`📄 PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error) => {
    console.error('❌ PDF load error:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  };

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      console.log(`🔍 Searching for: "${query}" in PDF`);
      
      // Use browser's native find functionality for reliable PDF text search
      if (typeof window !== 'undefined' && window.find) {
        // Clear any existing search highlights
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }
        
        // Use browser's native find function
        const found = window.find(query, false, false, true, false, true, false);
        
        if (found) {
          console.log(`📝 Found "${query}" using browser search`);
          setSearchResults([{ text: query, count: 1 }]);
          
          // Scroll to the found text
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              range.startContainer.parentElement?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }
        } else {
          console.log(`📝 No instances of "${query}" found`);
          setSearchResults([]);
        }
      } else {
        // Fallback: trigger browser's search UI
        console.log(`📝 Opening browser search for: "${query}"`);
        setSearchResults([{ text: query, count: 1 }]);
        
        // Trigger Ctrl+F equivalent
        if (typeof window !== 'undefined') {
          // Focus the document to enable browser search
          document.body.focus();
          
          // Show a hint to use Ctrl+F
          setTimeout(() => {
            alert(`Use Ctrl+F (or Cmd+F on Mac) to search for "${query}" in the PDF`);
          }, 100);
        }
      }
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback: show message to use Ctrl+F
      setSearchResults([]);
      alert(`Please use Ctrl+F (or Cmd+F on Mac) to search for "${query}" in the PDF`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when component opens with a search term
  useEffect(() => {
    if (isOpen && searchTerm && isClientMounted) {
      // Wait for PDF to load before searching
      const timer = setTimeout(() => {
        handleSearch(searchTerm);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchTerm, isClientMounted, handleSearch]);

  const changeScale = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3.0));
  };

  // Don't render until client-side mounted
  if (!isOpen || !isClientMounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              PDF Viewer
            </h2>
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</span>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search in PDF..."
                className="pl-8 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={isSearching}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {numPages ? `${numPages} pages` : 'Loading...'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeScale(-0.2)}
              disabled={scale <= 0.5}
              className="p-2 bg-white dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-slate-500 rounded-md transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => changeScale(0.2)}
              disabled={scale >= 3.0}
              className="p-2 bg-white dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-slate-500 rounded-md transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          
          <a
            href={pdfUrl}
            download
            className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </a>
        </div>

        {/* PDF Content - Continuous Scroll */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-900 p-4">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️ Error Loading PDF</div>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {Document && Page && (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="text-red-500 text-lg mb-2">⚠️ Failed to Load PDF</div>
                        <p className="text-gray-600 dark:text-gray-400">Please check the file and try again.</p>
                      </div>
                    </div>
                  }
                >
                  {/* Render all pages */}
                  {numPages && Array.from(new Array(numPages), (el, index) => (
                    <div key={`page_${index + 1}`} className="mb-4">
                      <div className="text-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-700 px-2 py-1 rounded">
                          Page {index + 1}
                        </span>
                      </div>
                      <Page
                        pageNumber={index + 1}
                        scale={scale}
                        className="shadow-lg border border-gray-300 dark:border-slate-600"
                        loading={
                          <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        }
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                      />
                    </div>
                  ))}
                </Document>
              )}
              
              {(!Document || !Page) && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading PDF components...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No results found for "{searchQuery}". Try a different search term.
            </p>
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Searching for "{searchQuery}" in PDF
              <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                🔍 Use Ctrl+F for more results
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 