import { useState } from 'react';
import axios from 'axios';
import api from '../services/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Upload file through backend (bypasses CORS issues)
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        }
      });

      setUploading(false);

      // Return s3Key and metadata from backend response
      return data;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message);
      setUploading(false);
      throw err;
    }
  };

  return { uploadFile, uploading, progress, error };
};
