import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Chip,
  Button
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  AccessTime as TimeIcon,
  Quiz as QuizIcon,
  StickyNote2 as StickyNoteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CalendarView = ({ 
  tasks, 
  selectedDate, 
  onDateSelect, 
  onTaskClick, 
  onTaskStatusChange,
  getPriorityColor,
  getStatusColor,
  viewType = 'month'
}) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Utility function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date) => {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  };

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

  // Get tasks for a specific date (using local timezone)
  const getTasksForDate = (date) => {
    const dateStr = formatLocalDate(date);
    return tasks.filter(task => {
      const taskDate = new Date(task.start_time);
      const taskDateStr = formatLocalDate(taskDate);
      return taskDateStr === dateStr;
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    if (viewType === 'week') {
      return generateWeekDays();
    }
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday before the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last Saturday after the last day of month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Generate week days for week view
  const generateWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const todayStr = formatLocalDate(today);

  const navigateMonth = (direction) => {
    if (viewType === 'week') {
      navigateWeek(direction);
    } else {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(newMonth.getMonth() + direction);
      setCurrentMonth(newMonth);
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    onDateSelect(newDate);
    setCurrentMonth(new Date(newDate)); // Keep month in sync
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date) => {
    return formatLocalDate(date) === todayStr;
  };

  const isSelected = (date) => {
    return formatLocalDate(date) === formatLocalDate(selectedDate);
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const getHeaderTitle = () => {
    if (viewType === 'week') {
      const weekDays = generateWeekDays();
      const startDate = weekDays[0];
      const endDate = weekDays[6];
      
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })} - Week of ${startDate.getDate()}`;
      } else {
        return `${startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
      }
    }
    
    return currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="h-full">
      <CardContent className="p-0">
        {/* Calendar Header */}
        <Box className="p-4 border-b bg-blue-50">
          <Box className="flex justify-between items-center">
            <Typography variant="h6" className="font-semibold">
              {getHeaderTitle()}
            </Typography>
            <Box className="flex items-center gap-2">
              <Button
                size="small"
                startIcon={<TodayIcon />}
                onClick={goToToday}
                variant="outlined"
              >
                Today
              </Button>
              <IconButton onClick={() => navigateMonth(-1)}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={() => navigateMonth(1)}>
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Days of Week Header */}
        <Grid container className="border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs key={day} className="p-2 text-center bg-gray-50">
              <Typography variant="caption" className="font-semibold text-gray-600">
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Grid */}
        {viewType === 'week' ? (
          // Week View - Single row of 7 days
          <Grid container>
            {calendarDays.map((date, index) => {
              const dayTasks = getTasksForDate(date);
              const isTodayDay = isToday(date);
              const isSelectedDay = isSelected(date);

              return (
                <Grid 
                  item 
                  xs={12/7} 
                  key={index}
                  className={`
                    border-r border-b min-h-[200px] cursor-pointer transition-colors
                    ${isSelectedDay ? 'bg-blue-100' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => onDateSelect(date)}
                >
                  <Box className="p-3 h-full">
                    {/* Date Number */}
                    <Box className="flex justify-between items-start mb-3">
                      <Typography 
                        variant="h6" 
                        className={`
                          font-medium
                          ${isTodayDay ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm' : ''}
                          ${!isTodayDay ? 'text-gray-700' : ''}
                        `}
                      >
                        {date.getDate()}
                      </Typography>
                      {dayTasks.length > 0 && (
                        <Chip 
                          label={dayTasks.length} 
                          size="small" 
                          className="h-6 text-sm bg-blue-100 text-blue-800"
                        />
                      )}
                    </Box>

                    {/* Tasks */}
                    <Box className="space-y-2">
                      {dayTasks.map((task) => (
                        <Box
                          key={task.id}
                          className={`
                            p-2 rounded text-sm cursor-pointer
                            hover:shadow-sm transition-shadow
                          `}
                          style={{ 
                            backgroundColor: `${getPriorityColor(task.priority)}20`,
                            borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                        >
                          <Typography variant="body2" className="font-medium block mb-1">
                            {task.title}
                          </Typography>
                          {task.start_time && (
                            <Typography variant="caption" className="text-gray-600 flex items-center gap-1 mb-1">
                              <TimeIcon style={{ fontSize: 12 }} />
                              {formatTime(task.start_time)}
                            </Typography>
                          )}
                          {/* Activity buttons for quiz/flashcard tasks */}
                          {(task.task_type === 'quiz' || task.task_type === 'flashcard') && (
                            <Box className="mt-2">
                              {task.attached_files && task.attached_files.length > 0 && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartActivity(task, task.attached_files[0].id);
                                  }}
                                  startIcon={task.task_type === 'quiz' ? <QuizIcon /> : <StickyNoteIcon />}
                                  className="text-white"
                                  style={{
                                    backgroundColor: task.task_type === 'quiz' ? '#2563eb' : '#ea580c',
                                    fontSize: '0.75rem',
                                    minWidth: 'auto',
                                    padding: '4px 8px',
                                    height: '24px'
                                  }}
                                  title={`Start ${task.task_type === 'quiz' ? 'Quiz' : 'Flashcard Review'}`}
                                >
                                  {task.task_type === 'quiz' ? 'Quiz' : 'Flash'}
                                </Button>
                              )}
                              {/* Legacy single file support */}
                              {!task.attached_files && task.resource_id && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartActivity(task, task.resource_id);
                                  }}
                                  startIcon={task.task_type === 'quiz' ? <QuizIcon /> : <StickyNoteIcon />}
                                  className="text-white"
                                  style={{
                                    backgroundColor: task.task_type === 'quiz' ? '#2563eb' : '#ea580c',
                                    fontSize: '0.75rem',
                                    minWidth: 'auto',
                                    padding: '4px 8px',
                                    height: '24px'
                                  }}
                                  title={`Start ${task.task_type === 'quiz' ? 'Quiz' : 'Flashcard Review'}`}
                                >
                                  {task.task_type === 'quiz' ? 'Quiz' : 'Flash'}
                                </Button>
                              )}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          // Month View - Multiple rows showing full month
          <Grid container>
            {calendarDays.map((date, index) => {
              const dayTasks = getTasksForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDay = isToday(date);
              const isSelectedDay = isSelected(date);

              return (
                <Grid 
                  item 
                  xs={12/7} 
                  key={index}
                  className={`
                    border-r border-b min-h-[120px] cursor-pointer transition-colors
                    ${isSelectedDay ? 'bg-blue-100' : 'hover:bg-gray-50'}
                    ${!isCurrentMonthDay ? 'bg-gray-100' : ''}
                  `}
                  onClick={() => onDateSelect(date)}
                >
                  <Box className="p-2 h-full">
                    {/* Date Number */}
                    <Box className="flex justify-between items-start mb-2">
                      <Typography 
                        variant="body2" 
                        className={`
                          font-medium
                          ${isTodayDay ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                          ${!isCurrentMonthDay ? 'text-gray-400' : 'text-gray-700'}
                        `}
                      >
                        {date.getDate()}
                      </Typography>
                      {dayTasks.length > 0 && (
                        <Chip 
                          label={dayTasks.length} 
                          size="small" 
                          className="h-5 text-xs bg-blue-100 text-blue-800"
                        />
                      )}
                    </Box>

                    {/* Tasks */}
                    <Box className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <Box
                          key={task.id}
                          className={`
                            p-1 rounded text-xs cursor-pointer
                            hover:shadow-sm transition-shadow
                          `}
                          style={{ 
                            backgroundColor: `${getPriorityColor(task.priority)}20`,
                            borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                        >
                          <Typography variant="caption" className="font-medium block truncate">
                            {task.title}
                          </Typography>
                          {task.start_time && (
                            <Typography variant="caption" className="text-gray-600 flex items-center gap-1">
                              <TimeIcon style={{ fontSize: 10 }} />
                              {formatTime(task.start_time)}
                            </Typography>
                          )}
                          {/* Activity buttons for quiz/flashcard tasks */}
                          {(task.task_type === 'quiz' || task.task_type === 'flashcard') && (
                            <Box className="mt-1">
                              {task.attached_files && task.attached_files.length > 0 && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartActivity(task, task.attached_files[0].id);
                                  }}
                                  startIcon={task.task_type === 'quiz' ? <QuizIcon /> : <StickyNoteIcon />}
                                  className="text-white"
                                  style={{
                                    backgroundColor: task.task_type === 'quiz' ? '#2563eb' : '#ea580c',
                                    fontSize: '0.65rem',
                                    minWidth: 'auto',
                                    padding: '2px 6px',
                                    height: '20px'
                                  }}
                                  title={`Start ${task.task_type === 'quiz' ? 'Quiz' : 'Flashcard Review'}`}
                                >
                                  {task.task_type === 'quiz' ? 'Quiz' : 'Flash'}
                                </Button>
                              )}
                              {/* Legacy single file support */}
                              {!task.attached_files && task.resource_id && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartActivity(task, task.resource_id);
                                  }}
                                  startIcon={task.task_type === 'quiz' ? <QuizIcon /> : <StickyNoteIcon />}
                                  className="text-white"
                                  style={{
                                    backgroundColor: task.task_type === 'quiz' ? '#2563eb' : '#ea580c',
                                    fontSize: '0.65rem',
                                    minWidth: 'auto',
                                    padding: '2px 6px',
                                    height: '20px'
                                  }}
                                  title={`Start ${task.task_type === 'quiz' ? 'Quiz' : 'Flashcard Review'}`}
                                >
                                  {task.task_type === 'quiz' ? 'Quiz' : 'Flash'}
                                </Button>
                              )}
                            </Box>
                          )}
                        </Box>
                      ))}
                      
                      {dayTasks.length > 3 && (
                        <Typography variant="caption" className="text-gray-500 text-xs">
                          +{dayTasks.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarView; 