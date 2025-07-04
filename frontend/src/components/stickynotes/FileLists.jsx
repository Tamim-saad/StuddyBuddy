import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CircularProgress } from "../../common/icons";
import { SearchBar } from '../files/SearchBar';
import { uploadService } from '../../services';
import { useNavigate } from 'react-router-dom';
import { authServices } from '../../auth';
import { FileList } from '../files/FileList';


export const FileLists = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indexingFiles, setIndexingFiles] = useState(new Set());
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await uploadService.getFiles();
      setFiles(Array.isArray(response.files) ? response.files : []);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartIndexing = async (fileId, fileUrl) => {
    try {
      setIndexingFiles(prev => new Set([...prev, fileId]));

      const fileToIndex = files.find(file => file.id === fileId);
      if (!fileToIndex) {
        throw new Error('File not found');
      }

      console.log('Starting indexing for file:', fileId, 'URL:', fileUrl);
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, indexing_status: 'processing' }
            : file
        )
      );

      await uploadService.startIndexing(fileUrl);

      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, indexing_status: 'completed' }
            : file
        )
      );
    } catch (error) {
      console.error('Indexing error:', error);
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, indexing_status: 'failed' }
            : file
        )
      );
    } finally {
      setIndexingFiles(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleSearch = useCallback(async (query) => {
    try {
      setSearchQuery(query);
      if (!query) {
        setSearchResults(null);
        return;
      }
      setLoading(true);
      const results = await uploadService.searchFiles(query);
      setSearchResults(results.files || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredFiles = searchResults || (files?.filter(file => {
    if (!file || !file.title) return false;
    return file.title.toLowerCase().includes(
      (typeof searchQuery === 'string' ? searchQuery : '').toLowerCase()
    );
  }) || []);


  

  const handleGenerateStickynotes = async () => {
    const fileId = selectedFiles[0];
    if (!fileId) return;

    const accessToken = authServices.getAccessToken();
    const fileTitle = files.find(f => f.id === fileId)?.title || 'File';

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/stickynotes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          noteCount: 5
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sticky notes generation failed');
      }

      const data = await response.json();
      console.log('Generated sticky notes:', data);
      navigate('/home/stickynotes', { 
        state: { stickynotes: data.stickynotes ,
           file_id: data.file_id
        } 
      });
    } catch (error) {
      console.error('Sticky notes generation error:', error);
      alert(`Error generating sticky notes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 10, margin: 6 }}>
      {!generatedQuiz ? (
        <>
          <Typography variant="h5" sx={{ mb: 2, color: 'purple' }}>
            Select File for Sticky Notes Generation
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'gray' }}>
            Choose a file to generate study notes from!
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <SearchBar onSearch={handleSearch} />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={40} sx={{ color: 'purple' }} />
            </Box>
          ) : (
            <>
              <FileList
                files={filteredFiles.map(file => ({
                  ...file,
                  fileUrl: file.file_url?.replace(/^uploads\//, '')
                }))}
                selectedFiles={selectedFiles}
                onSelectFile={(id) => {
                  setSelectedFiles(prev =>
                    prev.includes(id)
                      ? prev.filter(fileId => fileId !== id)
                      : [...prev, id]
                  );
                }}
                onStartIndexing={handleStartIndexing}
              />

              {/* Generate Sticky Notes Button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  onClick={handleGenerateStickynotes}
                  disabled={!selectedFiles.length || loading}
                  sx={{
                    bgcolor: '#22c55e',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: '#16a34a',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#d1d5db',
                      color: 'rgba(255,255,255,0.8)'
                    }
                  }}
                >
                  {loading ? 'Generating...' : 'Generate Study Notes'}
                </Button>
              </Box>
            </>
          )}
        </>
      ) : null}
    </Box>
  );
};
