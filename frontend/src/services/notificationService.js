// src/services/notificationService.js
import axios from 'axios';
import { authServices } from '../auth';

const API_URL = process.env.REACT_APP_BASE_URL;

export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${authServices.getAccessToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authServices.getAccessToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authServices.getAccessToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  createNotification: async (notificationData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/notifications`,
        notificationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authServices.getAccessToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
};