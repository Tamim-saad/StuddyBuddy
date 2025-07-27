import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Fab,
  Chip,
  Button,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  List as ListIcon,
  ViewWeek as WeekIcon,
  Today as TodayIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { green, blue, orange, red, grey } from '@mui/material/colors';
import { plannerService } from '../../services/plannerService';
import TaskModal from './TaskModal';
import CalendarView from './CalendarView';
import TaskList from './TaskList';
import SuggestedTasks from './SuggestedTasks';
import PomodoroTimer from './PomodoroTimer';
import { usePomodoroTimer } from '../../context/PomodoroContext';
import { authServices } from '../../auth';

const PlannerDashboard = () => {
  // Global Pomodoro timer context
  const { startTimer } = usePomodoroTimer();

  // State management
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar', 'list', 'week'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  // Utility function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  // Handle task start for Pomodoro timer
  const handleTaskStart = (task) => {
    startTimer(task);
  };

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
    loadSuggestions();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await plannerService.getTasks(filters);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await plannerService.getAutoSuggestions();
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  // Task operations
  const handleCreateTask = async (taskData) => {
    try {
      const formattedData = plannerService.formatTaskForAPI(taskData);
      const newTask = await plannerService.createTask(formattedData);
      setTasks(prev => [newTask, ...prev]);
      setIsTaskModalOpen(false);
      setEditingTask(null);
      console.log("New Task", newTask);
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          task_type: newTask.task_type,
          action: 'create'
        })
      });
      const data = await response.json();

      if (data.success) {
        // Use the exact message from the backend
        console.log(data.message);
        setMessage(data.message);
      } else {
        // Handle error
        console.log(data.error);
        setMessage(data.error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  // Function to open task for editing
  const handleEditTask = (task) => {
    console.log('Opening task for editing:', task);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      console.log('Updating task with data:', updates);
      const updatedTask = await plannerService.updateTask(taskId, updates,setMessage);
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));
      setIsTaskModalOpen(false);
      setEditingTask(null);
      console.log("Updated Task", updatedTask);
      
    } catch (error) {
      console.error('Error updating task:', error);
      console.error('Full error object:', error);

      // Handle different types of errors
      let errorMessage = 'Failed to update task';

      if (error.response && error.response.data && error.response.data.error) {
        // Server returned an error response
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // Network error or other error with message
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        // String error
        errorMessage = error;
      }

      alert(`Failed to update task: ${errorMessage}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await plannerService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await plannerService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return red[500];
      case 'medium': return orange[500];
      case 'low': return green[500];
      default: return grey[500];
    }
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return green[500];
      case 'in_progress': return blue[500];
      case 'pending': return grey[500];
      default: return grey[500];
    }
  };

  // Filter tasks based on current date/view (using local timezone)
  const getFilteredTasks = () => {
    let filtered = tasks;

    if (currentView === 'calendar' || currentView === 'week') {
      const selectedDateStr = formatLocalDate(selectedDate);
      filtered = tasks.filter(task => {
        const taskDate = new Date(task.start_time);
        const taskDateStr = formatLocalDate(taskDate);
        return taskDateStr === selectedDateStr;
      });
    }

    return filtered;
  };

  const handleViewChange = (event, newValue) => {
    setCurrentView(newValue);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      status: '',
      search: ''
    });
  };



  return (
    <Box className="flex-1 bg-gray-50 min-h-screen overflow-auto">
      <Box className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <Box className="mb-6">
          <Typography variant="h4" className="font-bold text-gray-800 mb-2">
            Study Planner
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
            Organize your study sessions, track progress, and achieve your goals
          </Typography>
        </Box>

        {/* Action Bar */}
        <Card className="mb-4 shadow-sm">
          <CardContent className="p-4">
            <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Box className="flex items-center gap-4">
                <Tabs
                  value={currentView}
                  onChange={handleViewChange}
                  variant="standard"
                  className="border-b-0"
                >
                  <Tab
                    icon={<EventIcon />}
                    label="Calendar"
                    value="calendar"
                    className="min-h-12"
                  />
                  <Tab
                    icon={<ListIcon />}
                    label="List"
                    value="list"
                    className="min-h-12"
                  />
                  <Tab
                    icon={<WeekIcon />}
                    label="Week"
                    value="week"
                    className="min-h-12"
                  />
                </Tabs>

                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? "primary" : "default"}
                  className="bg-gray-100 hover:bg-gray-200"
                >
                  <FilterIcon />
                </IconButton>
              </Box>

              <Fab
                color="primary"
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                size="medium"
              >
                <AddIcon />
              </Fab>
            </Box>
          </CardContent>
        </Card>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-4">
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search tasks"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button onClick={clearFilters} variant="outlined" size="small">
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={9}>
            <Box className="min-h-[600px]">
              {currentView === 'calendar' && (
                <CalendarView
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onTaskClick={handleEditTask}
                  onTaskStatusChange={handleTaskStatusChange}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              )}

              {currentView === 'list' && (
                <TaskList
                  tasks={getFilteredTasks()}
                  loading={loading}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskStart={handleTaskStart}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              )}

              {currentView === 'week' && (
                <CalendarView
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onTaskClick={handleEditTask}
                  onTaskStatusChange={handleTaskStatusChange}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  viewType="week"
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} lg={3}>
            <Box className="space-y-4">
              {/* Suggested Tasks */}
              <SuggestedTasks
                suggestions={suggestions}
                onCreateFromSuggestion={(suggestion) => {
                  console.log('Creating task from suggestion:', suggestion);
                  setEditingTask({
                    title: suggestion.suggested_title,
                    description: suggestion.suggested_description,
                    resource_id: suggestion.resource_id,
                    task_type: suggestion.task_type,
                    priority: 'medium'
                  });
                  setIsTaskModalOpen(true);
                }}
              />

              {/* Pomodoro Timer is now global and floating */}
            </Box>
          </Grid>
        </Grid>

        {/* Task Modal */}
        <TaskModal
          open={isTaskModalOpen}
          task={editingTask}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={editingTask && editingTask.id ?
            (updates) => {
              console.log('Editing task:', editingTask);
              console.log('Task ID:', editingTask.id);
              return handleUpdateTask(editingTask.id, updates);
            } :
            handleCreateTask
          }
        />
      </Box>
    </Box>
  );
};

export default PlannerDashboard; 