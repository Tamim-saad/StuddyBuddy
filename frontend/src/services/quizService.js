import { http } from '../common/http';
import { authServices } from '../auth';
import axios from 'axios';
const API_BASE = '${process.env.REACT_APP_BASE_URL}/api/quiz';

export const quizService = {
  // Get all saved quizzes for the user
  getSavedQuizzes: async () => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.get(`${process.env.REACT_APP_BASE_URL}/api/quiz/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Get all saved quizzes", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching saved quizzes:', error);
      throw error.response?.data || error;
    }
  },

  // Get quizzes for a specific file
  getQuizzesForFile: async (fileId) => {
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
      console.error('Error fetching quizzes for file:', error);
      throw error.response?.data || error;
    }
  },

  // Get quiz statistics
  getQuizStats: async () => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.get(`${process.env.REACT_APP_BASE_URL}/api/quiz/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const quizzes = response.data.data?.quizzes || [];
      
      // Separate quizzes by type
      const mcqQuizzes = quizzes.filter(q => q.type === 'mcq');
      const cqQuizzes = quizzes.filter(q => q.type === 'cq');

      console.log("mcq Quiz",mcqQuizzes);
     
      
      // Calculate MCQ statistics
      const mcqScoredQuizzes = mcqQuizzes.filter(q => q.score !== null && q.score !== undefined);
      console.log(mcqScoredQuizzes.length);

      console.log("mcq Scored Quiz",mcqScoredQuizzes);
      const mcqAverageScore = mcqScoredQuizzes.length > 0 
        ? (mcqScoredQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / mcqScoredQuizzes.length)
        : 0;

      
      // Calculate CQ statistics
      const cqScoredQuizzes = cqQuizzes.filter(q => q.score !== null && q.score !== undefined);
      const cqAverageScore = cqScoredQuizzes.length > 0 
        ? (cqScoredQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / cqScoredQuizzes.length)
        : 0;
      
      // Calculate overall statistics
      const allScoredQuizzes = quizzes.filter(q => q.score !== null && q.score !== undefined);
      const overallAverageScore = allScoredQuizzes.length > 0 
        ? Math.round(allScoredQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / allScoredQuizzes.length)
        : 0;
      
      const stats = {
        total: quizzes.length,
        mcq: mcqQuizzes.length,
        cq: cqQuizzes.length,
        mcqAverageScore: mcqAverageScore,
        cqAverageScore: cqAverageScore,
        overallAverageScore: overallAverageScore,
        completed: allScoredQuizzes.length,
        mcqCompleted: mcqScoredQuizzes.length,
        cqCompleted: cqScoredQuizzes.length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      throw error.response?.data || error;
    }
  }
}; 