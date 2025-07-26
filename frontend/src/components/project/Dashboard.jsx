import React, { useState, useEffect } from "react";
import { Typography, IconButton, Box } from "../../common/icons";
import { useMembers } from "../../context/MembersContext";
import { plannerService, quizService, stickyNotesService } from "../../services";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

// ✅ Register Chart.js components + plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

export const Dashboard = () => {
  const { refreshData, loading } = useMembers();

  const [tasks, setTasks] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(true);

  const [quizStats, setQuizStats] = useState({
    total: 0,
    mcq: 0,
    cq: 0,
    mcqAverageScore: 0,
    cqAverageScore: 0,
    overallAverageScore: 0,
    completed: 0,
    mcqCompleted: 0,
    cqCompleted: 0,
  });
  const [quizLoading, setQuizLoading] = useState(true);

  const [stickyNotesStats, setStickyNotesStats] = useState({
    total: 0,
    highImportance: 0,
    mediumImportance: 0,
    lowImportance: 0,
    uniqueFiles: 0,
    averageNotesPerFile: 0,
  });
  const [stickyNotesLoading, setStickyNotesLoading] = useState(true);

  const [individualQuizzes, setIndividualQuizzes] = useState([]);
  const [individualQuizzesLoading, setIndividualQuizzesLoading] = useState(true);

  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatLocalDate = (date) =>
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");

  const loadTasks = async () => {
    try {
      setPlannerLoading(true);
      const response = await plannerService.getTasks({});
      setTasks(response.tasks || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setPlannerLoading(false);
    }
  };

  const loadQuizStats = async () => {
    try {
      setQuizLoading(true);
      const stats = await quizService.getQuizStats();
      setQuizStats(stats);
    } catch (error) {
      console.error("Error loading quiz stats:", error);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadStickyNotesStats = async () => {
    try {
      setStickyNotesLoading(true);
      const stats = await stickyNotesService.getStickyNotesStats();
      setStickyNotesStats(stats);
    } catch (error) {
      console.error("Error loading sticky notes stats:", error);
    } finally {
      setStickyNotesLoading(false);
    }
  };

  const loadIndividualQuizzes = async () => {
    try {
      setIndividualQuizzesLoading(true);
      const response = await quizService.getSavedQuizzes();
      const quizzes = response.data?.quizzes || [];
      const scoredQuizzes = quizzes.filter(
        (q) => q.score !== null && q.score !== undefined
      );
      setIndividualQuizzes(scoredQuizzes);
    } catch (error) {
      console.error("Error loading individual quizzes:", error);
      setIndividualQuizzes([]);
    } finally {
      setIndividualQuizzesLoading(false);
    }
  };

  const getTaskStats = () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const todayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.start_time);
      const taskDateStr = formatLocalDate(taskDate);
      return taskDateStr === todayStr;
    });

    return {
      total: tasks.length,
      today: todayTasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
    };
  };

  const stats = getTaskStats();

  /** ✅ Gradient background for bars **/
  const createGradient = (ctx, color1, color2) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  };

  /** ✅ Cleaner bar chart options **/
  const nicerBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        cornerRadius: 6,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 12 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 } },
      },
    },
    elements: {
      bar: { 
        borderRadius: 3,
        borderSkipped: false,
        barPercentage: 0.4,
        categoryPercentage: 0.8,
      },
    },
    animation: {
      duration: 700,
      easing: "easeOutCubic",
    },
  };

  /** ✅ Chart Data **/
  const plannerChartData = {
    labels: ["Total Tasks", "Today's Tasks", "Completed", "In Progress", "Pending"],
    datasets: [
      {
        label: "Task Count",
        data: [stats.total, stats.today, stats.completed, stats.inProgress, stats.pending],
        backgroundColor: (ctx) =>
          createGradient(ctx.chart.ctx, "rgba(59, 130, 246, 0.9)", "rgba(147, 197, 253, 0.7)"),
        borderWidth: 1.3,
      },
    ],
  };

  const quizCompletedChartData = {
    labels: ["Completed Quizzes", "MCQ Completed", "CQ Completed"],
    datasets: [
      {
        label: "Completed Quizzes",
        data: [quizStats.completed, quizStats.mcqCompleted, quizStats.cqCompleted],
        backgroundColor: (ctx) =>
          createGradient(ctx.chart.ctx, "rgba(6, 182, 212, 0.9)", "rgba(34, 211, 238, 0.6)"),
        borderWidth: 1.3,
      },
    ],
  };

  const quizScoreChartData = {
    labels: ["MCQ Avg Score", "CQ Avg Score"],
    datasets: [
      {
        label: "Average Scores",
        data: [quizStats.mcqAverageScore, quizStats.cqAverageScore],
        backgroundColor: (ctx) =>
          createGradient(ctx.chart.ctx, "rgba(245, 158, 11, 0.9)", "rgba(252, 211, 77, 0.7)"),
        borderWidth: 1.3,
      },
    ],
  };

  const stickyNotesChartData = {
    labels: ["Total Notes", "High Priority", "Medium Priority", "Low Priority", "Files with Notes"],
    datasets: [
      {
        label: "Sticky Notes Stats",
        data: [
          stickyNotesStats.total,
          stickyNotesStats.highImportance,
          stickyNotesStats.mediumImportance,
          stickyNotesStats.lowImportance,
          stickyNotesStats.uniqueFiles,
        ],
        backgroundColor: (ctx) =>
          createGradient(ctx.chart.ctx, "rgba(139, 92, 246, 0.9)", "rgba(196, 181, 253, 0.7)"),
        borderWidth: 1.3,
      },
    ],
  };

  const individualQuizChartData = {
    labels: individualQuizzes.map(
      (q) => q.title?.substring(0, 20) + (q.title?.length > 20 ? "..." : "")
    ),
    datasets: [
      {
        label: "Quiz Scores",
        data: individualQuizzes.map((q) => q.score),
        backgroundColor: (ctx) =>
          createGradient(ctx.chart.ctx, "rgba(59, 130, 246, 0.9)", "rgba(34, 197, 94, 0.6)"),
        borderWidth: 1.3,
      },
    ],
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      refreshData(),
      loadTasks(),
      loadQuizStats(),
      loadStickyNotesStats(),
      loadIndividualQuizzes(),
    ]).then(() => {
      setLastRefreshed(new Date());
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  useEffect(() => {
    refreshData();
    loadTasks();
    loadQuizStats();
    loadStickyNotesStats();
    loadIndividualQuizzes();
    setLastRefreshed(new Date());

    const refreshInterval = setInterval(() => {
      refreshData();
      loadTasks();
      loadQuizStats();
      loadStickyNotesStats();
      loadIndividualQuizzes();
      setLastRefreshed(new Date());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: "1600px" }}>
        <div className="pl-20">
          {/* HEADER */}
          <div className="flex justify-between items-center mx-10 mt-20 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📊 Dashboard</h1>
              <Typography variant="body2" color="textSecondary">
                An overview of your study progress
              </Typography>
            </div>

            {/* Refresh button */}
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </span>
              <IconButton
                onClick={handleRefresh}
                className={`text-blue-500 p-1 rounded-full hover:bg-blue-50 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                disabled={
                  loading ||
                  isRefreshing ||
                  plannerLoading ||
                  quizLoading ||
                  stickyNotesLoading ||
                  individualQuizzesLoading
                }
              >
                🔄
              </IconButton>
            </div>
          </div>

          {/* ✅ PLANNER SECTION */}
          <div className="mx-10 mb-10 rounded-xl p-6" style={{ backgroundColor: "#E0F2FE" }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">📅 Study Planner Overview</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Planner Overview - Card Format */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "550px" }}>
                <Typography className="text-gray-700 font-medium mb-4 text-center">
                  Task Statistics Overview
                </Typography>
                <div className="space-y-4">
                  {/* Total Tasks */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Total Tasks</div>
                        <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
                      </div>
                      <div className="text-3xl">📋</div>
                    </div>
                  </div>
                  
                  {/* Today's Tasks */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-green-600 font-medium">Today's Tasks</div>
                        <div className="text-2xl font-bold text-green-800">{stats.today}</div>
                      </div>
                      <div className="text-3xl">📅</div>
                    </div>
                  </div>
                  
                  {/* Completed Tasks */}
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-emerald-600 font-medium">Completed</div>
                        <div className="text-2xl font-bold text-emerald-800">{stats.completed}</div>
                      </div>
                      <div className="text-3xl">✅</div>
                    </div>
                  </div>
                  
                  {/* In Progress Tasks */}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-orange-600 font-medium">In Progress</div>
                        <div className="text-2xl font-bold text-orange-800">{stats.inProgress}</div>
                      </div>
                      <div className="text-3xl">🔄</div>
                    </div>
                  </div>
                  
                  {/* Pending Tasks */}
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-red-600 font-medium">Pending</div>
                        <div className="text-2xl font-bold text-red-800">{stats.pending}</div>
                      </div>
                      <div className="text-3xl">⏳</div>
                    </div>
                  </div>
                  
                  {/* Progress Summary */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 text-center">
                      {stats.total > 0 ? (
                        <span>
                          {Math.round((stats.completed / stats.total) * 100)}% of tasks completed
                        </span>
                      ) : (
                        <span>No tasks available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminders Section */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "550px", overflowY: "auto" }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">⏰ Task Reminders</h3>
                {plannerLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading reminders...</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const incompleteTasks = tasks.filter(task => task.status !== 'completed');
                      
                      // Filter tasks that are due within the next 7 days
                      const now = new Date();
                      const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
                      
                      const upcomingTasks = incompleteTasks.filter(task => {
                        const deadline = task.end_time || task.start_time;
                        const deadlineDate = new Date(deadline);
                        return deadlineDate <= oneWeekFromNow;
                      });
                      
                      const sortedTasks = upcomingTasks.sort((a, b) => {
                        const aDeadline = a.end_time || a.start_time;
                        const bDeadline = b.end_time || b.start_time;
                        return new Date(aDeadline) - new Date(bDeadline);
                      });

                      if (sortedTasks.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            <div className="text-2xl mb-2">📅</div>
                            <div>No upcoming tasks due within 7 days</div>
                          </div>
                        );
                      }

                      return sortedTasks.slice(0, 8).map((task) => {
                        const deadline = task.end_time || task.start_time;
                        const deadlineDate = new Date(deadline);
                        const now = new Date();
                        const timeDiff = deadlineDate - now;
                        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        
                        let urgencyColor = 'text-gray-600';
                        let urgencyText = '';
                        
                        if (timeDiff < 0) {
                          urgencyColor = 'text-red-600';
                          urgencyText = 'Overdue';
                        } else if (daysLeft <= 1) {
                          urgencyColor = 'text-red-500';
                          urgencyText = 'Due today';
                        } else if (daysLeft <= 3) {
                          urgencyColor = 'text-orange-500';
                          urgencyText = `Due in ${daysLeft} days`;
                        } else if (daysLeft <= 7) {
                          urgencyColor = 'text-yellow-600';
                          urgencyText = `Due in ${daysLeft} days`;
                        } else {
                          urgencyColor = 'text-green-600';
                          urgencyText = `Due in ${daysLeft} days`;
                        }

                        const priorityColors = {
                          high: 'bg-red-100 text-red-800 border-red-200',
                          medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          low: 'bg-green-100 text-green-800 border-green-200'
                        };

                        return (
                          <div key={task.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-800 line-clamp-2 flex-1 mr-2">
                                {task.title}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority] || priorityColors.medium}`}>
                                {task.priority}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                              <span className={`font-medium ${urgencyColor}`}>
                                {urgencyText}
                              </span>
                              <span className="text-gray-500">
                                {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {task.status === 'in_progress' && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  In Progress
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ QUIZ SECTION */}
          <div className="mx-10 mb-10 rounded-xl p-6" style={{ backgroundColor: "#FEF9C3" }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">📝 Quiz Performance Overview</h2>

            {/* All Quiz Charts Side by Side */}
            <div className="grid grid-cols-3 gap-6">
              {/* Quiz Completion - Card Format */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "350px" }}>
                <Typography className="text-gray-700 font-medium mb-4 text-center">
                  Quiz Completion Overview
                </Typography>
                <div className="space-y-4">
                  {/* Total Quizzes */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Total Quizzes</div>
                        <div className="text-2xl font-bold text-blue-800">{quizStats.completed}</div>
                      </div>
                      <div className="text-3xl">📊</div>
                    </div>
                  </div>
                  
                  {/* MCQ Completed */}
                  <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 rounded-lg border border-cyan-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-cyan-600 font-medium">MCQ</div>
                        <div className="text-2xl font-bold text-cyan-800">{quizStats.mcqCompleted}</div>
                      </div>
                      <div className="text-3xl">✅</div>
                    </div>
                  </div>
                  
                  {/* CQ Completed */}
                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-teal-600 font-medium">CQ </div>
                        <div className="text-2xl font-bold text-teal-800">{quizStats.cqCompleted}</div>
                      </div>
                      <div className="text-3xl">✍️</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Quiz Scores */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "350px" }}>
                <Typography className="text-gray-700 font-medium mb-2">
                  Individual Quiz Scores
                </Typography>
                {individualQuizzes.length > 0 ? (
                  <Bar data={individualQuizChartData} options={nicerBarOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No quiz scores available
                  </div>
                )}
              </div>

              {/* Quiz Average Scores */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "350px" }}>
                <Typography className="text-gray-700 font-medium mb-2">
                  Quiz Average Scores
                </Typography>
                <Bar data={quizScoreChartData} options={nicerBarOptions} />
              </div>
            </div>
          </div>

          {/* ✅ STICKY NOTES SECTION */}
          <div className="mx-10 mb-10 rounded-xl p-6" style={{ backgroundColor: "#F3E8FF" }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">🗒️ Study Notes Overview</h2>
            <div className="grid grid-cols-3 gap-6">
              {/* Total Notes */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "350px" }}>
                <Typography className="text-gray-700 font-medium mb-4 text-center">
                  Total Notes
                </Typography>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-600 font-medium">All Notes</div>
                      <div className="text-2xl font-bold text-purple-800">{stickyNotesStats.total}</div>
                    </div>
                    <div className="text-3xl">📝</div>
                  </div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "350px" }}>
                <Typography className="text-gray-700 font-medium mb-4 text-center">
                  Priority Breakdown
                </Typography>
                <div className="space-y-3">
                  {/* High Priority */}
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-red-600 font-medium">High Priority</div>
                        <div className="text-xl font-bold text-red-800">{stickyNotesStats.highImportance}</div>
                      </div>
                      <div className="text-2xl">🔴</div>
                    </div>
                  </div>
                  
                  {/* Medium Priority */}
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-yellow-600 font-medium">Medium Priority</div>
                        <div className="text-xl font-bold text-yellow-800">{stickyNotesStats.mediumImportance}</div>
                      </div>
                      <div className="text-2xl">🟡</div>
                    </div>
                  </div>
                  
                  {/* Low Priority */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-green-600 font-medium">Low Priority</div>
                        <div className="text-xl font-bold text-green-800">{stickyNotesStats.lowImportance}</div>
                      </div>
                      <div className="text-2xl">🟢</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files Overview */}
              <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: "350px" }}>
                <Typography className="text-gray-700 font-medium mb-4 text-center">
                  Files Overview
                </Typography>
                <div className="space-y-4">
                  {/* Files with Notes */}
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-indigo-600 font-medium">Files with Notes</div>
                        <div className="text-2xl font-bold text-indigo-800">{stickyNotesStats.uniqueFiles}</div>
                      </div>
                      <div className="text-3xl">📁</div>
                    </div>
                  </div>
                  
                  {/* Average Notes per File */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Avg Notes/File</div>
                        <div className="text-2xl font-bold text-blue-800">
                          {stickyNotesStats.uniqueFiles > 0 
                            ? Math.round(stickyNotesStats.averageNotesPerFile * 10) / 10 
                            : 0}
                        </div>
                      </div>
                      <div className="text-3xl">📊</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Box>
  );
};
