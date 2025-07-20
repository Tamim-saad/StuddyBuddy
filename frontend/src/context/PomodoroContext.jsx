import React, { createContext, useContext, useState, useEffect } from 'react';

const PomodoroContext = createContext();

export const usePomodoroTimer = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoroTimer must be used within a PomodoroProvider');
  }
  return context;
};

export const PomodoroProvider = ({ children }) => {
  const [activeTask, setActiveTask] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && activeTask) {
      // Timer completed
      setIsActive(false);
      setIsPaused(false);
      
      // Show completion notification
      if (Notification.permission === 'granted') {
        new Notification('🍅 Pomodoro Completed!', {
          body: `Great work on "${activeTask.title}"! Time for a break.`,
          icon: '/favicon.ico'
        });
      }
      
      // Auto-minimize after completion
      setIsMinimized(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining, activeTask]);

  // Request notification permission when provider mounts
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startTimer = (task) => {
    if (!task.pomodoro_enabled) {
      alert('This task does not have Pomodoro enabled. Please edit the task to enable it.');
      return false;
    }
    
    if (!task.pomodoro_duration || task.pomodoro_duration < 1) {
      alert('Invalid Pomodoro duration. Please edit the task and set a valid duration.');
      return false;
    }
    
    setActiveTask(task);
    setTimeRemaining(task.pomodoro_duration * 60); // Convert to seconds
    setIsActive(true);
    setIsPaused(false);
    setIsMinimized(false);
    
    return true;
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setActiveTask(null);
    setIsMinimized(false);
  };

  const resetTimer = () => {
    if (activeTask) {
      setTimeRemaining(activeTask.pomodoro_duration * 60);
      setIsActive(false);
      setIsPaused(false);
    }
  };

  const resumeTimer = () => {
    if (activeTask && timeRemaining > 0) {
      setIsActive(true);
      setIsPaused(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!activeTask) return 0;
    const totalTime = activeTask.pomodoro_duration * 60;
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  const value = {
    // State
    activeTask,
    timeRemaining,
    isActive,
    isPaused,
    isMinimized,
    
    // Actions
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    resumeTimer,
    toggleMinimize,
    
    // Helpers
    formatTime,
    getProgress,
    
    // Computed values
    isRunning: isActive && !isPaused,
    isCompleted: timeRemaining === 0 && activeTask,
    hasActiveTimer: activeTask !== null
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}; 