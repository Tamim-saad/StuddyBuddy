import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem 
} from '@mui/material';
import { authServices } from '../../auth';
import { uploadService } from '../../services';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

export const SavedStickynotes = () => {
  const [notes, setNotes] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      fetchSavedNotes(selectedFileId);
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

  const fetchSavedNotes = async (fileId) => {
    try {
      const accessToken = authServices.getAccessToken();
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/stickynotes/file/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sticky notes');
      }

      const data = await response.json();
      setNotes(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching saved notes:', error);
      setError(error.message);
    }
  };

  return (
    <Box sx={{ p: 10 , mx: 6}}>
      <Typography variant="h4" sx={{ mb: 4, color: 'purple' }}>
        Your Saved Study Notes
      </Typography>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel>Select File</InputLabel>
        <Select
          value={selectedFileId}
          label="Select File"
          onChange={(e) => setSelectedFileId(e.target.value)}
        >
          {files.map((file) => (
            <MenuItem key={file.id} value={file.id}>
              {file.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : notes.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', color: 'gray' }}>
          {selectedFileId ? 'No saved notes found for this file' : 'Please select a file to view notes'}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {notes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  minHeight: '200px',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {console.log(note)}
                <Typography variant="h6">{note.title}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                <VpnKeyIcon />: {note.front}
                </Typography>
                <Typography variant="body2">
                  Explaination: {note.back}
                </Typography>
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">
                    Created: {new Date(note.created_at).toLocaleDateString()}
                  </Typography>
                  {note.importance && (
                    <Typography variant="caption" sx={{ color: 'purple' }}>
                      Importance: {note.importance}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};