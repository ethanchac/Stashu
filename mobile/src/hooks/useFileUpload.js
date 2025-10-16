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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      // Step 1: Get presigned URL from backend
      const { data } = await api.post('/upload-url', {
        fileName,
        fileType: mimeType,
        fileSize,
      });

      const { uploadUrl, s3Key } = data;

      // Step 2: Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const blob = await fetch(`data:${mimeType};base64,${fileContent}`).then(
        (res) => res.blob()
      );

      // Step 3: Upload file directly to S3
      await axios.put(uploadUrl, blob, {
        headers: {
          'Content-Type': mimeType,
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      setUploading(false);

      // Return s3Key to be included in message
      return {
        s3Key,
        fileMetadata: {
          fileName,
          fileSize,
          mimeType,
        },
      };
    } catch (err) {
      console.error('Upload error:', err);
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
