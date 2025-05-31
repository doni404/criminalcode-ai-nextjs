'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadInterface() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    // Validate file
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      setUploadStatus('error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      setError('File size must be less than 50MB.');
      setUploadStatus('error');
      return;
    }

    // Start upload
    setUploadStatus('uploading');
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadResult(result);
      } else {
        setUploadStatus('error');
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadStatus('error');
      setError('Network error during upload');
      console.error('Upload error:', err);
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadResult(null);
    setError('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Upload Criminal Code PDF
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Upload your criminal code document for AI-powered analysis and vector database storage
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
          } ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
            disabled={uploadStatus === 'uploading'}
          />

          {uploadStatus === 'idle' && (
            <>
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                Drop your PDF here, or{' '}
                <label 
                  htmlFor="file-upload" 
                  className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
                >
                  browse files
                </label>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Supports PDF files up to 50MB
              </p>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                Processing your document...
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This may take a few minutes for large documents
              </p>
            </>
          )}

          {uploadStatus === 'success' && uploadResult && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">
                Upload successful!
              </p>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <p><strong>{uploadResult.data.fileName}</strong></p>
                <p><strong>{uploadResult.data.articlesProcessed}</strong> articles processed</p>
                <p><strong>{uploadResult.data.chaptersProcessed}</strong> chapters found</p>
                <p><strong>{uploadResult.data.articlesStored}</strong> records stored in database</p>
              </div>
              <button
                onClick={resetUpload}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Another Document
              </button>
            </>
          )}

          {uploadStatus === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-red-700 dark:text-red-300 mb-2">
                Upload failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              <button
                onClick={resetUpload}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        {/* Upload Info */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            What happens when you upload?
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <li>• PDF text extraction and parsing</li>
            <li>• AI-powered article and chapter identification</li>
            <li>• Legal element extraction for each article</li>
            <li>• Vector embeddings generation</li>
            <li>• Storage in Qdrant vector database</li>
            <li>• Ready for advanced legal analysis!</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 