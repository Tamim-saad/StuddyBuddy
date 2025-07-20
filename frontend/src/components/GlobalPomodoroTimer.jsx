import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  IconButton,
  Fade,
  Collapse
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { usePomodoroTimer } from '../context/PomodoroContext';

const GlobalPomodoroTimer = () => {
  const {
    activeTask,
    timeRemaining,
    isActive,
    isPaused,
    isMinimized,
    isRunning,
    isCompleted,
    hasActiveTimer,
    formatTime,
    getProgress,
    pauseTimer,
    stopTimer,
    resetTimer,
    resumeTimer,
    toggleMinimize
  } = usePomodoroTimer();

  // Don't render if no active timer
  if (!hasActiveTimer) {
    return null;
  }

  return (
    <Fade in={hasActiveTimer}>
      <Card 
        className={`
          fixed z-50 shadow-2xl transition-all duration-300 ease-in-out
          ${isMinimized 
            ? 'bottom-4 right-4 w-80' 
            : 'bottom-4 right-4 w-96'
          }
        `}
        style={{
          background: isCompleted 
            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
            : isRunning 
              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: isCompleted 
            ? '2px solid #16a34a' 
            : isRunning 
              ? '2px solid #f59e0b'
              : '2px solid #ef4444'
        }}
      >
        <CardContent className="p-3">
          {/* Header */}
          <Box className="flex items-center justify-between mb-2">
            <Box className="flex items-center gap-2">
              <TimerIcon 
                className={
                  isCompleted 
                    ? 'text-green-600' 
                    : isRunning 
                      ? 'text-amber-600'
                      : 'text-red-600'
                } 
              />
              <Typography variant="subtitle2" className="font-semibold">
                Pomodoro Timer
              </Typography>
            </Box>
            <Box className="flex items-center gap-1">
              <IconButton 
                size="small" 
                onClick={toggleMinimize}
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <MaximizeIcon fontSize="small" /> : <MinimizeIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={!isMinimized}>
            {/* Task Title */}
            <Typography variant="body2" className="text-gray-700 mb-3 line-clamp-2">
              {activeTask?.title}
            </Typography>

            {/* Time Display */}
            <Box className="text-center mb-3">
              <Typography 
                variant="h4" 
                className={`
                  font-mono font-bold
                  ${isCompleted 
                    ? 'text-green-600' 
                    : isRunning 
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }
                `}
              >
                {formatTime(timeRemaining)}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={getProgress()} 
                className="mt-2"
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: isCompleted 
                      ? '#16a34a' 
                      : isRunning 
                        ? '#f59e0b'
                        : '#ef4444',
                    borderRadius: 3
                  }
                }}
              />
            </Box>

            {/* Status Message */}
            {isCompleted && (
              <Box className="mb-3 p-2 bg-green-100 rounded-lg text-center">
                <Typography variant="body2" className="text-green-800 font-semibold">
                  🎉 Session completed! Great work!
                </Typography>
              </Box>
            )}

            {/* Controls */}
            <Box className="flex justify-center gap-2">
              {!isActive ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={resumeTimer}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isCompleted}
                >
                  Start
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
                  onClick={pauseTimer}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<ResetIcon />}
                onClick={resetTimer}
                className="border-gray-400 text-gray-600 hover:bg-gray-50"
              >
                Reset
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<StopIcon />}
                onClick={stopTimer}
                className="border-red-400 text-red-600 hover:bg-red-50"
              >
                Stop
              </Button>
            </Box>
          </Collapse>

          {/* Minimized View */}
          <Collapse in={isMinimized}>
            <Box className="flex items-center justify-between">
              <Typography 
                variant="h6" 
                className={`
                  font-mono font-bold
                  ${isCompleted 
                    ? 'text-green-600' 
                    : isRunning 
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }
                `}
              >
                {formatTime(timeRemaining)}
              </Typography>
              
              <Box className="flex gap-1">
                {!isActive ? (
                  <IconButton 
                    size="small" 
                    onClick={resumeTimer}
                    className="bg-green-100 hover:bg-green-200"
                    disabled={isCompleted}
                  >
                    <PlayIcon className="text-green-600" fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton 
                    size="small" 
                    onClick={pauseTimer}
                    className="bg-blue-100 hover:bg-blue-200"
                  >
                    {isPaused ? (
                      <PlayIcon className="text-blue-600" fontSize="small" />
                    ) : (
                      <PauseIcon className="text-blue-600" fontSize="small" />
                    )}
                  </IconButton>
                )}
                
                <IconButton 
                  size="small" 
                  onClick={stopTimer}
                  className="bg-red-100 hover:bg-red-200"
                >
                  <StopIcon className="text-red-600" fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={getProgress()} 
              className="mt-2"
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isCompleted 
                    ? '#16a34a' 
                    : isRunning 
                      ? '#f59e0b'
                      : '#ef4444',
                  borderRadius: 2
                }
              }}
            />
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default GlobalPomodoroTimer; 