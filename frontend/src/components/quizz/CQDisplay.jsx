import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button, 
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getAIScore } from '../../services/aiScoring';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import { green } from '@mui/material/colors';
import { authServices } from '../../auth';

export const CQDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;

  console.log("Quiz received:", quiz);
  const questions = quiz?.questions || [];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestion]: event.target.value
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } 
  };

  const handleBack = () => {
    navigate('/home/quiz');
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const evaluatedScores = {};
      for (let i = 0; i < questions.length; i++) {
        const score = await getAIScore(
          answers[i],
          questions[i].modelAnswer,
          questions[i].rubric
        );
        evaluatedScores[i] = score;
      }
      setScores(evaluatedScores);
      const total = Object.values(evaluatedScores).reduce((sum, score) => sum + score, 0);
      setTotalScore(total);
      setShowResults(true);
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const quizData = {
        file_id: quiz.file_id,
        title: quiz.title,
        type: 'cq',
        questions: quiz.questions,
        score: totalScore,
        answers: answers,
        aiScores: scores
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

  useEffect(() => {
    if (showResults) {
      const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
      setTotalScore(total);
    }
  }, [scores, showResults]);

  if (!quiz || !questions.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No quiz data found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2, color: '#22c55e' }}>
          Back to Quiz Selection
        </Button>
      </Box>
    );
  }

  const currentCQ = questions[currentQuestion];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {!showResults ? (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
            {currentCQ.question}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            placeholder="Write your answer here..."
            value={answers[currentQuestion] || ''}
            onChange={handleAnswerChange}
            sx={{ mb: 3 }}
          />

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
              onClick={currentQuestion < questions.length - 1 ? handleNext : handleEvaluate}
              disabled={loading}
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
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : currentQuestion < questions.length - 1 ? (
                'Next'
              ) : (
                'Evaluate'
              )}
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ mb: 2, color: '#1e40af' }}>
            Quiz Review
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 4, color: '#22c55e' }}>
            Total Score: {totalScore} / {questions.length * 10}
          </Typography>
          
          {questions.map((q, index) => (
            <Box key={index} sx={{ mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Question {index + 1}: {q.question}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#4b5563', mb: 1 }}>
                  Your Answer:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                  {answers[index] || 'No answer provided'}
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#4b5563', mb: 1 }}>
                  Model Answer:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4' }}>
                  {q.modelAnswer}
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#4b5563', mb: 1 }}>
                  Key Points (Score out of 10):
                </Typography>
                <List>
                  {q.rubric.keyPoints?.map((point, i) => (
                    <ListItem key={i}>
                      <ListItemIcon>
                        <CheckCircleOutlineIcon sx={{ color: '#22c55e' }} />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
                
                
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#4b5563', mb: 1 }}>
                  AI Evaluation Score:
                </Typography>
                <Typography variant="h6" sx={{ color: '#22c55e' }}>
                  {scores[index]}/10
                </Typography>
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handleBack}
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