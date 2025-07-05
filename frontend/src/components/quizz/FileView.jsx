import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CircularProgress } from "../../common/icons";
import { SearchBar } from '../files/SearchBar';
import { FileList } from '../files/FileList';
import { uploadService } from '../../services';
import { useNavigate } from 'react-router-dom';
import { authServices } from '../../auth';
import { MCQDisplay } from './MCQDisplay';
import { CQDisplay } from './CQDisplay';

export const FileView = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleGenerateQuiz = async (type) => {
    const fileId = selectedFiles[0];
    if (!fileId) {
      alert('Please select a file first');
      return;
    }

    const accessToken = authServices.getAccessToken();
    const fileTitle = files.find(f => f.id === fileId)?.title || 'File';

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/generate/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          questionCount: 5,
          title: `${type.toUpperCase()} Quiz for ${fileTitle}`,
          priority: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Quiz generation failed');
      }

      const data = await response.json();
      console.log('Quiz generated:', data);
      
      // Store the quiz data with proper structure
      const quizData = {
        id: data.quiz.id,
        title: data.quiz.title,
        type: data.quiz.type,
        questions: JSON.parse(data.quiz.questions),
        file_id: data.quiz.file_id,
        created_at: data.quiz.created_at
      };
      
      if (type === 'mcq') {
        navigate('/home/quiz/mcq-display', { state: { quiz: quizData } });
      } else if (type === 'cq') {
        navigate('/home/quiz/cq-display', { state: { quiz: quizData } });
      }
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert(`Error generating quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 10, margin: 6 }}>
      {!generatedQuiz ? (
        <>
          <Typography variant="h5" sx={{ mb: 2, color: 'purple' }}>
            Select File for Quiz Generation
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'gray' }}>
            Choose a file to generate questions from!
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

              {/* Buttons for quiz generation */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                <button
                  onClick={() => handleGenerateQuiz('cq')}
                  disabled={!selectedFiles.length || loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedFiles.length ? 'pointer' : 'not-allowed',
                    opacity: selectedFiles.length ? 1 : 0.6,
                    transition: 'all 0.3s'
                  }}
                >
                  {loading ? 'Generating...' : 'Generate CQ'}
                </button>

                <button
                  onClick={() => handleGenerateQuiz('mcq')}
                  disabled={!selectedFiles.length || loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedFiles.length ? 'pointer' : 'not-allowed',
                    opacity: selectedFiles.length ? 1 : 0.6,
                    transition: 'all 0.3s'
                  }}
                >
                  {loading ? 'Generating...' : 'Generate MCQ'}
                </button>
              </Box>
            </>
          )}
        </>
      ) : (
        <>
          <Button 
            onClick={() => setGeneratedQuiz(null)}
            sx={{ mb: 3, color: '#22c55e' }}
          >
            ← Back to File Selection
          </Button>
          <MCQDisplay quiz={generatedQuiz} />
          <CQDisplay quiz={generatedQuiz} />
          
        </>
      )}
    </Box>
  );
};
