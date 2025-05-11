import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import { Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://157.230.124.2:5001/api';

export default function ImageUpload({ initialImages = [], onUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/cars/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const newImages = response.data.imageUrls;
      onUpload([...initialImages, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (index) => {
    const newImages = [...initialImages];
    newImages.splice(index, 1);
    onUpload(newImages);
  };

  return (
    <Box>
      <input
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        id="image-upload"
        onChange={handleUpload}
      />
      <label htmlFor="image-upload">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={uploading}
        >
          Upload Images
        </Button>
      </label>
      
      {uploading && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Uploading...
        </Typography>
      )}

      {initialImages.length > 0 && (
        <ImageList sx={{ width: '100%', height: 200, mt: 2 }} cols={4} rowHeight={164}>
          {initialImages.map((img, index) => (
            <ImageListItem key={index}>
              <img
                src={`${API_URL}${img}`}
                alt={`Car image ${index + 1}`}
                loading="lazy"
                style={{ height: '100%', objectFit: 'cover' }}
              />
              <ImageListItemBar
                position="top"
                actionIcon={
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={() => handleDelete(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                actionPosition="right"
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
}
