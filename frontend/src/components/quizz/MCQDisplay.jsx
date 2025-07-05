import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Button, 
  Paper,
  CircularProgress
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import { green } from '@mui/material/colors';
import { authServices } from '../../auth';

export const MCQDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAnswerSelect = (event) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: event.target.value
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
  };

  const handleBack = () => {
    navigate('/home/quiz');  // Updated path
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const quizData = {
        file_id: quiz.file_id,
        title: quiz.title,
        type: 'mcq',
        questions: quiz.questions,
        score: score,
        answers: selectedAnswers
      };

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`,
        },
        body: JSON.stringify(quizData)
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz');
      }

      setSaved(true);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!quiz) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No quiz data found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2, color: '#22c55e' }}>
          Back to Quiz Selection
        </Button>
      </Box>
    );
  }

  const currentMCQ = quiz.questions[currentQuestion];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {!showResults ? (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
            {currentMCQ.question}
          </Typography>

          <RadioGroup
            value={selectedAnswers[currentQuestion] || ''}
            onChange={handleAnswerSelect}
          >
            {currentMCQ.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={
                  <Radio 
                    sx={{
                      color: '#22c55e',
                      '&.Mui-checked': {
                        color: '#22c55e',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '1rem' }}>
                    {option}
                  </Typography>
                }
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              sx={{ 
                color: '#22c55e',
                borderColor: '#22c55e',
                '&:hover': {
                  borderColor: '#16a34a',
                  backgroundColor: 'rgba(34, 197, 94, 0.04)',
                }
              }}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion]}
              sx={{
                bgcolor: '#22c55e',
                '&:hover': {
                  bgcolor: '#16a34a',
                },
                '&.Mui-disabled': {
                  bgcolor: '#d1d5db',
                }
              }}
            >
              {currentQuestion < quiz.questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ mb: 4, color: '#1e40af' }}>
            Quiz Results
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Score: {score} out of {quiz.questions.length}
          </Typography>
          
          {quiz.questions.map((q, index) => (
            <Box key={index} sx={{ mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
              <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
                Question {index + 1}: {q.question}
              </Typography>
              <Typography sx={{ 
                color: selectedAnswers[index] === q.correctAnswer ? '#15803d' : '#dc2626',
                mb: 1
              }}>
                Your Answer: {selectedAnswers[index]}
              </Typography>
              <Typography sx={{ color: '#15803d', mb: 1 }}>
                Correct Answer: {q.correctAnswer}
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Explanation: {q.explanation}
              </Typography>
            </Box>
          ))}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              variant="outlined"
              sx={{ color: '#22c55e', borderColor: '#22c55e' }}
            >
              Back to Quiz Selection
            </Button>
            <Button
              variant="contained"
              onClick={!isSaving && !saved ? handleSave : undefined}
              disabled={isSaving || saved}
              startIcon={saved ? <CheckIcon /> : <SaveIcon />}
              sx={{
                bgcolor: saved ? green[600] : '#22c55e',
                '&:hover': {
                  bgcolor: saved ? green[700] : '#16a34a',
                },
                '&.Mui-disabled': {
                  bgcolor: '#d1d5db',
                }
              }}
            >
              {saved ? 'Saved' : isSaving ? 'Saving...' : 'Save Quiz'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};