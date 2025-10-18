import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMessages } from '../hooks/useMessages';
import { useFileUpload } from '../hooks/useFileUpload';
import MessageItem from '../components/MessageItem';
import api from '../services/api';

export default function ChatScreen({ route, navigation }) {
  const { channelId, channelName, channelIcon } = route.params || {};
  const { messages, loading: messagesLoading, loadMore, hasMore } = useMessages(channelId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // { uri, name, mimeType, type: 'image' | 'file' }
  const { uploadFile, pickImage, pickDocument, uploading, progress } = useFileUpload();
  const flatListRef = useRef(null);

  const handleSendMessage = async () => {
    // If there's a selected file, send it
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    if (!newMessage.trim() || !channelId) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      await api.post(`/channels/${channelId}/messages`, {
        content,
        type: 'text'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', `Failed to send message: ${error.response?.data?.error || error.message}`);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;

    try {
      setSending(true);

      // Upload file to S3
      const { s3Key, fileMetadata, downloadUrl } = await uploadFile(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType
      );

      // Send message with file reference and download URL
      await api.post(`/channels/${channelId}/messages`, {
        content: newMessage.trim() || selectedFile.name,
        type: selectedFile.type,
        fileRef: s3Key,
        fileUrl: downloadUrl,
        fileMetadata
      });

      // Clear selection and message
      setSelectedFile(null);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to upload file:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async () => {
    const options = ['Take Photo', 'Choose from Library', 'Choose Document', 'Cancel'];
    const cancelButtonIndex = 3;

    const showActionSheet = () => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex,
          },
          async (buttonIndex) => {
            if (buttonIndex === 0) {
              // Take Photo (not implemented in this version)
              Alert.alert('Info', 'Camera feature coming soon!');
            } else if (buttonIndex === 1) {
              await handleImagePick();
            } else if (buttonIndex === 2) {
              await handleDocumentPick();
            }
          }
        );
      } else {
        // Android - show simple alert
        Alert.alert(
          'Upload File',
          'Choose an option',
          [
            { text: 'Choose Image', onPress: handleImagePick },
            { text: 'Choose Document', onPress: handleDocumentPick },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    };

    showActionSheet();
  };

  const handleImagePick = async () => {
    try {
      const result = await pickImage();
      if (!result) return;

      // Stage the image for preview
      setSelectedFile({
        uri: result.uri,
        name: `image-${Date.now()}.${result.uri.split('.').pop()}`,
        mimeType: result.mimeType || 'image/jpeg',
        type: 'image'
      });
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await pickDocument();
      if (!result) return;

      // Stage the document for preview
      setSelectedFile({
        uri: result.uri,
        name: result.name,
        mimeType: result.mimeType || 'application/octet-stream',
        type: 'file'
      });
    } catch (error) {
      console.error('Failed to pick document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        {channelIcon && <Text style={styles.headerIcon}>{channelIcon}</Text>}
        <Text style={styles.headerTitle}>{channelName || 'Chat'}</Text>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        {messagesLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#5865f2" size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send your first message!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageItem
                message={item}
                channelId={channelId}
              />
            )}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
          />
        )}
      </View>

      {/* Message Input */}
      {channelId && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Upload Progress */}
          {uploading && (
            <View style={styles.uploadProgressContainer}>
              <View style={styles.uploadProgressInfo}>
                <Text style={styles.uploadProgressText}>Uploading...</Text>
                <Text style={styles.uploadProgressPercent}>{progress}%</Text>
              </View>
              <View style={styles.uploadProgressBar}>
                <View
                  style={[
                    styles.uploadProgressFill,
                    { width: `${progress}%` }
                  ]}
                />
              </View>
            </View>
          )}

          <View>
            {/* File Preview Section */}
            {selectedFile && (
              <View style={styles.filePreviewContainer}>
                {selectedFile.type === 'image' ? (
                  <View style={styles.previewCard}>
                    <Image
                      source={{ uri: selectedFile.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelFile}
                      disabled={uploading}
                    >
                      <Text style={styles.cancelButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.previewCard}>
                    <View style={styles.previewFile}>
                      <Text style={styles.previewFileIcon}>📄</Text>
                      <Text style={styles.previewFileName} numberOfLines={2}>
                        {selectedFile.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelFile}
                      disabled={uploading}
                    >
                      <Text style={styles.cancelButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              {/* Attachment Button */}
              <TouchableOpacity
                style={[styles.attachButton, (uploading || sending) && styles.attachButtonDisabled]}
                onPress={handleFileUpload}
                disabled={uploading || sending}
              >
                <Text style={styles.attachButtonText}>+</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.messageInput}
                placeholder={selectedFile ? 'Add a caption...' : 'Type a message..'}
                placeholderTextColor="#72767d"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={2000}
                editable={!sending && !uploading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (sending || (!newMessage.trim() && !selectedFile)) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={sending || (!newMessage.trim() && !selectedFile)}
              >
                <Text style={styles.sendButtonText}>
                  {sending ? '...' : '→'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1f22',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3f4147',
    backgroundColor: '#2b2d31',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  uploadProgressContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#2b2d31',
    borderTopWidth: 1,
    borderTopColor: '#3f4147',
  },
  uploadProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  uploadProgressText: {
    fontSize: 12,
    color: '#b5bac1',
  },
  uploadProgressPercent: {
    fontSize: 12,
    color: '#b5bac1',
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: '#1e1f22',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#5865f2',
  },
  filePreviewContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#2b2d31',
    borderTopWidth: 1,
    borderTopColor: '#3f4147',
  },
  previewCard: {
    backgroundColor: '#1e1f22',
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  previewFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  previewFileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  previewFileName: {
    flex: 1,
    fontSize: 14,
    color: '#dbdee1',
  },
  cancelButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2b2d31',
    borderTopWidth: 1,
    borderTopColor: '#3f4147',
  },
  attachButton: {
    marginRight: 8,
    width: 44,
    height: 44,
    backgroundColor: '#5865f2',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  attachButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#1e1f22',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    backgroundColor: '#5865f2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#b5bac1',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#72767d',
    textAlign: 'center',
    marginTop: 8,
  },
});
