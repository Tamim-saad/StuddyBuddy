import { http } from '../common/http';
import { authServices } from '../auth';

const API_BASE = '/api/stickynotes';

export const stickyNotesService = {
  // Get all sticky notes for a file
  getStickyNotesForFile: async (fileId) => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.get(`${API_BASE}/file/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching sticky notes for file:', error);
      throw error.response?.data || error;
    }
  },

  // Get all sticky notes for the user across all files
  getAllStickyNotes: async () => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.get(`${API_BASE}/user/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching all sticky notes:', error);
      throw error.response?.data || error;
    }
  },

  // Get sticky notes statistics
  getStickyNotesStats: async () => {
    try {
      const notes = await stickyNotesService.getAllStickyNotes();
      
      // Calculate statistics
      const stats = {
        total: notes.length,
        highImportance: notes.filter(n => n.importance === 'high').length,
        mediumImportance: notes.filter(n => n.importance === 'medium').length,
        lowImportance: notes.filter(n => n.importance === 'low').length,
        uniqueFiles: new Set(notes.map(n => n.file_id)).size,
        averageNotesPerFile: notes.length > 0 ? Math.round(notes.length / new Set(notes.map(n => n.file_id)).size) : 0
      };

      return stats;
    } catch (error) {
      console.error('Error calculating sticky notes stats:', error);
      throw error;
    }
  }
}; 