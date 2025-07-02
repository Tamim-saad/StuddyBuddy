import axios from 'axios';
import { authServices } from '../auth';

const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

export const uploadService = {
  async uploadFile(file, config = {}) {
    const formData = new FormData();
    formData.append('file', file);
    const accessToken = authServices.getAccessToken(); // Changed to access token
    
    const response = await axios.post(`${API_BASE_URL}/api/uploads`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${accessToken}` // Use access token
      },
      onUploadProgress: config.onUploadProgress
    });

    if (response.status !== 201) {
      throw new Error('File upload failed');
    }
    return response.data;
  },

  async getFiles() {
    const accessToken = authServices.getAccessToken();
    const response = await axios.get(`${API_BASE_URL}/api/uploads`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  },

  async deleteFile(id) {
    const accessToken = authServices.getAccessToken();
    await axios.delete(`${API_BASE_URL}/api/uploads/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  },

  async startIndexing(id) {
    const accessToken = authServices.getAccessToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/uploads/${id}/index`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    if (response.status !== 200) {
      throw new Error('Indexing failed');
    }
    else console.log("Indexing response:", response.data);
    return response.data;
  },

  async searchFiles(query) {
    const accessToken = authServices.getAccessToken();
    const response = await axios.get(`${API_BASE_URL}/api/uploads/search`, {
      params: {
        query
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log("Search response:", response.data);
    
    if (response.status !== 200) {
      throw new Error('File search failed');
    }
    return response.data;
  }
};