'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Trash2, Eye, Download } from 'lucide-react';

export default function PDFManager() {
  const [uploadedPDFs, setUploadedPDFs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState('');

  // Load uploaded PDFs on component mount
  useEffect(() => {
    loadUploadedPDFs();
  }, []);

  const loadUploadedPDFs = async () => {
    try {
      // First load from localStorage for enabled/disabled state
      const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
      
      // Then fetch from server for file list
      const response = await fetch('/api/legal/pdfs');
      if (response.ok) {
        const data = await response.json();
        const serverPDFs = data.pdfs || [];
        
        // Merge server data with localStorage settings
        const mergedPDFs = serverPDFs.map(serverPdf => {
          const savedPdf = savedPDFs.find(saved => 
            saved.fileName === serverPdf.fileName || 
            saved.fullFileName === serverPdf.fullFileName ||
            saved.id === serverPdf.id
          );
          
          return {
            ...serverPdf,
            isEnabled: savedPdf ? savedPdf.isEnabled : true // Default to enabled
          };
        });
        
        setUploadedPDFs(mergedPDFs);
        
        // Update localStorage with merged data
        localStorage.setItem('uploadedPDFs', JSON.stringify(mergedPDFs));
        
        // Trigger custom event for other components to update
        window.dispatchEvent(new CustomEvent('pdfsUpdated'));
      } else {
        // If server fails, just use localStorage
        setUploadedPDFs(savedPDFs);
      }
    } catch (error) {
      console.error('Error loading PDFs:', error);
      // Fallback to localStorage only
      const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
      setUploadedPDFs(savedPDFs);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress({ fileName: file.name, status: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadProgress({ fileName: file.name, status: 'success' });
        
        // Refresh the PDF list from server to get the actual uploaded file info
        await loadUploadedPDFs();
        
        setTimeout(() => setUploadProgress(null), 3000);
      } else {
        setError(result.error || 'Upload failed');
        setUploadProgress({ fileName: file.name, status: 'error' });
      }
    } catch (error) {
      setError('Network error during upload');
      setUploadProgress({ fileName: file.name, status: 'error' });
    } finally {
      setIsLoading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const togglePDFEnabled = (pdfId) => {
    setUploadedPDFs(prev => {
      const updated = prev.map(pdf => 
        pdf.id === pdfId ? { ...pdf, isEnabled: !pdf.isEnabled } : pdf
      );
      
      // Save to localStorage
      localStorage.setItem('uploadedPDFs', JSON.stringify(updated));
      
      // Trigger custom event for other components to update
      window.dispatchEvent(new CustomEvent('pdfsUpdated'));
      
      return updated;
    });
  };

  const deletePDF = async (pdfId) => {
    try {
      // Find the PDF to get the file name
      const pdfToDelete = uploadedPDFs.find(pdf => pdf.id === pdfId);
      if (!pdfToDelete) {
        console.error('PDF not found for deletion');
        return;
      }

      // Call the API to delete the actual file
      const response = await fetch('/api/legal/pdfs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: pdfToDelete.fullFileName || pdfToDelete.fileName })
      });

      if (response.ok) {
        // Only remove from localStorage if server deletion succeeded
        setUploadedPDFs(prev => {
          const updated = prev.filter(pdf => pdf.id !== pdfId);
          localStorage.setItem('uploadedPDFs', JSON.stringify(updated));
          
          // Trigger custom event for other components to update
          window.dispatchEvent(new CustomEvent('pdfsUpdated'));
          
          return updated;
        });
        
        console.log(`✅ Successfully deleted PDF: ${pdfToDelete.fileName}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete PDF from server:', errorData.error);
        setError(`Failed to delete file: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const enabledCount = uploadedPDFs.filter(pdf => pdf.isEnabled).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Document Management</h2>
            <p className="text-slate-300 text-sm">
              Upload and manage criminal code PDFs for vector database
            </p>
          </div>
          <div className="text-right">
            <div className="text-white text-sm">
              {uploadedPDFs.length} PDF{uploadedPDFs.length !== 1 ? 's' : ''} uploaded
            </div>
            <div className="text-slate-300 text-xs">
              {enabledCount} enabled for analysis
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload New PDF</h3>
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isLoading 
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                : 'border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-600 dark:hover:border-blue-500'
            }`}
          >
            <Upload className={`w-8 h-8 mb-2 ${isLoading ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`} />
            <p className={`text-sm ${isLoading ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {isLoading ? 'Processing...' : 'Click to upload PDF or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum file size: 50MB
            </p>
          </label>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-700">
            <div className="flex items-center space-x-2">
              {uploadProgress.status === 'uploading' && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              {uploadProgress.status === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              {uploadProgress.status === 'error' && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {uploadProgress.fileName} - {uploadProgress.status}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* PDF List */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Uploaded Documents</h3>
          {uploadedPDFs.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Vector database: {enabledCount}/{uploadedPDFs.length} active
            </div>
          )}
        </div>

        {uploadedPDFs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No PDFs uploaded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Upload criminal code documents to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedPDFs.map((pdf) => (
              <div
                key={pdf.id}
                className={`p-4 rounded-lg border transition-colors ${
                  pdf.isEnabled
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                    : 'border-gray-200 bg-gray-50 dark:bg-slate-700 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Enable/Disable Toggle */}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdf.isEnabled}
                        onChange={() => togglePDFEnabled(pdf.id)}
                        className="sr-only"
                      />
                      <div className={`relative w-10 h-6 rounded-full transition-colors ${
                        pdf.isEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          pdf.isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </label>

                    {/* PDF Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {pdf.fileName}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pdf.isEnabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {pdf.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatFileSize(pdf.size)} • Uploaded {formatDate(pdf.uploadDate)}
                        {pdf.articlesProcessed > 0 && (
                          <span> • {pdf.articlesProcessed} articles processed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        // Use the viewerUrl from the API which handles blob vs local URLs correctly
                        const viewerUrl = pdf.viewerUrl || pdf.fileUrl;
                        if (viewerUrl.includes('pdfjs/web/viewer.html')) {
                          // PDF.js viewer URL - open directly
                          window.open(viewerUrl, '_blank');
                        } else if (pdf.storage === 'blob') {
                          // Blob storage - use direct blob URL
                          window.open(pdf.downloadUrl || pdf.fileUrl, '_blank');
                        } else {
                          // Local storage - try PDF.js viewer first, fallback to direct
                          const pdfJsUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(pdf.fileUrl)}`;
                          window.open(pdfJsUrl, '_blank');
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="View PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = pdf.downloadUrl || pdf.fileUrl;
                        link.download = pdf.fileName;
                        link.click();
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePDF(pdf.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 