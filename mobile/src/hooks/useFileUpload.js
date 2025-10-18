import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import api from '../services/api';
import { Alert } from 'react-native';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }
      return null;
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', err);
      return null;
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        return result;
      }
      return null;
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Document picker error:', err);
      return null;
    }
  };

  const uploadFile = async (fileUri, fileName, mimeType) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileSize = fileInfo.size;

      console.log('File info:', { fileUri, fileName, mimeType, fileSize });

      // Upload file through backend (bypasses CORS issues)
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });

      console.log('Sending upload request to /upload');

      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      console.log('Upload response:', data);
      setUploading(false);

      // Return s3Key, metadata, and downloadUrl from backend response
      return data;
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Upload error response:', err.response?.data);
      console.error('Upload error status:', err.response?.status);
      setError(err.response?.data?.error || err.message);
      setUploading(false);
      throw err;
    }
  };

  return {
    uploadFile,
    pickImage,
    pickDocument,
    uploading,
    progress,
    error,
  };
};
