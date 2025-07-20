import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const PomodoroTimer = ({ task, onComplete, onStop }) => {
  // Safety check for pomodoro_duration
  const duration = task.pomodoro_duration || 25;
  
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval = null;
    
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
      onComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = duration * 60;
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
    onStop();
  };

  return (
    <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500">
      <CardContent>
        <Box className="flex items-center gap-2 mb-3">
          <TimerIcon className="text-red-600" />
          <Typography variant="h6" className="font-semibold">
            Pomodoro Timer
          </Typography>
        </Box>
        
        <Typography variant="body2" className="text-gray-600 mb-3">
          {task.title}
        </Typography>

        <Box className="text-center mb-4">
          <Typography variant="h3" className="font-mono font-bold text-red-600">
            {formatTime(timeRemaining)}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            className="mt-2"
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ef4444',
              }
            }}
          />
        </Box>

        <Box className="flex justify-center gap-2">
          {!isActive ? (
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700"
            >
              Start
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
              onClick={handlePause}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={handleStop}
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Stop
          </Button>
        </Box>

        {timeRemaining === 0 && (
          <Box className="mt-3 p-3 bg-green-100 rounded-lg text-center">
            <Typography variant="body2" className="text-green-800 font-semibold">
              🎉 Pomodoro session completed! Great work!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer; 