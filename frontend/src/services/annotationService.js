// src/services/annotationService.js
import { authServices } from '../auth';

const API_BASE_URL = process.env.REACT_APP_BASE_URL;

export const annotationService = {
  // Save annotated PDF (saves as new file, keeps original)
  async saveAnnotatedPDF(originalFileId, annotatedPdfBlob) {
    try {
      const formData = new FormData();
      formData.append('annotatedPdf', annotatedPdfBlob, 'annotated.pdf');
      formData.append('originalFileId', originalFileId);

      const accessToken = authServices.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/uploads/save-annotated`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save annotations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving annotated PDF:', error);
      throw error;
    }
  },

  // Get PDF for annotation (original file)
  getPDFUrl(filePath) {
    return `${API_BASE_URL}${filePath}`;
  },

  // Get annotated PDF URL if it exists
  getAnnotatedPDFUrl(filePath) {
    return `${API_BASE_URL}/${filePath}`;
  },

  // Check if file has annotations and get file info
  async getFileAnnotationInfo(fileId) {
    try {
      const accessToken = authServices.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/uploads/${fileId}/info`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get file info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting file annotation info:', error);
      throw error;
    }
  }
};

export default annotationService;
