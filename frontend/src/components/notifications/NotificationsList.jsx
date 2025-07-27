// src/components/notifications/NotificationsList.jsx
import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotifications } from '../../context/NotificationContext';
import Sidebar from '../Board/sidebar/sidebar';

export const NotificationsList = () => {
  const { notifications, loading, error, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'create':
        return '✅';
      case 'update':
        return '🔄';
      case 'delete':
        return '🗑️';
      default:
        return '📌';
    }
  };

  // Group notifications by date
  const groupByDate = (notificationList) => {
    const groups = {};
    
    notificationList.forEach(notification => {
      const date = notification.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    
    return groups;
  };

  const notificationGroups = groupByDate(notifications);
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Box className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <Box className="flex-grow p-6">
        <Box className="max-w-4xl mx-auto">
          <Box className="flex justify-between items-center mb-6">
            <Typography variant="h4" component="h1" fontWeight="bold">
              Notifications
            </Typography>
            
            {unreadCount > 0 && (
              <Button 
                startIcon={<DoneAllIcon />} 
                variant="outlined"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </Box>
          
          {unreadCount > 0 && (
            <Box className="mb-4">
              <Chip 
                color="primary" 
                label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`} 
              />
            </Box>
          )}
          
          {loading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper className="p-4 mb-4">
              <Typography color="error">{error}</Typography>
            </Paper>
          ) : notifications.length === 0 ? (
            <Paper className="p-8 text-center">
              <Typography variant="h6">No notifications</Typography>
              <Typography color="textSecondary">
                You don't have any notifications at the moment
              </Typography>
            </Paper>
          ) : (
            Object.entries(notificationGroups).map(([date, notificationsForDate]) => (
              <Box key={date} className="mb-6">
                <Typography 
                  variant="h6" 
                  className="mb-2 font-medium text-gray-700"
                >
                  {formatDate(date)}
                </Typography>
                
                <Paper elevation={1}>
                  <List>
                    {notificationsForDate.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem 
                          onClick={() => markAsRead(notification.id)}
                          sx={{ 
                            cursor: 'pointer',
                            bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                            py: 2,
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ fontSize: '24px', minWidth: '40px' }}>
                            {getNotificationIcon(notification.notification_type)}
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: notification.read ? 'normal' : 'bold'
                                }}
                              >
                                {notification.message}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="textSecondary">
                                {notification.time}
                              </Typography>
                            }
                          />
                          
                          {!notification.read && (
                            <Box component="span" sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'inline-block',
                              mr: 2
                            }} />
                          )}
                        </ListItem>
                        
                        {index < notificationsForDate.length - 1 && (
                          <Divider component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};