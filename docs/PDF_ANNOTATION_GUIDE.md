# PDF Annotation Feature Guide

## Overview
The StuddyBuddy application now includes a comprehensive PDF annotation feature that allows users to annotate PDF files directly in the browser and save them as new files.

## Features
- **In-browser PDF annotation** using PDFTron WebViewer
- **Non-destructive editing** - original files are preserved
- **Automatic file management** - annotated PDFs are saved as new files
- **Database tracking** - annotations are linked to original files
- **Seamless UI integration** - annotation button in file list

## How to Use

### 1. Upload a PDF File
- Go to the Uploads page
- Click "Upload File" and select a PDF
- Wait for the upload to complete

### 2. Annotate the PDF
- Find your PDF in the file list
- Click the **Edit** icon (pencil icon) next to the PDF file
- The PDF annotation modal will open with the full-featured editor

### 3. Available Annotation Tools
- **Text annotations** - Add comments and notes
- **Highlighting** - Highlight important text
- **Drawing tools** - Draw shapes and freehand annotations
- **Stamps** - Add predefined stamps and signatures

### 4. Save Annotations
- Click "Save Annotations" when you're done
- The annotated PDF will be saved as a new file
- You'll be returned to the file list
- Both original and annotated files will be visible

### 5. View Files
- Click the **View** icon (eye icon) to open any file in a new tab
- Annotated files retain all your annotations

## Technical Details

### Frontend Components
- **PDFAnnotator.jsx** - Main annotation component with PDFTron integration
- **FileList.jsx** - File list with annotation buttons
- **FileUpload.jsx** - Manages annotation modal state
- **annotationService.js** - Handles API calls for annotations

### Backend Endpoints
- `POST /api/uploads/save-annotated` - Saves annotated PDF as new file
- `GET /api/uploads/files` - Returns file list with annotation status
- `GET /api/uploads/file-info/:id` - Returns detailed file information

### Database Schema
```sql
-- Files table includes annotation tracking
annotated_pdf_id INTEGER REFERENCES files(id) -- Links to original file
```

## Environment Setup

### Required Environment Variables
```bash
# Backend API URL for frontend
REACT_APP_BASE_URL=http://your-domain:4000

# Database connection (using Docker service name)
POSTGRES_URI=postgresql://postgres:postgres@postgres:5432/postgres
```

### PDFTron WebViewer
The annotation feature requires PDFTron WebViewer. Ensure the WebViewer lib files are available at `/public/lib/`.

## Security Features
- **Authentication required** - Only authenticated users can annotate
- **File ownership** - Users can only annotate their own files
- **Secure file storage** - All files stored in protected uploads directory
- **Input validation** - All file uploads and annotations are validated

## Troubleshooting

### Annotation Button Not Appearing
- Ensure the file is a PDF (type: 'application/pdf')
- Check that you're logged in and own the file
- Verify FileList component is receiving onAnnotate prop

### PDF Not Loading in Annotator
- Check REACT_APP_BASE_URL is correctly set
- Ensure file exists at the specified path
- Verify PDFTron WebViewer is properly installed

### Save Functionality Not Working
- Check network connectivity to backend
- Verify authentication token is valid
- Check browser console for error messages

### Database Issues
- Ensure POSTGRES_URI uses 'postgres' hostname (not 'localhost') for Docker
- Verify database is running and accessible
- Check that annotated_pdf_id column exists in files table

## Development Notes

### Adding New Annotation Features
1. Extend PDFAnnotator component with new tools
2. Update annotationService with any new API endpoints
3. Modify backend routes if new functionality is needed

### Customizing UI
- Edit PDFAnnotator.css for styling
- Modify FileList.jsx for button appearance
- Update Material-UI theme in main app

### Testing
Run the integration test to verify all components:
```bash
./test_annotation_integration.sh
```

## Performance Considerations
- PDFTron WebViewer loads lazily when annotation modal opens
- Large PDF files may take time to load in the annotator
- Annotated files are saved as separate files (storage consideration)
- File list refreshes automatically after saving annotations

## Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Note: PDFTron WebViewer has specific browser requirements for optimal performance.

## Support
For issues with the annotation feature:
1. Check browser console for errors
2. Verify environment variables are correct
3. Run the integration test script
4. Check that all services are running (backend, database, frontend)
