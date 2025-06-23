import React, { useState, useCallback } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect } from 'react';

export const SearchBar = ({ onSearch }) => {
  // Add debouncing to prevent too many API calls
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSearch = useCallback(
    (searchTerm) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const newTimeout = setTimeout(() => {
        onSearch(searchTerm);
      }, 500);

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

