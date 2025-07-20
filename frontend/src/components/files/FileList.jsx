import React from "react";
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
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

export const FileList = ({ 
  files, 
  selectedFiles, 
  onSelectFile, 
  onStartIndexing,
  onAnnotate,
  onViewFile,
  onDeleteFile // Add this prop
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedFileId, setSelectedFileId] = React.useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleMenuClick = (event, fileId) => {
    setAnchorEl(event.currentTarget);
    setSelectedFileId(fileId);
  };

  const handleMenuClose = () => {
    // Only clear anchorEl when closing menu
    setAnchorEl(null);
    // Don't clear selectedFileId here
  };

  const handleDeleteClick = () => {
    // Don't clear the menu yet, just open the dialog
    setDeleteDialogOpen(true);
    // Close the menu
    setAnchorEl(null);
  };

  const handleConfirmDelete = () => {
    if (selectedFileId && onDeleteFile) {
      console.log('Deleting file with ID:', selectedFileId);
      onDeleteFile(selectedFileId);
    }
    // Only clear selectedFileId after deletion is confirmed
    setDeleteDialogOpen(false);
    setSelectedFileId(null);
  };

  const handleDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedFileId(null); // Clear ID only when dialog is explicitly closed
  };

  return (
    <>
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
                <TableCell>{file.title}
                </TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>
                  {file.indexing_status === 'pending' ? (
                    <Tooltip title="Start Indexing">
                      <IconButton 
                        onClick={() => onStartIndexing(file.id,file.file_url)}
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
                  {/* {file.type === 'application/pdf' && (
                    <Tooltip title="Annotate PDF">
                      <IconButton 
                        onClick={() => onAnnotate && onAnnotate(file)}
                        size="small"
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )} */}
                  
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
                  <IconButton 
                    size="small"
                    onClick={(event) => handleMenuClick(event, file.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Menu component */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={handleDeleteClick}
          sx={{ 
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light' }
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete File
        </MenuItem>
      </Menu>

      {/* Add Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this file? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDialogClose}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
