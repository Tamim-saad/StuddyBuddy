import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayCircleFilled as InProgressIcon,
  AccessTime as TimeIcon,
  Link as LinkIcon,
  Quiz as QuizIcon,
  StickyNote2 as StickyNoteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { uploadService } from '../../services';
import PDFAnnotationViewer from '../PDFAnnotationViewer';
import { usePomodoroTimer } from '../../context/PomodoroContext';

const TaskList = ({
  tasks,
  loading,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onTaskStart,
  getPriorityColor,
  getStatusColor
}) => {
  const navigate = useNavigate();
  const { startTimer } = usePomodoroTimer();
  const [viewingFile, setViewingFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const handleStartActivity = (task, fileId) => {
    if (task.task_type === 'quiz') {
      navigate('/home/saved-quiz', { 
        state: { 
          preselectedFileId: fileId 
        } 
      });
    } else if (task.task_type === 'flashcard') {
      navigate('/home/saved-notes', { 
        state: { 
          preselectedFileId: fileId 
        } 
      });
    }
  };

  const handleResourceClick = async (fileId) => {
    if (!fileId) return;
    
    try {
      setLoadingFile(true);
      // Get all files and find the one with matching fileId
      const response = await uploadService.getFiles();
      const file = response.files?.find(f => f.id === fileId);
      
      if (file && file.type === 'application/pdf') {
        setViewingFile(file);
      } else if (file) {
        // For non-PDF files, open in new tab
        window.open(`${process.env.REACT_APP_BASE_URL}/${file.file_url}`, '_blank');
      } else {
        console.error('File not found with ID:', fileId);
      }
    } catch (error) {
      console.error('Error opening resource file:', error);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleCloseViewer = () => {
    setViewingFile(null);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckIcon style={{ color: getStatusColor(status) }} />;
      case 'in_progress':
        return <InProgressIcon style={{ color: getStatusColor(status) }} />;
      default:
        return <PendingIcon style={{ color: getStatusColor(status) }} />;
    }
  };

  const handleStatusToggle = (task) => {
    let newStatus;
    switch (task.status) {
      case 'pending':
        newStatus = 'in_progress';
        break;
      case 'in_progress':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'pending';
        break;
      default:
        newStatus = 'in_progress';
    }
    onTaskStatusChange(task.id, newStatus);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Typography variant="h6" className="text-gray-500 mb-2">
            No tasks found
          </Typography>
          <Typography variant="body2" className="text-gray-400">
            Create your first task to get started!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // If viewing a PDF, show the PDF viewer
  if (viewingFile) {
    return (
      <PDFAnnotationViewer
        fileId={viewingFile.id}
        filePath={viewingFile.file_url}
        fileName={viewingFile.title}
        onClose={handleCloseViewer}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <List>
          {tasks.map((task, index) => (
            <ListItem
              key={task.id}
              className={`border-b ${index === tasks.length - 1 ? 'border-b-0' : ''}`}
              style={{
                borderLeft: `4px solid ${getPriorityColor(task.priority)}`
              }}
            >
              <ListItemText
                primary={
                  <Box className="flex items-center gap-2 mb-1">
                    <Typography variant="subtitle1" className="font-medium">
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.priority}
                      size="small"
                      style={{
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip
                      label={task.task_type}
                      size="small"
                      variant="outlined"
                    />
                    {/* Display attached files */}
                    {task.attached_files && task.attached_files.length > 0 && (
                      <Box className="flex gap-1 flex-wrap">
                        {task.attached_files.slice(0, 3).map((file) => (
                          <Chip
                            key={file.id}
                            icon={<LinkIcon />}
                            label={file.title}
                            size="small"
                            variant="outlined"
                            className="text-blue-600 cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResourceClick(file.id);
                            }}
                            disabled={loadingFile}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                        {task.attached_files.length > 3 && (
                          <Chip
                            label={`+${task.attached_files.length - 3} more`}
                            size="small"
                            variant="outlined"
                            className="text-gray-500"
                          />
                        )}
                      </Box>
                    )}
                    {/* Legacy single file support */}
                    {!task.attached_files && task.resource_title && (
                      <Chip
                        icon={<LinkIcon />}
                        label={task.resource_title}
                        size="small"
                        variant="outlined"
                        className="text-blue-600 cursor-pointer hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResourceClick(task.resource_id);
                        }}
                        disabled={loadingFile}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    {task.description && (
                      <Typography variant="body2" className="text-gray-600 mb-1">
                        {task.description}
                      </Typography>
                    )}
                    
                    <Box className="flex items-center gap-4 text-sm text-gray-500">
                      <Box className="flex items-center gap-1">
                        <TimeIcon style={{ fontSize: 16 }} />
                        {task.start_time && formatTime(task.start_time)}
                        {task.end_time && ` - ${formatTime(task.end_time)}`}
                      </Box>
                      
                      {task.tags && task.tags.length > 0 && (
                        <Box className="flex gap-1">
                          {task.tags.slice(0, 3).map((tag, i) => (
                            <Chip
                              key={i}
                              label={tag}
                              size="small"
                              variant="outlined"
                              className="h-5"
                            />
                          ))}
                          {task.tags.length > 3 && (
                            <Typography variant="caption" className="text-gray-400">
                              +{task.tags.length - 3}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                    
                    {/* Direct Activity Buttons for Quiz/Flashcard Tasks - Moved below */}
                    {(task.task_type === 'quiz' || task.task_type === 'flashcard') && (
                      <Box className="flex gap-1 mt-2">
                        {task.attached_files && task.attached_files.length > 0 && task.attached_files.map((file) => (
                          <Button
                            key={`activity-${file.id}`}
                            size="small"
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartActivity(task, file.id);
                            }}
                            startIcon={task.task_type === 'quiz' ? <QuizIcon /> : <StickyNoteIcon />}
                            className="text-white text-xs px-2 py-1"
                            style={{
                              backgroundColor: task.task_type === 'quiz' ? '#2563eb' : '#ea580c',
                              fontSize: '0.75rem',
                              minWidth: 'auto'
                            }}
                            title={`Start ${task.task_type === 'quiz' ? 'Quiz' : 'Flashcard Review'} for ${file.title}`}
                          >
                            {task.task_type === 'quiz' ? 'Review Quiz' : 'Review  StickyNotes'}
                          </Button>
                        ))}
                        {/* Legacy single file support for activities */}
                        {!task.attached_files && task.resource_id && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartActivity(task, task.resource_id);
                            }}
                            startIcon={task.task_type === 'quiz' ? <QuizIcon /> : <StickyNoteIcon />}
                            className="text-white text-xs px-2 py-1"
                            style={{
                              backgroundColor: task.task_type === 'quiz' ? '#2563eb' : '#ea580c',
                              fontSize: '0.75rem',
                              minWidth: 'auto'
                            }}
                            title={`Start ${task.task_type === 'quiz' ? 'Quiz' : 'Flashcard Review'}`}
                          >
                            {task.task_type === 'quiz' ? 'Review Quiz' : 'Review  StickyNotes'}
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <Box className="flex items-center gap-1">
                  {/* Status Toggle */}
                  <IconButton
                    size="small"
                    onClick={() => handleStatusToggle(task)}
                    title={`Mark as ${task.status === 'pending' ? 'in progress' : 
                           task.status === 'in_progress' ? 'completed' : 'pending'}`}
                  >
                    {getStatusIcon(task.status)}
                  </IconButton>

                  {/* Start Pomodoro */}
                  {task.pomodoro_enabled && task.status !== 'completed' && (
                    <IconButton
                      size="small"
                      onClick={() => startTimer(task)}
                      title="Start Pomodoro Timer"
                      style={{ 
                        color: '#16a34a',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #16a34a'
                      }}
                    >
                      <PlayIcon />
                    </IconButton>
                  )}

                  {/* Edit */}
                  <IconButton
                    size="small"
                    onClick={() => onTaskEdit(task)}
                    title="Edit Task"
                  >
                    <EditIcon />
                  </IconButton>

                  {/* Delete */}
                  <IconButton
                    size="small"
                    onClick={() => onTaskDelete(task.id)}
                    title="Delete Task"
                    className="text-red-600"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TaskList; 