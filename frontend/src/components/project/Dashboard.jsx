import React, { useState, useEffect } from "react";
import { Typography, IconButton, Box, Card, CardContent } from "../../common/icons";
import { Grid } from "@mui/material";
// import { ProjectCreate } from "./recentProjects";
// import { PersonalTaskStats } from "./PersonalTaskStats";
// import { TeamWorkload } from "./TeamWorkload";
import { useMembers } from "../../context/MembersContext";
import { plannerService } from "../../services/plannerService";

export const Dashboard = () => {
  // Access the refresh function from context
  const { refreshData, loading } = useMembers();

  // Planner stats state
  const [tasks, setTasks] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(true);

  // State to track when last refresh occurred
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // State to show refresh animation
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Utility function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date) => {
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0');
  };

  // Load planner tasks
  const loadTasks = async () => {
    try {
      setPlannerLoading(true);
      const response = await plannerService.getTasks({});
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setPlannerLoading(false);
    }
  };

  // Calculate planner stats
  const getTaskStats = () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.start_time);
      const taskDateStr = formatLocalDate(taskDate);
      return taskDateStr === todayStr;
    });

    return {
      total: tasks.length,
      today: todayTasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length
    };
  };

  const stats = getTaskStats();

  // Function to handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refreshData(), loadTasks()]).then(() => {
      setLastRefreshed(new Date());
      setTimeout(() => setIsRefreshing(false), 500); // Add slight delay for animation
    });
  };

  // Auto-refresh on component mount and when dependencies change
  useEffect(() => {
    // Initial refresh
    refreshData();
    loadTasks();
    setLastRefreshed(new Date());

    // Set up auto-refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      refreshData();
      loadTasks();
      setLastRefreshed(new Date());
    }, 30000);

    // Clean up on component unmount
    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  // Listen for route changes to trigger refresh
  useEffect(() => {
    const handleRouteChange = () => {
      refreshData();
      loadTasks();
      setLastRefreshed(new Date());
    };

    // Add event listener for navigation events
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [refreshData]);

  return (
    <div className="pl-20">
      <div className="flex justify-between items-center mx-10 mt-20 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Typography variant="body2" color="textSecondary">
            An overview of what's happening around
          </Typography>
        </div>

        {/* Refresh button with animation */}
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <IconButton
            onClick={handleRefresh}
            className={`text-blue-500 p-1 rounded-full hover:bg-blue-50 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            disabled={loading || isRefreshing || plannerLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Planner Stats Cards */}
      <Box className="mx-10 mb-6">
        <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
          Study Planner Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} lg={2.4}>
            <Card className="bg-blue-50 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <Typography variant="h5" className="font-bold text-blue-800">
                  {stats.total}
                </Typography>
                <Typography variant="caption" className="text-blue-600 font-medium">
                  Total Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} lg={2.4}>
            <Card className="bg-green-50 border-l-4 border-green-500 hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <Typography variant="h5" className="font-bold text-green-800">
                  {stats.today}
                </Typography>
                <Typography variant="caption" className="text-green-600 font-medium">
                  Today's Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} lg={2.4}>
            <Card className="bg-purple-50 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <Typography variant="h5" className="font-bold text-purple-800">
                  {stats.completed}
                </Typography>
                <Typography variant="caption" className="text-purple-600 font-medium">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} lg={2.4}>
            <Card className="bg-orange-50 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <Typography variant="h5" className="font-bold text-orange-800">
                  {stats.inProgress}
                </Typography>
                <Typography variant="caption" className="text-orange-600 font-medium">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} lg={2.4}>
            <Card className="bg-red-50 border-l-4 border-red-500 hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <Typography variant="h5" className="font-bold text-red-800">
                  {stats.pending}
                </Typography>
                <Typography variant="caption" className="text-red-600 font-medium">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};
