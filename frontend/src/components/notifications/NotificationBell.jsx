// src/components/notifications/NotificationBell.jsx
import React, { useState, useMemo } from 'react';
import { 
  Badge, 
  IconButton, 
  Popover, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Box, 
  Button,
  Divider,
  ListItemIcon
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircleIcon from '@mui/icons-material/Circle';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    unreadCount, 
    loading,
    initialized,
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const navigate = useNavigate();

  // Memoize the first 5 notifications
  const recentNotifications = useMemo(() => 
    notifications.slice(0, 5),
    [notifications]
  );
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

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

  return (
    <>
      <IconButton
        aria-describedby={id}
        color="inherit"
        onClick={handleClick}
        sx={{ mx: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 320, 
            maxHeight: 400,
            overflowY: 'auto'
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button 
              startIcon={<DoneAllIcon />}
              size="small"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        
        {!initialized || loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Loading notifications...</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>No notifications</Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {recentNotifications.map((notification) => (
                <ListItem 
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                  secondaryAction={
                    !notification.read && (
                      <ListItemIcon sx={{ minWidth: 'auto' }}>
                        <CircleIcon sx={{ color: 'primary.main', fontSize: '10px' }} />
                      </ListItemIcon>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    <Typography fontSize="20px">
                      {getNotificationIcon(notification.notification_type)}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={notification.message}
                    secondary={new Date(notification.date).toLocaleDateString() + ' ' + notification.time}
                    primaryTypographyProps={{
                      variant: 'body2',
                      style: { 
                        fontWeight: notification.read ? 'normal' : 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      style: { 
                        whiteSpace: 'nowrap'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider />
            
          </>
        )}
      </Popover>
    </>
  );
};