import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import FlipIcon from '@mui/icons-material/Flip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import { amber, green, blue } from '@mui/material/colors';
import { authServices } from '../../auth';

export const StickynotesDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flippedCards, setFlippedCards] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  console.log('Location state:', location.state);
  const stickynotes = location.state?.stickynotes || [];
  const fileId = location.state?.file_id;
  const title = location.state?.title || 'Study Notes';
  console.log('Sticky notes id:', fileId);
  console.log('Sticky notes title:', title);

  const handleFlip = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getImportanceColor = (importance) => {
    switch (importance.toLowerCase()) {
      case 'high':
        return amber[700];
      case 'medium':
        return green[500];
      case 'low':
        return blue[400];
      default:
        return green[500];
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log(stickynotes);
      console.log('Sending request body:', {
        file_id: fileId,
        notes: stickynotes.map(note => ({
          front: note.front,
          back: note.back,
          tags: Array.isArray(note.tags) ? note.tags : [],
          importance: note.importance || 'medium'
        })),
        title: title,
      });

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/stickynotes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authServices.getAccessToken()}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          notes: stickynotes.map(note => ({
            front: note.front,
            back: note.back,
            tags: Array.isArray(note.tags) ? note.tags : [],
            importance: note.importance || 'medium'
          })),
          title: title,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notes');
      }

      const data = await response.json();
      console.log('Save response:', data);
      if (data.success) {
        setSaved(true);
      } else {
        throw new Error('Failed to save notes');
      }

    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save sticky notes: ${error.message}`);
      setSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!stickynotes.length) {
    return (
      <Box sx={{ p: 50, textAlign: 'center', mt: 8, ml: 10 }}>
        <Typography variant="h6" color="error" sx={{ mb: 4 }}>
          No sticky notes found
        </Typography>
        <Button
          onClick={() => navigate('/home/file-list')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 4, p: 2 }}
        >
          Back to Files
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 10, mx: 8 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between', // Changed to space between
        mb: 6,
        mt: 2,
        px: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/home/stickynotes')}
            sx={{ mr: 4 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#1e40af' }}>
            {stickynotes[0]?.title || 'Study Notes'}
          </Typography>
        </Box>

        {/* Add Save Button */}

        <Button
          onClick={!isSaving && !saved ? handleSave : undefined}  // Prevents click but not disabled
          variant="contained"
          disableElevation
          startIcon={saved ? <CheckIcon /> : <SaveIcon />}
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: saved ? green[600] : green[500],
            color: 'white',
            cursor: isSaving || saved ? 'not-allowed' : 'pointer',
            '&:hover': {
              bgcolor: saved ? green[700] : green[600]
            },
            opacity: isSaving || saved ? 0.8 : 1  // optional effect
          }}
        >
          {isSaving ? 'Saving...' : saved ? 'Saved' : 'Save Notes'}
        </Button>
      </Box>

      <Grid container spacing={4}>
        {stickynotes.map((note, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.6s',
                transformStyle: 'preserve-3d',
                transform: flippedCards[index] ? 'rotateY(180deg)' : 'none', // Changed from note.id to index
                m: 1,
                p: 1,
                backgroundColor: '#fef3c7'
              }}
            >
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 4,
                backfaceVisibility: 'hidden'
              }}>
                {!flippedCards[index] ? ( // Changed from note.id to index
                  <Box sx={{ backfaceVisibility: 'hidden' }}>
                    <Typography variant="h6" gutterBottom>
                      {note.front}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {note.tags?.map((tag, i) => (
                        <Chip
                          key={i}
                          label={tag}
                          size="small"
                          sx={{
                            mr: 1,
                            mb: 1,
                            bgcolor: blue[50],
                            color: blue[700]
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{
                    transform: 'rotateY(180deg)',
                    height: '100%',
                  
                  }}>
                    <Typography>
                      {note.back}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ p: 3, justifyContent: 'space-between' }}>
                <Chip
                  label={note.importance}
                  size="small"
                  sx={{
                    bgcolor: getImportanceColor(note.importance),
                    color: 'white'
                  }}
                />
                <IconButton
                  onClick={() => handleFlip(index)} // Changed from note.id to index
                  size="small"
                >
                  <FlipIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};