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
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const FileList = ({ 
  files, 
  selectedFiles, 
  onSelectFile, 
  onStartIndexing,
  onAnnotate,
  onViewFile
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox />
            </TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
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
                {/* PDF Annotation Button */}
                {file.type === 'application/pdf' && (
                  <Tooltip title="Annotate PDF">
                    <IconButton 
                      onClick={() => onAnnotate && onAnnotate(file)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* View File Button */}
                <Tooltip title="View File">
                  <IconButton 
                    onClick={() => onViewFile ? onViewFile(file) : window.open(`${process.env.REACT_APP_BASE_URL}/${file.file_path}`, '_blank')}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                
                {/* More Options */}
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};