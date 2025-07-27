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
  Button,
  TextField
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useState } from "react";

export const FileList = ({
  files,
  selectedFiles,
  onSelectFile,
  onStartIndexing,
  onAnnotate,
  onViewFile,
  onDeleteFile,// Add this prop
  onDownloadFile,
  onUpdateFile
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedFileId, setSelectedFileId] = React.useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  console.log("Files:", files);
  const [formData, setFormData] = React.useState({
    title: ''
  });
  const [errors, setErrors] = useState({});

  const handleMenuClick = (event, fileId) => {
    console.log("Event", event);
    setAnchorEl(event.currentTarget);
    setSelectedFileId(fileId);
    console.log("Anchor Element:", event.currentTarget);
  };
  const handleDownloadClick = () => {
    console.log('Downloading file with ID:', selectedFileId);
    // const result= files.find(file => file.id === selectedFileId);
    // if (result) {
    //   console.log('File found:', result);
    // }
    onDownloadFile(selectedFileId);

  };
  const handleFileUpdate = () => {
    setRenameDialogOpen(true);
    console.log('Updating file with ID:', selectedFileId);
  }

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
  const handleConfirmRename = () => {
    if (selectedFileId && onUpdateFile) {
      console.log('Renaming file with ID:', selectedFileId);
      console.log('Form Data:', formData);
      const fileExtension = formData.title.split('.').pop().toLowerCase();
      console.log('File Extension:', fileExtension);

      files.forEach(file => {
        if (file.id === selectedFileId) {
          if (file.type === 'application/pdf' && fileExtension === 'pdf') {
            console.log('Valid PDF file');
            onUpdateFile(selectedFileId,formData);
          }
        }
      });

    }

  }
  const handleInputChange = (field, value) => {
    console.log("Value:", value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));

    }
  }

  const handleDialogClose = () => {
    setRenameDialogOpen(false);
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
                        onClick={() => onStartIndexing(file.id, file.file_url)}
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
        {/* <MenuItem
          onClick={handleDownloadClick}
          sx={{
            color: 'info.main',
            '&:hover': { bgcolor: 'info.light' }
          }}
        >
          <DownloadIcon sx={{ mr: 1 }} />
          Download File
        </MenuItem>
        <MenuItem
          onClick={handleFileUpdate}
          sx={{
            color: 'info.main',
            '&:hover': { bgcolor: 'info.light' }
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Rename File
        </MenuItem> */}
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
      <Dialog
        open={renameDialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle>Confirm Rename</DialogTitle>
        <DialogContent>
          Are you sure you want to Rename this file?
        </DialogContent>
        <TextField
          fullWidth
          label="File Title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          required
        />
        <DialogActions>
          <Button
            onClick={handleDialogClose}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRename}
            color="error"
            variant="contained"
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// import React from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Checkbox,
//   Paper,
//   CircularProgress,
//   IconButton,
//   Tooltip,
//   Menu,
//   MenuItem,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   Box,
//   FormControl,
//   InputLabel,
//   Select,
//   Chip,
//   Stack,
//   Typography,
//   Collapse,
//   Card,
//   CardContent,
//   Grid,
//   OutlinedInput
// } from '@mui/material';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import PlayArrowIcon from '@mui/icons-material/PlayArrow';
// import MoreVertIcon from '@mui/icons-material/MoreVert';
// import EditIcon from '@mui/icons-material/Edit';
// import VisibilityIcon from '@mui/icons-material/Visibility';
// import DeleteIcon from '@mui/icons-material/Delete';
// import DownloadIcon from '@mui/icons-material/Download';
// import FilterListIcon from '@mui/icons-material/FilterList';
// import SearchIcon from '@mui/icons-material/Search';
// import SortIcon from '@mui/icons-material/Sort';
// import ClearAllIcon from '@mui/icons-material/ClearAll';
// import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
// import ImageIcon from '@mui/icons-material/Image';
// import ArticleIcon from '@mui/icons-material/Article';
// import { useState, useEffect } from "react";

// export const FileList = ({
//   files,
//   selectedFiles,
//   onSelectFile,
//   onStartIndexing,
//   onAnnotate,
//   onViewFile,
//   onDeleteFile,
//   onDownloadFile,
//   onUpdateFile
// }) => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [selectedFileId, setSelectedFileId] = useState(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [renameDialogOpen, setRenameDialogOpen] = useState(false);
//   const [formData, setFormData] = useState({ title: '' });
//   const [errors, setErrors] = useState({});
  
//   // Filter state
//   const [showFilters, setShowFilters] = useState(false);
//   const [filters, setFilters] = useState({
//     type: [],
//     status: '',
//     date: '',
//     search: ''
//   });
  
//   // Sorting state
//   const [sortConfig, setSortConfig] = useState({
//     key: 'date_uploaded',
//     direction: 'desc'
//   });
  
//   // Get unique file types from the files array
//   const fileTypes = [...new Set(files.map(file => file.type))];
  
//   // Apply filters and sorting
//   const filteredFiles = files.filter(file => {
//     // Type filter
//     if (filters.type.length > 0 && !filters.type.includes(file.type)) {
//       return false;
//     }
    
//     // Status filter
//     if (filters.status && file.indexing_status !== filters.status) {
//       return false;
//     }
    
//     // Date filter
//     if (filters.date) {
//       const fileDate = new Date(file.date_uploaded).toLocaleDateString();
      
//       if (filters.date === 'today') {
//         const today = new Date().toLocaleDateString();
//         if (fileDate !== today) return false;
//       } else if (filters.date === 'this-week') {
//         const fileTime = new Date(file.date_uploaded).getTime();
//         const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
//         if (fileTime < weekAgo) return false;
//       } else if (filters.date === 'this-month') {
//         const fileTime = new Date(file.date_uploaded).getTime();
//         const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
//         if (fileTime < monthAgo) return false;
//       }
//     }
    
//     // Search filter
//     if (filters.search) {
//       const searchLower = filters.search.toLowerCase();
//       return file.title.toLowerCase().includes(searchLower);
//     }
    
//     return true;
//   }).sort((a, b) => {
//     // Apply sorting
//     if (a[sortConfig.key] < b[sortConfig.key]) {
//       return sortConfig.direction === 'asc' ? -1 : 1;
//     }
//     if (a[sortConfig.key] > b[sortConfig.key]) {
//       return sortConfig.direction === 'asc' ? 1 : -1;
//     }
//     return 0;
//   });
  
//   // Handle sorting
//   const handleSort = (key) => {
//     const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
//     setSortConfig({ key, direction });
//   };
  
//   // Reset filters
//   const resetFilters = () => {
//     setFilters({
//       type: [],
//       status: '',
//       date: '',
//       search: ''
//     });
//   };
  
//   // Handle filter changes
//   const handleFilterChange = (filterType, value) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterType]: value
//     }));
//   };
  
//   // Handle file type filter
//   const handleTypeFilterChange = (event) => {
//     const { value } = event.target;
//     setFilters(prev => ({
//       ...prev,
//       type: typeof value === 'string' ? value.split(',') : value
//     }));
//   };

//   useEffect(() => {
//     // When a file is selected for rename, set its current title in the form
//     if (selectedFileId && renameDialogOpen) {
//       const selectedFile = files.find(file => file.id === selectedFileId);
//       if (selectedFile) {
//         setFormData({ title: selectedFile.title });
//       }
//     }
//   }, [selectedFileId, renameDialogOpen, files]);

//   const handleMenuClick = (event, fileId) => {
//     setAnchorEl(event.currentTarget);
//     setSelectedFileId(fileId);
//   };
  
//   const handleDownloadClick = () => {
//     onDownloadFile(selectedFileId);
//     setAnchorEl(null);
//   };
  
//   const handleFileUpdate = () => {
//     setRenameDialogOpen(true);
//     setAnchorEl(null);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleDeleteClick = () => {
//     setDeleteDialogOpen(true);
//     setAnchorEl(null);
//   };

//   const handleConfirmDelete = () => {
//     if (selectedFileId && onDeleteFile) {
//       onDeleteFile(selectedFileId);
//     }
//     setDeleteDialogOpen(false);
//     setSelectedFileId(null);
//   };
  
//   const handleConfirmRename = () => {
//     if (selectedFileId && onUpdateFile) {
//       // Optional validation if needed
//       onUpdateFile(selectedFileId, formData);
//     }
//     setRenameDialogOpen(false);
//   };
  
//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));

//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({
//         ...prev,
//         [field]: null
//       }));
//     }
//   };

//   const handleDialogClose = () => {
//     setRenameDialogOpen(false);
//     setDeleteDialogOpen(false);
//   };
  
//   // Get file icon based on type
//   const getFileIcon = (fileType) => {
//     if (fileType === 'application/pdf') {
//       return <PictureAsPdfIcon color="error" />;
//     } else if (fileType.startsWith('image/')) {
//       return <ImageIcon color="primary" />;
//     } else {
//       return <ArticleIcon color="action" />;
//     }
//   };

//   return (
//     <>
//       {/* Search and Filter Controls */}
//       <Box sx={{ mb: 3 }}>
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={6}>
//             <TextField
//               fullWidth
//               placeholder="Search files by name..."
//               variant="outlined"
//               size="small"
//               value={filters.search}
//               onChange={(e) => handleFilterChange('search', e.target.value)}
//               InputProps={{
//                 startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
//               }}
//             />
//           </Grid>
//           <Grid item xs={6} md={3}>
//             <Button 
//               variant={showFilters ? "contained" : "outlined"}
//               startIcon={<FilterListIcon />}
//               onClick={() => setShowFilters(!showFilters)}
//               fullWidth
//               color="primary"
//             >
//               Filters
//             </Button>
//           </Grid>
//           <Grid item xs={6} md={3}>
//             <Button 
//               variant="outlined" 
//               startIcon={<ClearAllIcon />}
//               onClick={resetFilters}
//               fullWidth
//               disabled={!Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))}
//             >
//               Clear Filters
//             </Button>
//           </Grid>
//         </Grid>

//         {/* Collapsible Filter Panel */}
//         <Collapse in={showFilters}>
//           <Card sx={{ mt: 2, p: 1, bgcolor: 'background.default' }}>
//             <CardContent>
//               <Typography variant="subtitle2" gutterBottom>
//                 Filter Options
//               </Typography>
              
//               <Grid container spacing={2}>
//                 {/* File Type Filter */}
//                 <Grid item xs={12} md={4}>
//                   <FormControl fullWidth size="small">
//                     <InputLabel id="type-filter-label">File Type</InputLabel>
//                     <Select
//                       labelId="type-filter-label"
//                       id="type-filter"
//                       multiple
//                       value={filters.type}
//                       onChange={handleTypeFilterChange}
//                       input={<OutlinedInput label="File Type" />}
//                       renderValue={(selected) => (
//                         <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                           {selected.map((value) => (
//                             <Chip key={value} label={value.split('/')[1] || value} size="small" />
//                           ))}
//                         </Box>
//                       )}
//                     >
//                       {fileTypes.map((type) => (
//                         <MenuItem key={type} value={type}>
//                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                             {getFileIcon(type)}
//                             <Typography variant="body2" sx={{ ml: 1 }}>
//                               {type.split('/')[1] || type}
//                             </Typography>
//                           </Box>
//                         </MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 </Grid>
                
//                 {/* Status Filter */}
//                 <Grid item xs={12} md={4}>
//                   <FormControl fullWidth size="small">
//                     <InputLabel id="status-filter-label">Status</InputLabel>
//                     <Select
//                       labelId="status-filter-label"
//                       id="status-filter"
//                       value={filters.status}
//                       onChange={(e) => handleFilterChange('status', e.target.value)}
//                       label="Status"
//                     >
//                       <MenuItem value="">Any Status</MenuItem>
//                       <MenuItem value="completed">Completed</MenuItem>
//                       <MenuItem value="pending">Pending</MenuItem>
//                       <MenuItem value="processing">Processing</MenuItem>
//                     </Select>
//                   </FormControl>
//                 </Grid>
                
//                 {/* Date Filter */}
//                 <Grid item xs={12} md={4}>
//                   <FormControl fullWidth size="small">
//                     <InputLabel id="date-filter-label">Upload Date</InputLabel>
//                     <Select
//                       labelId="date-filter-label"
//                       id="date-filter"
//                       value={filters.date}
//                       onChange={(e) => handleFilterChange('date', e.target.value)}
//                       label="Upload Date"
//                     >
//                       <MenuItem value="">Any Time</MenuItem>
//                       <MenuItem value="today">Today</MenuItem>
//                       <MenuItem value="this-week">This Week</MenuItem>
//                       <MenuItem value="this-month">This Month</MenuItem>
//                     </Select>
//                   </FormControl>
//                 </Grid>
//               </Grid>
              
//               {/* Sort Options */}
//               <Box sx={{ mt: 2 }}>
//                 <Typography variant="subtitle2" gutterBottom>
//                   Sort By
//                 </Typography>
//                 <Stack direction="row" spacing={1}>
//                   <Button 
//                     size="small" 
//                     variant={sortConfig.key === 'title' ? "contained" : "outlined"}
//                     onClick={() => handleSort('title')}
//                     startIcon={<SortIcon />}
//                   >
//                     Name {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
//                   </Button>
//                   <Button 
//                     size="small" 
//                     variant={sortConfig.key === 'date_uploaded' ? "contained" : "outlined"}
//                     onClick={() => handleSort('date_uploaded')}
//                     startIcon={<SortIcon />}
//                   >
//                     Date {sortConfig.key === 'date_uploaded' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
//                   </Button>
//                 </Stack>
//               </Box>
//             </CardContent>
//           </Card>
//         </Collapse>
        
//         {/* Applied Filters Display */}
//         {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== '')) && (
//           <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//             <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
//               Active filters:
//             </Typography>
            
//             {filters.type.length > 0 && filters.type.map(type => (
//               <Chip 
//                 key={`type-${type}`}
//                 label={`Type: ${type.split('/')[1] || type}`}
//                 size="small"
//                 onDelete={() => setFilters(prev => ({
//                   ...prev,
//                   type: prev.type.filter(t => t !== type)
//                 }))}
//               />
//             ))}
            
//             {filters.status && (
//               <Chip 
//                 label={`Status: ${filters.status}`}
//                 size="small"
//                 onDelete={() => handleFilterChange('status', '')}
//               />
//             )}
            
//             {filters.date && (
//               <Chip 
//                 label={`Date: ${filters.date.replace('-', ' ')}`}
//                 size="small"
//                 onDelete={() => handleFilterChange('date', '')}
//               />
//             )}
            
//             {filters.search && (
//               <Chip 
//                 label={`Search: ${filters.search}`}
//                 size="small"
//                 onDelete={() => handleFilterChange('search', '')}
//               />
//             )}
//           </Box>
//         )}
//       </Box>

//       {/* Results Count */}
//       <Typography variant="body2" sx={{ mb: 1 }}>
//         Showing {filteredFiles.length} of {files.length} files
//       </Typography>

//       {/* Files Table */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell padding="checkbox">
//                 <Checkbox />
//               </TableCell>
//               <TableCell>
//                 <Box 
//                   sx={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     cursor: 'pointer' 
//                   }}
//                   onClick={() => handleSort('title')}
//                 >
//                   Name
//                   {sortConfig.key === 'title' && (
//                     <SortIcon 
//                       fontSize="small" 
//                       sx={{ 
//                         transform: sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
//                         ml: 0.5
//                       }} 
//                     />
//                   )}
//                 </Box>
//               </TableCell>
//               <TableCell>Type</TableCell>
//               <TableCell>Status</TableCell>
//               <TableCell>
//                 <Box 
//                   sx={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     cursor: 'pointer' 
//                   }}
//                   onClick={() => handleSort('date_uploaded')}
//                 >
//                   Date
//                   {sortConfig.key === 'date_uploaded' && (
//                     <SortIcon 
//                       fontSize="small" 
//                       sx={{ 
//                         transform: sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
//                         ml: 0.5
//                       }} 
//                     />
//                   )}
//                 </Box>
//               </TableCell>
//               <TableCell>Actions</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {filteredFiles.length > 0 ? (
//               filteredFiles.map((file) => (
//                 <TableRow key={file.id}>
//                   <TableCell padding="checkbox">
//                     <Checkbox
//                       checked={selectedFiles.includes(file.id)}
//                       onChange={() => onSelectFile(file.id)}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                       {getFileIcon(file.type)}
//                       <Typography sx={{ ml: 1 }}>{file.title}</Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>{file.type}</TableCell>
//                   <TableCell>
//                     {file.indexing_status === 'pending' ? (
//                       <Tooltip title="Start Indexing">
//                         <IconButton
//                           onClick={() => onStartIndexing(file.id, file.file_url)}
//                           size="small"
//                         >
//                           <PlayArrowIcon color="primary" />
//                         </IconButton>
//                       </Tooltip>
//                     ) : file.indexing_status === 'processing' ? (
//                       <CircularProgress
//                         size={24}
//                         thickness={5}
//                         sx={{ color: 'purple' }}
//                       />
//                     ) : (
//                       <CheckCircleIcon color="success" />
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     {new Date(file.date_uploaded).toLocaleDateString()}
//                   </TableCell>
//                   <TableCell>
//                     {/* PDF Annotation Button */}
//                     {file.type === 'application/pdf' && (
//                       <Tooltip title="Annotate PDF">
//                         <IconButton
//                           onClick={() => onAnnotate && onAnnotate(file)}
//                           size="small"
//                           color="primary"
//                         >
//                           <EditIcon />
//                         </IconButton>
//                       </Tooltip>
//                     )}

//                     {/* View File Button */}
//                     <Tooltip title="View File">
//                       <IconButton
//                         onClick={() => onViewFile ? onViewFile(file) : window.open(`${process.env.REACT_APP_BASE_URL}/${file.file_path}`, '_blank')}
//                         size="small"
//                       >
//                         <VisibilityIcon />
//                       </IconButton>
//                     </Tooltip>

//                     {/* More Options */}
//                     <IconButton
//                       size="small"
//                       onClick={(event) => handleMenuClick(event, file.id)}
//                     >
//                       <MoreVertIcon />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
//                   <Typography variant="body1" color="text.secondary">
//                     No files match your filters
//                   </Typography>
//                   <Button 
//                     variant="text" 
//                     onClick={resetFilters}
//                     sx={{ mt: 1 }}
//                   >
//                     Clear Filters
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Add Menu component */}
//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={handleMenuClose}
//       >
//         <MenuItem
//           onClick={handleDeleteClick}
//           sx={{
//             color: 'error.main',
//             '&:hover': { bgcolor: 'error.light' }
//           }}
//         >
//           <DeleteIcon sx={{ mr: 1 }} />
//           Delete File
//         </MenuItem>
//         <MenuItem
//           onClick={handleDownloadClick}
//           sx={{
//             color: 'info.main',
//             '&:hover': { bgcolor: 'info.light' }
//           }}
//         >
//           <DownloadIcon sx={{ mr: 1 }} />
//           Download File
//         </MenuItem>
//         <MenuItem
//           onClick={handleFileUpdate}
//           sx={{
//             color: 'info.main',
//             '&:hover': { bgcolor: 'info.light' }
//           }}
//         >
//           <EditIcon sx={{ mr: 1 }} />
//           Rename File
//         </MenuItem>
//       </Menu>

//       {/* Confirmation Dialogs */}
//       <Dialog
//         open={deleteDialogOpen}
//         onClose={handleDialogClose}
//       >
//         <DialogTitle>Confirm Delete</DialogTitle>
//         <DialogContent>
//           Are you sure you want to delete this file? This action cannot be undone.
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={handleDialogClose}
//             sx={{ color: 'text.secondary' }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleConfirmDelete}
//             color="error"
//             variant="contained"
//           >
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>
      
//       <Dialog
//         open={renameDialogOpen}
//         onClose={handleDialogClose}
//       >
//         <DialogTitle>Rename File</DialogTitle>
//         <DialogContent>
//           <TextField
//             fullWidth
//             label="File Title"
//             value={formData.title}
//             onChange={(e) => handleInputChange('title', e.target.value)}
//             error={!!errors.title}
//             helperText={errors.title}
//             required
//             sx={{ mt: 2 }}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={handleDialogClose}
//             sx={{ color: 'text.secondary' }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleConfirmRename}
//             color="primary"
//             variant="contained"
//           >
//             Save
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// };