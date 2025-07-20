import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { CircularProgress } from "../../common/icons";
import { SearchBar } from '../files/SearchBar';
import { FileList } from '../files/FileList';
import { UploadButton } from './UploadButton';
import { uploadService } from '../../services';
import { useCallback } from 'react';
import PDFAnnotationViewer from '../PDFAnnotationViewer';
import { toast } from '../../lib/toast';

export const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false); // To track if file upload is in progress
  const [indexingFiles, setIndexingFiles] = useState(new Set());
  const [annotatingFile, setAnnotatingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await uploadService.getFiles();

      // No need for simulated progress when loading files
      setFiles(Array.isArray(response.files) ? response.files : []);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setUploadProgress(0);
      setIsUploading(true);

      // Configure simulation parameters
      const simulatedUploadDuration = 8000; // 8 seconds for smoother simulation
      const intervalDuration = 30; // More frequent updates (30ms)
      const initialDelay = 500; // Initial delay before starting
      const completionDelay = 800; // Delay after reaching 100%

      let progress = 0;
      let uploadInterval;

      // Add initial delay for better UX
      await new Promise(resolve => setTimeout(resolve, initialDelay));

      // Start simulated progress with easing
      const startSimulatedProgress = () => {
        uploadInterval = setInterval(() => {
          if (progress < 90) { // Only simulate up to 85%
            // Use easing function for smoother progress
            const remainingProgress = 85 - progress;
            const increment = Math.max(0.1, remainingProgress * 0.05);
            progress += increment;
            setUploadProgress(Math.round(progress));
          }
        }, intervalDuration);
      };

      // Start progress simulation
      startSimulatedProgress();

      // Actual file upload
      const response = await uploadService.uploadFile(file, {
        onUploadProgress: (progressEvent) => {
          const actualProgress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // Smooth transition between simulated and actual progress
          if (actualProgress > progress) {
            progress = actualProgress;
            setUploadProgress(progress);
          }
        }
      });

      // Clear simulation interval
      clearInterval(uploadInterval);

      // Smooth completion animation
      setUploadProgress(95); // Jump to near completion
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(98);
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(100);

      // Show completion state
      await new Promise(resolve => setTimeout(resolve, completionDelay));

      // Update files list with new file
      // if (response?.data) {
      //   setFiles(prevFiles => {
      //     const newFile = response.data;
      //     return Array.isArray(prevFiles) ? [newFile, ...prevFiles] : [newFile];
      //   });
      // }

      await loadFiles(); // Reload files to include the new upload

    } catch (error) {
      console.error('Upload error:', error);
      // Show error state briefly
      setUploadProgress(0);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsUploading(false);
      // Smooth reset
      setUploadProgress(prev => {
        if (prev === 100) {
          return 0;
        }
        return prev;
      });
    }
  };


  const handleStartIndexing = async (fileId,fileUrl) => {
    try {
      setIndexingFiles(prev => new Set([...prev, fileId]));
      
      // Find the file with the given ID
      const fileToIndex = files.find(file => file.id === fileId);
      if (!fileToIndex) {
        throw new Error('File not found');
      }

      // Remove 'uploads/' prefix from file_url if it exists
      // const fileUrl = fileToIndex.file_url.replace(/^\/uploads\/|^uploads\//, '');
      console.log('Starting indexing for file:', fileId, 'URL:', fileUrl);
      // Update file status locally
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, indexing_status: 'processing' }
            : file
        )
      );

      // Start actual indexing with formatted URL
      await uploadService.startIndexing(fileUrl);

      // Update file status after completion
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, indexing_status: 'completed' }
            : file
        )
      );
    } catch (error) {
      console.error('Indexing error:', error);
      // Update file status to failed on error
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
      // Call the search API
      const results = await uploadService.searchFiles(query);
      setSearchResults(results.files || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    }
    finally {
      setLoading(false);
    }
  }, []);


  const handleAnnotatorClose = () => {
    setAnnotatingFile(null);
    // Refresh file list when annotation viewer closes
    loadFiles();
  };

  const handleViewerClose = () => {
    setViewingFile(null);
  };

  const handleViewFile = (file) => {
    // If it's a PDF, use the PDFViewer component
    if (file.type === 'application/pdf') {
      setViewingFile(file);
    } else {
      // For other file types, open in new tab
      window.open(`${process.env.REACT_APP_BASE_URL}/${file.file_url}`, '_blank');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await uploadService.deleteFile(fileId);
      // Remove the file from the local state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // If annotating, show the annotation viewer instead of PDFAnnotator
  if (annotatingFile) {
    return (
      <PDFAnnotationViewer
        fileId={annotatingFile.id}
        filePath={annotatingFile.file_url}
        fileName={annotatingFile.title}
        onClose={handleAnnotatorClose}
      />
    );
  }

  // If viewing a PDF, show the annotation viewer instead of PDF viewer
  if (viewingFile) {
    return (
      <PDFAnnotationViewer
        fileId={viewingFile.id}
        filePath={viewingFile.file_url}
        fileName={viewingFile.title}
        onClose={handleViewerClose}
      />
    );
  }
  
  const filteredFiles = searchResults || (files?.filter(file => {
    if (!file || !file.title) return false;
    return file.title.toLowerCase().includes(
      (typeof searchQuery === 'string' ? searchQuery : '').toLowerCase()
    );
  }) || []);

  return (
    <Box sx={{ p: 10, margin: 6 }}>
      <Typography variant="h5" sx={{ mb: 2, color: 'purple' }}>
        Uploads
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'gray' }}>
        Manage all your uploads here!
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <UploadButton onUpload={handleFileUpload} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SearchBar onSearch={handleSearch} />
        </Box>
      </Box>

      {/* Display upload progress bar only when uploading */}
      {isUploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{
              height: 8,
              borderRadius: 5,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing
              backgroundColor: 'rgba(128, 0, 128, 0.1)', // Light purple background
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'purple',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Match transition
              }
            }}
          />
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 1 }}
          >
            {`${Math.round(uploadProgress)}%`}
          </Typography>
        </Box>
      )}

      {/* Display loading spinner or file list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={40} sx={{ color: 'purple' }} />
        </Box>
      ) : (
        <FileList
          files={filteredFiles.map(file => ({
            ...file,
            fileUrl: file.file_url?.replace(/^uploads\//, '') // Remove 'uploads/' prefix
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
          onViewFile={handleViewFile}
          onDeleteFile={handleDeleteFile}
        />
      )}
    </Box>
  );
};
