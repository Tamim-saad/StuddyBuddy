import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { uploadService } from '../../services';

const TaskModal = ({ open, task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: [],
    status: 'pending',
    start_time: '',
    end_time: '',
    resource_id: null, // Legacy single file support
    resource_ids: [], // New multiple files support
    task_type: 'task',
    pomodoro_enabled: false,
    pomodoro_duration: 25
  });
  
  const [availableFiles, setAvailableFiles] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  // Initialize form with task data when editing
  useEffect(() => {
    if (task) {
      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          
          // Format for datetime-local input (YYYY-MM-DDTHH:MM)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
          console.error('Error formatting date:', error);
          return '';
        }
      };

      // Handle both legacy single file and new multiple files
      const resourceIds = task.resource_ids || (task.resource_id ? [task.resource_id] : []);

      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        tags: Array.isArray(task.tags) ? task.tags : [],
        status: task.status || 'pending',
        start_time: formatDateForInput(task.start_time),
        end_time: formatDateForInput(task.end_time),
        resource_id: task.resource_id || null, // Keep for backward compatibility
        resource_ids: resourceIds,
        task_type: task.task_type || 'task',
        pomodoro_enabled: Boolean(task.pomodoro_enabled),
        pomodoro_duration: task.pomodoro_duration || 25
      });
    } else {
      // Reset form for new task
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        tags: [],
        status: 'pending',
        start_time: now.toISOString().slice(0, 16),
        end_time: oneHourLater.toISOString().slice(0, 16),
        resource_id: null,
        resource_ids: [],
        task_type: 'task',
        pomodoro_enabled: false,
        pomodoro_duration: 25
      });
    }
    setErrors({});
  }, [task, open]);

  // Load available files for linking
  useEffect(() => {
    if (open) {
      loadAvailableFiles();
    }
  }, [open]);

  const loadAvailableFiles = async () => {
    try {
      const response = await uploadService.getFiles();
      setAvailableFiles(response.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleTagAdd = (newTag) => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
    }
    setTagInput('');
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (formData.end_time && formData.start_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      if (endTime <= startTime) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    if (formData.pomodoro_duration && (formData.pomodoro_duration < 1 || formData.pomodoro_duration > 120)) {
      newErrors.pomodoro_duration = 'Pomodoro duration must be between 1 and 120 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Convert datetime-local back to ISO string
    const formatDateForAPI = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString();
    };

    // Ensure proper data types for backend validation
    const taskData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      priority: formData.priority,
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      status: formData.status,
      start_time: formatDateForAPI(formData.start_time),
      end_time: formData.end_time ? formatDateForAPI(formData.end_time) : null,
      resource_id: formData.resource_id ? parseInt(formData.resource_id) : null, // Legacy support
      resource_ids: Array.isArray(formData.resource_ids) ? formData.resource_ids.map(id => parseInt(id)) : [],
      task_type: formData.task_type,
      pomodoro_enabled: Boolean(formData.pomodoro_enabled),
      pomodoro_duration: formData.pomodoro_enabled ? parseInt(formData.pomodoro_duration) || 25 : 25
    };

    console.log('Saving task with data:', taskData);
    onSave(taskData);
  };



  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        className: "rounded-lg"
      }}
    >
      <DialogTitle className="bg-blue-50 border-b">
        <Typography variant="h6" className="font-semibold">
          {task ? 'Edit Task' : 'Create New Task'}
        </Typography>
      </DialogTitle>

      <DialogContent className="p-6">
        <Grid container spacing={3}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>

          {/* Priority and Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Task Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={formData.task_type}
                onChange={(e) => handleInputChange('task_type', e.target.value)}
              >
                <MenuItem value="task">General Task</MenuItem>
                <MenuItem value="session">Study Session</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="flashcard">Flashcard Review</MenuItem>
                <MenuItem value="study">Study Material</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Times */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Start Time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              error={!!errors.start_time}
              helperText={errors.start_time}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="End Time (Optional)"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              error={!!errors.end_time}
              helperText={errors.end_time}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Tags */}
          
            
            <Box className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleTagRemove(tag)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          

          {/* Resource Links - Multiple Files */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={availableFiles}
              value={availableFiles.filter(file => formData.resource_ids.includes(file.id))}
              onChange={(event, newValue) => {
                const selectedIds = newValue.map(file => file.id);
                handleInputChange('resource_ids', selectedIds);
                // Also update single resource_id for backward compatibility
                handleInputChange('resource_id', selectedIds.length > 0 ? selectedIds[0] : null);
              }}
              getOptionLabel={(option) => option.title}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Link to Resources (Optional)"
                  placeholder="Select files to attach to this task"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.title}
                    size="small"
                    {...getTagProps({ index })}
                    icon={<LinkIcon />}
                  />
                ))
              }
            />
            {formData.resource_ids.length > 0 && (
              <Typography variant="caption" className="text-gray-600 mt-1">
                {formData.resource_ids.length} file(s) attached
              </Typography>
            )}
          </Grid>

          {/* Pomodoro Settings */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.pomodoro_enabled}
                  onChange={(e) => handleInputChange('pomodoro_enabled', e.target.checked)}
                />
              }
              label="Enable Pomodoro Timer"
            />
            
            {formData.pomodoro_enabled && (
              <TextField
                type="number"
                label="Pomodoro Duration (minutes)"
                value={formData.pomodoro_duration}
                onChange={(e) => handleInputChange('pomodoro_duration', parseInt(e.target.value))}
                error={!!errors.pomodoro_duration}
                helperText={errors.pomodoro_duration}
                inputProps={{ min: 1, max: 120 }}
                className="ml-4"
                style={{ width: '200px' }}
              />
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button
          onClick={onClose}
          startIcon={<CancelIcon />}
          className="text-gray-600"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal; 