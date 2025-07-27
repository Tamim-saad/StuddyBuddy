import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import QuizIcon from '@mui/icons-material/Quiz';
import { authServices } from '../../auth';
import { uploadService } from '../../services';
import { QuizResultView } from './QuizResultView';

export const SavedQuiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadFiles();
  }, []);

  // Handle preselected file ID from suggestions
  useEffect(() => {
    if (location.state?.preselectedFileId && files.length > 0) {
      const fileId = location.state.preselectedFileId.toString();
      setSelectedFileId(fileId);
      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, files]);

  useEffect(() => {
    if (selectedFileId) {
      fetchSavedQuizzes(selectedFileId);
    } else {
      setQuizzes([]); // clear quizzes when no file selected
    }
  }, [selectedFileId]);

  const loadFiles = async () => {
    try {
      const response = await uploadService.getFiles();
      setFiles(Array.isArray(response.files) ? response.files : []);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    }
  };

  const fetchSavedQuizzes = async (fileId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/file/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${authServices.getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved quizzes');
      }

      const data = await response.json();
      console.log('Fetched quiz data:', data); // Debug log

      if (!Array.isArray(data)) {
        console.error('Expected array of quizzes, got:', typeof data);
        setQuizzes([]);
        return;
      }

      // Filter out invalid quizzes
      const validQuizzes = data.filter(quiz => quiz && quiz.id && quiz.title && quiz.type);

      console.log('Valid quizzes:', validQuizzes); // Debug log
      setQuizzes(validQuizzes);
      setError(null);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError(error.message);
      setQuizzes([]);
    }
  };

  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const getQuizTypeColor = (type) => {
    return type === 'mcq' ? '#3b82f6' : '#22c55e';
  };

  return (
    <Box sx={{ p: 10, mx: 6 }}>
      {selectedQuiz ? (
        <QuizResultView 
          quiz={selectedQuiz} 
          onBack={() => setSelectedQuiz(null)}
        />
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 4, color: '#1e40af' }}>
            Your Saved Quizzes
          </Typography>

          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Select File</InputLabel>
            <Select
              value={selectedFileId}
              label="Select File"
              onChange={(e) => {
                setSelectedFileId(e.target.value);
                if (error) setError('');
              }}
            >
              {files.map((file) => (
                <MenuItem key={file.id} value={file.id}>
                  {file.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : !selectedFileId ? (
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'gray' }}>
              Please select a file to view quizzes
            </Typography>
          ) : quizzes.length === 0 ? (
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'gray' }}>
              No saved quizzes found for file: {files.find(f => f.id === selectedFileId)?.title}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
              {quizzes.map((quiz) => (
                <Card 
                  key={quiz.id}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    width: '350px',
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleQuizClick(quiz)}
                >
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <QuizIcon sx={{ mr: 1, color: getQuizTypeColor(quiz.type) }} />
                      <Typography variant="h6" sx={{ flexGrow: 1, wordBreak: 'break-word' }}>
                        {quiz.title}
                      </Typography>
                      <Chip 
                        label={quiz.type.toUpperCase()} 
                        size="small"
                        sx={{ 
                          bgcolor: getQuizTypeColor(quiz.type),
                          color: 'white',
                          flexShrink: 0
                        }}
                      />
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Questions: {quiz.question_count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Score: {quiz.score !== undefined && quiz.score !== null ? quiz.score : 'Not attempted'}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" display="block" sx={{ mt: 'auto', pt: 1 }}>
                      Created: {new Date(quiz.created_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
