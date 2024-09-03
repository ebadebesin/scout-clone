import React from 'react';
import { TextField } from '@mui/material';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <TextField
      label="Search by Name or SKU"
      variant="outlined"
      fullWidth
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      sx={{ marginBottom: 2 }} // Add some margin at the bottom
    />
  );
}