'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Trash2, Eye, Download } from 'lucide-react';
import PDFViewer from './PDFViewer';
import { usePDFViewer } from './usePDFViewer';

export default function PDFManager() {
  const [uploadedPDFs, setUploadedPDFs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { fileName, stage, percentage, status, message }
  const [error, setError] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { pdf: pdfObject, show: boolean }
  const [successNotification, setSuccessNotification] = useState(null); // { message: string, show: boolean }
  
  // Use shared PDF viewer hook
  const { pdfViewer, openFromUploadedPDF, closePDF } = usePDFViewer();

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

  // Update progress during upload
  const updateProgress = (fileName, stage, percentage, message) => {
    setUploadProgress({
      fileName,
      stage,
      percentage,
      status: 'uploading',
      message
    });
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
    
    try {
      // Stage 1: Preparing upload
      updateProgress(file.name, 'preparing', 5, 'Preparing file for upload...');
      
      const formData = new FormData();
      formData.append('file', file);

      // Stage 2: Uploading file
      updateProgress(file.name, 'uploading', 15, 'Uploading file to server...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Stage 3: Processing stages (simulate progress since we can't track server-side processing in real-time)
        const processingStages = [
          { stage: 'processing', percentage: 25, message: 'Processing PDF content...' },
          { stage: 'extracting', percentage: 45, message: 'Extracting articles and text...' },
          { stage: 'embedding', percentage: 65, message: 'Generating embeddings...' },
          { stage: 'storing', percentage: 85, message: 'Storing in vector database...' },
          { stage: 'finalizing', percentage: 95, message: 'Finalizing upload...' }
        ];

        // Simulate processing progress
        for (const stage of processingStages) {
          updateProgress(file.name, stage.stage, stage.percentage, stage.message);
          await new Promise(resolve => setTimeout(resolve, 800)); // Small delay for visual feedback
        }

        // Stage 4: Complete
        setUploadProgress({
          fileName: file.name,
          stage: 'complete',
          percentage: 100,
          status: 'success',
          message: 'Upload completed successfully!'
        });
        
        // Refresh the PDF list from server to get the actual uploaded file info
        await loadUploadedPDFs();
        
        // Show success toast
        showSuccessNotification(`PDF "${file.name}" uploaded and processed successfully`);
        
        // Clear progress after showing success
        setTimeout(() => setUploadProgress(null), 3000);
      } else {
        setError(result.error || 'Upload failed');
        setUploadProgress({ 
          fileName: file.name, 
          stage: 'error',
          percentage: 0,
          status: 'error',
          message: result.error || 'Upload failed'
        });
      }
    } catch (error) {
      setError('Network error during upload');
      setUploadProgress({ 
        fileName: file.name, 
        stage: 'error',
        percentage: 0,
        status: 'error',
        message: 'Network error during upload'
      });
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

  const deletePDF = async (pdf) => {
    try {
      // Get the fileName - try fullFileName first, then fileName
      const fileName = pdf.fullFileName || pdf.fileName;
      if (!fileName) {
        console.error('No fileName found in PDF object:', pdf);
        setError('Cannot delete file: no file name found');
        return;
      }

      console.log(`🗑️ Attempting to delete PDF: ${fileName}`);

      // Call the API to delete the actual file - send fileName as URL parameter
      const response = await fetch(`/api/legal/pdfs?file=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Only remove from localStorage if server deletion succeeded
        setUploadedPDFs(prev => {
          const updated = prev.filter(p => p.id !== pdf.id);
          localStorage.setItem('uploadedPDFs', JSON.stringify(updated));
          
          // Trigger custom event for other components to update
          window.dispatchEvent(new CustomEvent('pdfsUpdated'));
          
          return updated;
        });
        
        console.log(`✅ Successfully deleted PDF: ${fileName}`);
        
        // Close confirmation modal
        setDeleteConfirmation(null);

        // Show success notification
        showSuccessNotification(`PDF "${fileName}" deleted successfully`);
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

  const confirmDelete = () => {
    if (deleteConfirmation?.pdf) {
      deletePDF(deleteConfirmation.pdf);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Handle success notification
  const showSuccessNotification = (message) => {
    setSuccessNotification({ message, show: true });
    
    // Optional: Play a subtle success sound (browser permitting)
    try {
      // Create a subtle success tone
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Ignore audio errors - not all browsers support this
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setSuccessNotification(null);
    }, 5000);
  };

  const hideSuccessNotification = () => {
    setSuccessNotification(null);
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
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
            <div className="space-y-3">
              {/* Progress Header */}
              <div className="flex items-center justify-between">
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploadProgress.fileName}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadProgress.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${
                    uploadProgress.status === 'success' 
                      ? 'bg-green-600' 
                      : uploadProgress.status === 'error'
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${uploadProgress.percentage}%` }}
                ></div>
              </div>

              {/* Progress Message */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {uploadProgress.message}
                </span>
                <span className="text-gray-500 dark:text-gray-500 capitalize">
                  {uploadProgress.stage}
                </span>
              </div>

              {/* Stage Indicators */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                {[
                  { stage: 'preparing', label: 'Prepare', threshold: 5 },
                  { stage: 'uploading', label: 'Upload', threshold: 15 },
                  { stage: 'processing', label: 'Process', threshold: 25 },
                  { stage: 'extracting', label: 'Extract', threshold: 45 },
                  { stage: 'embedding', label: 'Embed', threshold: 65 },
                  { stage: 'storing', label: 'Store', threshold: 85 },
                  { stage: 'complete', label: 'Complete', threshold: 100 }
                ].map((stageInfo, index) => {
                  const isCurrentStage = uploadProgress.stage === stageInfo.stage;
                  const isCompleted = uploadProgress.percentage >= stageInfo.threshold;
                  const isActive = isCurrentStage || isCompleted;
                  
                  return (
                    <div key={stageInfo.stage} className="flex flex-col items-center space-y-1">
                      <div 
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isCurrentStage
                            ? 'bg-blue-600 animate-pulse shadow-lg'
                            : isCompleted
                              ? 'bg-green-600 shadow-sm'
                              : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      ></div>
                      <span className={`text-xs transition-colors duration-300 ${
                        isActive ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {stageInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
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
                      onClick={() => openFromUploadedPDF(pdf)}
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
                      onClick={() => {
                        setDeleteConfirmation({ pdf: pdf, show: true });
                      }}
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

      {/* PDF Viewer */}
      <PDFViewer
        pdfUrl={pdfViewer.pdfUrl}
        searchTerm={pdfViewer.searchTerm}
        initialPage={pdfViewer.initialPage}
        isOpen={pdfViewer.isOpen}
        onClose={closePDF}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation?.show && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Deletion
              </h2>
            </div>
            
            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Delete PDF Document
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      "{deleteConfirmation.pdf?.fileName}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-800 dark:text-red-200">
                        This will permanently remove the file from storage and vector database.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-600 flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Delete PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {successNotification?.show && (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl max-w-md flex items-start space-x-3 border-l-4 border-green-400">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Success!
              </p>
              <p className="text-sm text-green-100 mt-1">
                {successNotification.message}
              </p>
            </div>
            <button
              onClick={hideSuccessNotification}
              className="flex-shrink-0 text-green-200 hover:text-white transition-colors ml-4"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 