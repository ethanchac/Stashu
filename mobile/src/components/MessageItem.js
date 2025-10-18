import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet, Modal, Image, ActionSheetIOS, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import api from '../services/api';

export default function MessageItem({ message, channelId, showChannelName = false }) {
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await api.delete(`/channels/${channelId}/messages/${message.id}`);
            } catch (error) {
              console.error('Failed to delete message:', error);
              Alert.alert('Error', 'Failed to delete message');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handlePin = async () => {
    try {
      await api.patch(`/channels/${channelId}/messages/${message.id}/pin`);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to pin/unpin message:', error);
      Alert.alert('Error', 'Failed to pin/unpin message');
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(message.content);
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleCopyImage = async (imageUrl) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Save to Photos', 'Share', 'Copy URL'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Save to Photos
            await handleSaveToPhotos(imageUrl);
          } else if (buttonIndex === 2) {
            // Share
            await handleShareImage(imageUrl);
          } else if (buttonIndex === 3) {
            // Copy URL
            await Clipboard.setStringAsync(imageUrl);
            Alert.alert('Copied', 'Image URL copied to clipboard');
          }
        }
      );
    } else {
      // Android - just share
      await handleShareImage(imageUrl);
    }
  };

  const handleSaveToPhotos = async (imageUrl) => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Need permission to save to Photos');
        return;
      }

      // Download the image to cache
      const fileUri = FileSystem.cacheDirectory + 'temp_image.jpg';
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Image saved to Photos');
    } catch (error) {
      console.error('Failed to save image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleShareImage = async (imageUrl) => {
    try {
      // Download the image to cache
      const fileUri = FileSystem.cacheDirectory + 'temp_image.jpg';
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Use expo-sharing which properly handles images
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Image'
      });
    } catch (error) {
      console.error('Failed to share image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <View>
            {message.fileUrl && (
              <TouchableOpacity
                onPress={() => handleCopyImage(message.fileUrl)}
                onLongPress={() => Linking.openURL(message.fileUrl)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: message.fileUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {message.content && !message.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
              <Text style={styles.messageText} selectable>
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'file':
        return (
          <TouchableOpacity
            onPress={() => message.fileUrl && Linking.openURL(message.fileUrl)}
            activeOpacity={0.7}
            style={styles.fileContainer}
          >
            <Text style={styles.fileIcon}>📄</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>
                {message.content}
              </Text>
              {message.fileMetadata && (
                <Text style={styles.fileSize}>
                  {formatFileSize(message.fileMetadata.fileSize)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'link':
        return (
          <TouchableOpacity
            onPress={() => Linking.openURL(message.content)}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText} numberOfLines={2}>
              {message.content}
            </Text>
          </TouchableOpacity>
        );

      default:
        return (
          <Text style={styles.messageText} selectable>
            {message.content}
          </Text>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          // Don't copy on press for images - they handle their own clicks
          if (message.type !== 'image') {
            handleCopy();
          }
        }}
        onLongPress={() => setShowMenu(true)}
        activeOpacity={0.7}
        style={[
          styles.container,
          message.isPinned && styles.pinnedContainer,
          deleting && styles.deletingContainer
        ]}
        disabled={deleting}
      >
        {/* Channel name for global search results */}
        {showChannelName && message.channelName && (
          <View style={styles.channelNameContainer}>
            <Text style={styles.channelIcon}>💬</Text>
            <Text style={styles.channelNameText}>{message.channelName}</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDate(message.createdAt)}</Text>
          {message.isPinned && (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedBadgeText}>Pinned</Text>
            </View>
          )}
        </View>

        {renderContent()}
      </TouchableOpacity>

      {/* Context Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handlePin}
            >
              <Text style={styles.menuIcon}>📌</Text>
              <Text style={styles.menuText}>
                {message.isPinned ? 'Unpin Message' : 'Pin Message'}
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setShowMenu(false);
                handleDelete();
              }}
            >
              <Text style={styles.menuIcon}>🗑️</Text>
              <Text style={styles.menuTextDanger}>Delete Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#171717',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
  },
  pinnedContainer: {
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#5865f2',
  },
  deletingContainer: {
    opacity: 0.5,
  },
  channelNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  channelNameText: {
    fontSize: 12,
    color: '#949ba4',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#949ba4',
  },
  pinnedBadge: {
    backgroundColor: '#5865f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  pinnedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#dbdee1',
    lineHeight: 20,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#313338',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#313338',
    borderRadius: 8,
    marginTop: 4,
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    color: '#dbdee1',
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#949ba4',
  },
  linkText: {
    fontSize: 15,
    color: '#5865f2',
    textDecorationLine: 'underline',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#171717',
    borderRadius: 8,
    minWidth: 200,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  menuItemDanger: {
    backgroundColor: 'transparent',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    color: '#dbdee1',
    fontSize: 16,
  },
  menuTextDanger: {
    color: '#ed4245',
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#313338',
    marginVertical: 4,
  },
});
