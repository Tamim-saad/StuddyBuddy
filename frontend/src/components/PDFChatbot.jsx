import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Quiz as QuizIcon,
  StickyNote2 as StickyIcon,
  Summarize as SummaryIcon,
  Minimize as MinimizeIcon
} from '@mui/icons-material';
import { authServices } from '../auth';
import { MCQDisplay } from './quizz/MCQDisplay';
import { StickynotesDisplay } from './stickynotes/StickynotesDisplay';

const PDFChatbot = ({ fileId, filePath, fileName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Modal states
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [stickyDialogOpen, setStickyDialogOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentStickynotes, setCurrentStickynotes] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingSticky, setIsGeneratingSticky] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate PDF summary
  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`,
        },
        body: JSON.stringify({ file_id: fileId })
      });

      if (!response.ok) throw new Error('Failed to generate summary');
      
      const data = await response.json();
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `📄 **PDF Summary:**\n\n${data.summary}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `❌ Failed to generate summary: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Generate MCQ quiz
  const generateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`,
        },
        body: JSON.stringify({ 
          file_id: fileId,
          question_count: 5 // Default count
        })
      });

      if (!response.ok) throw new Error('Failed to generate quiz');
      
      const data = await response.json();
      setCurrentQuiz({
        ...data,
        file_id: fileId,
        title: `Quiz for ${fileName}`
      });
      setQuizDialogOpen(true);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `❌ Failed to generate quiz: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Generate sticky notes
  const generateStickyNotes = async () => {
    setIsGeneratingSticky(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/stickynotes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`,
        },
        body: JSON.stringify({ file_id: fileId })
      });

      if (!response.ok) throw new Error('Failed to generate sticky notes');
      
      const data = await response.json();
      setCurrentStickynotes(data.stickynotes);
      setStickyDialogOpen(true);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `❌ Failed to generate sticky notes: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsGeneratingSticky(false);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`,
        },
        body: JSON.stringify({ 
          file_id: fileId,
          message: inputMessage
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setMessages(prev => [...prev, {
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Chat bubble component
  const ChatBubble = ({ message }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
        mb: 1
      }}
    >
      <Paper
        sx={{
          p: 2,
          maxWidth: '80%',
          bgcolor: message.type === 'user' ? '#1976d2' : '#f5f5f5',
          color: message.type === 'user' ? 'white' : 'black',
          borderRadius: 2,
          whiteSpace: 'pre-line'
        }}
      >
        <Typography variant="body2">{message.content}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        }}
        onClick={() => setIsOpen(true)}
      >
        <ChatIcon />
      </Fab>

      {/* Chatbot Window */}
      {isOpen && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            width: 400,
            height: isMinimized ? 60 : 500,
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 3
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: '#1976d2',
              color: 'white',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6">📚 PDF Assistant</Typography>
            <Box>
              <IconButton
                size="small"
                sx={{ color: 'white', mr: 1 }}
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <MinimizeIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'white' }}
                onClick={() => setIsOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {!isMinimized && (
            <>
              {/* Action Buttons */}
              <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<SummaryIcon />}
                    label="Summarize"
                    onClick={generateSummary}
                    disabled={isGeneratingSummary}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<QuizIcon />}
                    label="Generate Quiz"
                    onClick={generateQuiz}
                    disabled={isGeneratingQuiz}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<StickyIcon />}
                    label="Sticky Notes"
                    onClick={generateStickyNotes}
                    disabled={isGeneratingSticky}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  p: 1,
                  overflowY: 'auto',
                  bgcolor: 'white'
                }}
              >
                {messages.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    👋 Hi! I'm your PDF assistant. Click the buttons above to summarize, generate quizzes, or create sticky notes from your PDF.
                  </Alert>
                )}

                {messages.map((message, index) => (
                  <ChatBubble key={index} message={message} />
                ))}

                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 1, bgcolor: '#f5f5f5', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask about the PDF..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Quiz Dialog */}
      <Dialog
        open={quizDialogOpen}
        onClose={() => setQuizDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Quiz Generated from PDF
            <IconButton onClick={() => setQuizDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 1, overflow: 'auto', height: '70vh' }}>
          {currentQuiz && (
            <MCQDisplay 
              quiz={currentQuiz}
              embedded={true}
              onClose={() => setQuizDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Sticky Notes Dialog */}
      <Dialog
        open={stickyDialogOpen}
        onClose={() => setStickyDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Sticky Notes from PDF
            <IconButton onClick={() => setStickyDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 1, overflow: 'auto', height: '70vh' }}>
          {currentStickynotes && (
            <StickynotesDisplay 
              stickynotes={currentStickynotes}
              fileId={fileId}
              title={`Notes for ${fileName}`}
              embedded={true}
              onClose={() => setStickyDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFChatbot;