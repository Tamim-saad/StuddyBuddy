// src/context/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import debounce from 'lodash/debounce';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true); // Start with true
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce(async () => {
      if (!initialized) return;
      
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications.filter(n => !n.read).length);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications');
      }
    }, 1000),
    [initialized]
  );

  // Initial fetch
  const initialFetch = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    initialFetch();
    
    // Set up polling with the debounced fetch
    const interval = setInterval(debouncedFetch, 30000);
    return () => {
      clearInterval(interval);
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    initialized,
    markAsRead,
    markAllAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};