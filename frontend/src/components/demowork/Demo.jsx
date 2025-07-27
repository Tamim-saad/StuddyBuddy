import React from 'react'
import { Box, Typography, LinearProgress } from '@mui/material';
import { FileUpload } from '../file/FileUpload';
import { FileList } from '../files/FileList';
export const Demo = () => {
  return (
    <Box sx={{ p: 10, margin: 6 }}>Hello
    <FileUpload sx={{ fontSize: 100, color: 'primary.main' }} />
    
    </Box>
  );
};

