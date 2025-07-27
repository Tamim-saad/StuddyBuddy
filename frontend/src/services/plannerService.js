import { http } from '../common/http';
import { authServices } from '../auth';

const API_BASE = '/api/planner';

export const plannerService = {
  // Get all planner tasks with optional filters
  getTasks: async (filters = {}) => {
    try {
      const token = authServices.getAccessToken();
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

      const response = await http.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching planner tasks:', error);
      throw error.response?.data || error;
    }
  },

  // Get single task by ID
  getTask: async (taskId) => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.get(`${API_BASE}/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching planner task:', error);
      throw error.response?.data || error;
    }
  },

  // Create new planner task
  createTask: async (taskData) => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.post(API_BASE, taskData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating planner task:', error);
      throw error.response?.data || error;
    }
  },

  // Update planner task
  updateTask: async (taskId, updates, setMessage) => {
    try {
      const token = authServices.getAccessToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Log the data being sent for debugging
      console.log('Sending task update to backend:', { taskId, updates });
      
      const response = await http.put(`${API_BASE}/${taskId}`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Response from backend:', response.data);

      setMessage(response.data.message);
      return response.data.notification;
    } catch (error) {
      console.error('Error updating planner task:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        console.error('Backend response:', error.response.data);
        console.error('Status code:', error.response.status);
        
        const serverError = error.response.data?.error || 'Server error occurred';
        throw new Error(serverError);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error - no response received:', error.request);
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  },

  // Delete planner task
  deleteTask: async (taskId) => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.delete(`${API_BASE}/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting planner task:', error);
      throw error.response?.data || error;
    }
  },

  // Get auto-suggested tasks based on saved content
  getAutoSuggestions: async () => {
    try {
      const token = authServices.getAccessToken();
      const response = await http.get(`${API_BASE}/suggest/auto`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching task suggestions:', error);
      throw error.response?.data || error;
    }
  },

  // Mark task as completed
  markCompleted: async (taskId) => {
    return plannerService.updateTask(taskId, { status: 'completed' });
  },

  // Mark task as in progress
  markInProgress: async (taskId) => {
    return plannerService.updateTask(taskId, { status: 'in_progress' });
  },

  // Mark task as pending
  markPending: async (taskId) => {
    return plannerService.updateTask(taskId, { status: 'pending' });
  },

  // Get tasks for a specific date range (calendar view)
  getTasksForDateRange: async (startDate, endDate) => {
    return plannerService.getTasks({
      start_date: startDate,
      end_date: endDate
    });
  },

  // Get tasks by priority
  getTasksByPriority: async (priority) => {
    return plannerService.getTasks({ priority });
  },

  // Get tasks by status
  getTasksByStatus: async (status) => {
    return plannerService.getTasks({ status });
  },

  // Get tasks by tag
  getTasksByTag: async (tag) => {
    return plannerService.getTasks({ tag });
  },

  // Helper method to format task data for API
  formatTaskForAPI: (taskData) => {
    return {
      title: taskData.title?.trim() || '',
      description: taskData.description?.trim() || '',
      priority: taskData.priority || 'medium',
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      status: taskData.status || 'pending',
      start_time: taskData.start_time,
      end_time: taskData.end_time || null,
      resource_id: taskData.resource_id ? parseInt(taskData.resource_id) : null, // Legacy support
      resource_ids: Array.isArray(taskData.resource_ids) ? taskData.resource_ids.map(id => parseInt(id)) : [],
      task_type: taskData.task_type || 'task',
      pomodoro_enabled: Boolean(taskData.pomodoro_enabled),
      pomodoro_duration: parseInt(taskData.pomodoro_duration) || 25
    };
  },

  // Helper method to calculate task duration
  getTaskDuration: (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    
    return {
      hours: Math.floor(durationMs / (1000 * 60 * 60)),
      minutes: Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)),
      total_minutes: Math.floor(durationMs / (1000 * 60))
    };
  }
};

export default plannerService; 