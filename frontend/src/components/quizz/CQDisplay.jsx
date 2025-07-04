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
import Rating from '@mui/material/Rating';
import StarIcon from '@mui/icons-material/Star';
import { getAIScore } from '../../services/aiScoring';

export const CQDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;

  console.log("length of quiz questions:", quiz?.questions.questions?.length);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestion]: event.target.value
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.questions.length - 1) {
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
      for (let i = 0; i < quiz.questions.questions.length; i++) {
        const score = await getAIScore(
          answers[i],
          quiz.questions.questions[i].modelAnswer,
          quiz.questions.questions[i].rubric
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

  useEffect(() => {
    if (showResults) {
      const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
      setTotalScore(total);
    }
  }, [scores, showResults]);

  if (!quiz || !quiz.questions.questions) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No quiz data found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2, color: '#22c55e' }}>
          Back to Quiz Selection
        </Button>
      </Box>
    );
  }

  const currentCQ = quiz.questions.questions[currentQuestion];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {!showResults ? (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Question {currentQuestion + 1} of {quiz.questions.questions.length}
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
              onClick={currentQuestion < quiz.questions.questions.length - 1 ? handleNext : handleEvaluate}
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
              ) : currentQuestion < quiz.questions.questions.length - 1 ? (
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
            Total Score: {totalScore} / {quiz.questions.questions.length * 10}
          </Typography>
          
          {quiz.questions.questions.map((q, index) => (
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

          <Button
            variant="contained"
            onClick={handleBack}
            sx={{
              bgcolor: '#22c55e',
              '&:hover': { bgcolor: '#16a34a' }
            }}
          >
            Back to Quiz Selection
          </Button>
        </Paper>
      )}
    </Box>
  );
};