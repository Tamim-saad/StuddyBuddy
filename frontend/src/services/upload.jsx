import axios from 'axios';
export const uploadService = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await axios.post(`${process.env.REACT_APP_API_URL}/upload`, formData);
  },

  async getFiles() {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/files`);
    return response.data;
  },

  async startIndexing(fileId) {
    return await axios.post(`${process.env.REACT_APP_API_URL}/files/${fileId}/index`);
  }
};