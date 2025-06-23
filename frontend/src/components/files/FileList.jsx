import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Checkbox,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export const FileList = ({ 
  files, 
  selectedFiles, 
  onSelectFile, 
  onStartIndexing 
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          {/* ...existing header code... */}
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => onSelectFile(file.id)}
                />
              </TableCell>
              <TableCell>{file.title}</TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>
                {file.indexing_status === 'pending' ? (
                  <Tooltip title="Start Indexing">
                    <IconButton 
                      onClick={() => onStartIndexing(file.id)}
                      size="small"
                    >
                      <PlayArrowIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                ) : file.indexing_status === 'processing' ? (
                  <CircularProgress 
                    size={24} 
                    thickness={5}
                    sx={{ color: 'purple' }}
                  />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
              </TableCell>
              <TableCell>
                {new Date(file.date_uploaded).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <MoreVertIcon />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};