import React, { useState, useCallback } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { uploadService } from '../../services/uploadService'; // Adjust the import path as needed

export const SearchBar = ({ onSearch }) => {
  // Add debouncing to prevent too many API calls
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = useCallback(
    async (searchTerm) => {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for search
      const newTimeout = setTimeout(async () => {
        try {
          if (searchTerm.trim()) {
            const results = await uploadService.searchFiles(searchTerm);
            onSearch(results);
          } else {
            // If search is empty, reset the search
            onSearch([]);
          }
        } catch (error) {
          console.error('Search failed:', error);
          // You might want to handle the error appropriately here
        }
      }, 500); // 500ms delay

      setSearchTimeout(newTimeout);
    },
    [onSearch, searchTimeout]
  );

  return (
    <TextField
      size="small"
      placeholder="Search by name"
      onChange={(e) => handleSearch(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ width: 250 }}
    />
  );
};

