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

      // Step 1: Get presigned URL from backend
      const { data } = await api.post('/upload-url', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      const { uploadUrl, s3Key } = data;

      // Step 2: Upload file directly to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        }
      });

      setUploading(false);

      // Return s3Key to be included in message
      return {
        s3Key,
        fileMetadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
        }
      };
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message);
      setUploading(false);
      throw err;
    }
  };

  return { uploadFile, uploading, progress, error };
};
