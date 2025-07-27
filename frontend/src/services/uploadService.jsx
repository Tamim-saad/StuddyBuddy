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

  async startIndexing(fileUrl) {
    const accessToken = authServices.getAccessToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/uploads/extract-text`,
      {
        file_url: fileUrl
      },
      {
        headers: {
          'Content-Type': 'application/json',
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
  },

  async downloadFile(id) {
    const accessToken = authServices.getAccessToken();
    const response = await axios.get(`${API_BASE_URL}/api/uploads/download/${id}`, {
      responseType: 'blob', // Important for file download
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log("Download response:", response);

    if (response.status !== 200) {
      throw new Error('File download failed');
    }

    // // Create a link element to trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `file_${id}.pdf`); // Set the file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
,
async updateFile(id, fileData) {
    const accessToken = authServices.getAccessToken();
    const response = await axios.put(`${API_BASE_URL}/api/uploads/update/${id}`, fileData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (response.status !== 200) {
      throw new Error('File update failed');
    }
    return response.data;
  }
};