import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Button, TextField, InputAdornment, Slider, FormControl, FormLabel } from "@mui/material";
import { CircularProgress } from "../../common/icons";
import { SearchBar } from "../files/SearchBar";
import { uploadService } from "../../services";
import { useNavigate } from "react-router-dom";
import { authServices } from "../../auth";
import { FileList } from "../files/FileList";
import PDFAnnotationViewer from "../PDFAnnotationViewer";

export const FileLists = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indexingFiles, setIndexingFiles] = useState(new Set());
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [noteCount,setNoteCount]=useState(5);

  const handleNoteCountChange=(event)=>{
    const value = Math.min(20, Math.max(1, parseInt(event.target.value) || 1));
    setNoteCount(value);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await uploadService.getFiles();
      setFiles(Array.isArray(response.files) ? response.files : []);
    } catch (error) {
      console.error("Error loading files:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartIndexing = async (fileId, fileUrl) => {
    try {
      const fileToIndex = files.find((file) => file.id === fileId);
      if (!fileToIndex) {
        throw new Error("File not found");
      }

      console.log("Starting indexing for file:", fileId, "URL:", fileUrl);
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, indexing_status: "processing" } : file
        )
      );

      await uploadService.startIndexing(fileUrl);

      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, indexing_status: "completed" } : file
        )
      );
    } catch (error) {
      console.error("Indexing error:", error);
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, indexing_status: "failed" } : file
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
      console.error("Search error:", error);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredFiles =
    searchResults ||
    files?.filter((file) => {
      if (!file || !file.title) return false;
      return file.title
        .toLowerCase()
        .includes(
          (typeof searchQuery === "string" ? searchQuery : "").toLowerCase()
        );
    }) ||
    [];

  const handleGenerateStickynotes = async () => {
    const fileId = selectedFiles[0];
    if (!fileId) {
      alert("Please select a file first");
      return;
    }

    const accessToken = authServices.getAccessToken();

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
          noteCount: noteCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Sticky notes generation failed");
      }

      const data = await response.json();
      console.log("Generated sticky notes:", data);

      // Navigate with properly structured data
      navigate("/home/stickynotes", {
        state: {
          stickynotes: data.stickynotes,
          file_id: data.file_id,
          title: data.title,
        },
      });
    } catch (error) {
      console.error("Sticky notes generation error:", error);
      alert(`Error generating sticky notes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // File deletion handler
  const handleDeleteFile = async (fileId) => {
    try {
      await uploadService.deleteFile(fileId);
      // Remove the file from the local state
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      setSelectedFiles((prevSelected) =>
        prevSelected.filter((id) => id !== fileId)
      );
      console.log("File deleted successfully:", fileId);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const [viewingFile, setViewingFile] = useState(null);

  const handleViewerClose = () => {
    setViewingFile(null);
  };

  // If viewing a PDF, show the annotation viewer instead of PDF viewer
  if (viewingFile) {
    return (
      <PDFAnnotationViewer
        fileId={viewingFile.id}
        filePath={viewingFile.file_path}
        fileName={viewingFile.title}
        onClose={handleViewerClose}
      />
    );
  }

   const handleViewFile = (file) => {
    // If it's a PDF, use the PDFViewer component
    if (file.type === "application/pdf") {
      setViewingFile(file);
    } else {
      // For other file types, open in new tab
      window.open(
        `${process.env.REACT_APP_BASE_URL}/${file.file_path}`,
        "_blank"
      );
    }
  };

  return (
    <Box sx={{ p: 10, margin: 6 }}>
      <Typography variant="h5" sx={{ mb: 2, color: "purple" }}>
        Select File for Sticky Notes Generation
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "gray" }}>
        Choose a file to generate study notes from!
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <SearchBar onSearch={handleSearch} />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={40} sx={{ color: "purple" }} />
        </Box>
      ) : (
        <>
          <FileList
            files={filteredFiles.map((file) => ({
              ...file,
              fileUrl: file.file_url?.replace(/^uploads\//, ""), // Remove 'uploads/' prefix
            }))}
            selectedFiles={selectedFiles}
            onSelectFile={(id) => {
              setSelectedFiles((prev) =>
                prev.includes(id)
                  ? prev.filter((fileId) => fileId !== id)
                  : [...prev, id]
              );
            }}
            onStartIndexing={handleStartIndexing}
            onViewFile={handleViewFile}
            onDeleteFile={handleDeleteFile} // Pass the delete handler
          />

{selectedFiles.length > 0 && (
                <Box sx={{ 
                  mt: 4, 
                  mb: 2, 
                  p: 3, 
                  borderRadius: 2, 
                  backgroundColor: '#f9f9f9',
                  maxWidth: '500px',
                  mx: 'auto'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#4B0082' }}>
                    Study Notes Options
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormLabel sx={{ mb: 1, color: '#666' }}>
                      Number of notes to generate (1-20)
                    </FormLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={noteCount}
                        min={1}
                        max={20}
                        step={1}
                        onChange={(e, newValue) => setNoteCount(newValue)}
                        sx={{ 
                          color: '#22c55e',
                          '& .MuiSlider-thumb': {
                            backgroundColor: '#16a34a',
                          }
                        }}
                      />
                      <TextField
                        value={noteCount}
                        onChange={handleNoteCountChange}
                        type="number"
                        variant="outlined"
                        size="small"
                        InputProps={{
                          inputProps: { min: 1, max: 20 }
                        }}
                        sx={{ width: '80px' }}
                      />
                    </Box>
                  </FormControl>
                </Box>
              )}

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
                      bgcolor: '#22c55e', // Changed from #d1d5db to keep it green
                      opacity: 0.7, // Added opacity to show disabled state
                      color: 'white'  // Changed from rgba(255,255,255,0.8) to keep text fully white
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
