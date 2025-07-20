import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Button,
  Chip 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const QuizResultView = ({ quiz, onBack }) => {
  // Debug logging
  console.log('QuizResultView - quiz data:', quiz);
  console.log('QuizResultView - quiz.questions:', quiz?.questions);
  console.log('QuizResultView - quiz.questions type:', typeof quiz?.questions);
  console.log('QuizResultView - quiz.questions length:', quiz?.questions?.length);

  if (!quiz) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No quiz data available</Typography>
        <Button onClick={onBack}>Go Back</Button>
      </Box>
    );
  }

  const isMCQ = quiz.type === 'mcq';
  // Handle both formats: direct array or nested structure
  const questions = isMCQ ? 
    (quiz.questions || []) : 
    (Array.isArray(quiz.questions) ? quiz.questions : (quiz.questions?.questions || []));
  
  console.log('QuizResultView - questions array:', questions);
  console.log('QuizResultView - questions count:', questions.length);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            onClick={onBack}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" color="primary">
            {quiz.title}
          </Typography>
          <Chip 
            label={quiz.type.toUpperCase()}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        {/* Quiz Info - Only show score for MCQ */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" color="text.secondary">

            Questions: {questions.length}
          </Typography>
          {isMCQ && quiz.score !== undefined && (
            <Typography variant="h6" sx={{ color: 'success.main' }}>
              Score: {quiz.score} / {questions.length}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block">
            Completed: {new Date(quiz.created_at).toLocaleString()}
          </Typography>
        </Box>

        {/* Questions and Answers */}
        {questions.map((question, index) => {
          // Add null check for question object
          if (!question) return null;

          return (
            <Paper 
              key={index} 
              variant="outlined" 
              sx={{ p: 3, mb: 3, bgcolor: '#fafafa' }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Question {index + 1}
              </Typography>
              
              <Typography sx={{ mb: 2 }}>
                {question.question}
              </Typography>

              {isMCQ ? (
                <Box>
                  {/* Add null check for options array */}
                  {Array.isArray(question.options) && (
                    <Box sx={{ mb: 2 }}>
                      {question.options.map((option, optIndex) => (
                        <Typography 
                          key={optIndex}
                          sx={{ 
                            p: 1,
                            ml: 2,
                            color: option === question.correctAnswer ? 'success.main' : 'text.primary',
                            fontWeight: option === question.correctAnswer ? 'medium' : 'normal',
                            borderRadius: 1
                          }}
                        >
                          
                          {option}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                    Answer:
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f0fdf4',
                      border: '1px solid #86efac'
                    }}
                  >
                    {question.modelAnswer || 'No answer available'}
                  </Paper>
                </Box>
              )}
            </Paper>
          );
        })}
      </Paper>
    </Box>
  );
};