import { useState } from 'react';

/**
 * Custom hook for managing PDF viewer state and functionality
 * Can be shared across components that need PDF viewing capabilities
 */
export function usePDFViewer() {
  const [pdfViewer, setPdfViewer] = useState({
    isOpen: false,
    pdfUrl: '',
    searchTerm: '',
    initialPage: 1
  });

  /**
   * Open PDF viewer with specified parameters
   * @param {string} pdfUrl - URL of the PDF to display
   * @param {string} searchTerm - Optional search term to highlight
   * @param {number} initialPage - Optional initial page number
   */
  const openPDF = (pdfUrl, searchTerm = '', initialPage = 1) => {
    setPdfViewer({
      isOpen: true,
      pdfUrl,
      searchTerm,
      initialPage
    });
  };

  /**
   * Close PDF viewer and reset state
   */
  const closePDF = () => {
    setPdfViewer({
      isOpen: false,
      pdfUrl: '',
      searchTerm: '',
      initialPage: 1
    });
  };

  /**
   * Open PDF from article preview data
   * @param {Object} articlePreview - Article preview object with PDF info
   */
  const openFromArticlePreview = (articlePreview) => {
    openPDF(
      articlePreview.pdfUrl,
      articlePreview.searchTerm,
      articlePreview.initialPage
    );
  };

  /**
   * Open PDF from uploaded PDF data (from PDFManager)
   * @param {Object} pdf - PDF object from uploadedPDFs array
   */
  const openFromUploadedPDF = (pdf) => {
    const pdfUrl = pdf.downloadUrl || pdf.fileUrl || `/uploads/${pdf.fullFileName || pdf.fileName}`;
    openPDF(pdfUrl);
  };

  return {
    pdfViewer,
    openPDF,
    closePDF,
    openFromArticlePreview,
    openFromUploadedPDF
  };
} 