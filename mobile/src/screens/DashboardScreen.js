import { useState, useEffect, useRef } from 'react';
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
  Modal,
  Alert,
  Dimensions,
  Animated,
  PanResponder,
  ActionSheetIOS,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { useChannels } from '../hooks/useChannels';
import { useMessages } from '../hooks/useMessages';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useFileUpload } from '../hooks/useFileUpload';
import MessageItem from '../components/MessageItem';
import api from '../services/api';

const SIDEBAR_WIDTH = 280;

// Search Icon - exact match from web version
const SearchIcon = ({ size = 20, color = '#949ba4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

// Pin/Bookmark Icon - exact match from web version
const BookmarkIcon = ({ size = 20, color = '#949ba4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </Svg>
);

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { channels, loading: channelsLoading } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState(null);
  const { messages, loading: messagesLoading, loadMore, hasMore } = useMessages(activeChannelId);
  const { searchAllChannels, searching, searchResults } = useGlobalSearch();
  const { uploadFile, uploading, progress } = useFileUpload();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('💬');
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('current'); // 'current' or 'all'
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const flatListRef = useRef(null);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const debounceTimer = useRef(null);

  const channelIcons = ['💬', '💡', '🔗', '📝', '📷', '📁', '⭐', '🎯'];

  // Debounce search query
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);

      // Trigger global search if scope is 'all'
      if (searchScope === 'all') {
        searchAllChannels(searchQuery, showPinnedOnly);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, searchScope, showPinnedOnly, searchAllChannels]);

  // Filter messages based on search query, scope, and pinned status
  let filteredMessages = searchScope === 'all'
    ? searchResults
    : debouncedSearchQuery.trim()
    ? messages.filter(message =>
        message.content?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    : messages;

  // Apply pinned filter if :pinned is active
  if (showPinnedOnly && searchScope !== 'all') {
    filteredMessages = filteredMessages.filter(msg => msg.isPinned);
  }

  const pinnedMessages = messages.filter(msg => msg.isPinned);

  // Toggle sidebar animation
  const toggleSidebar = () => {
    const toValue = sidebarOpen ? -SIDEBAR_WIDTH : 0;
    Animated.spring(sidebarAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes from the left edge
        return gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= SIDEBAR_WIDTH) {
          sidebarAnim.setValue(-SIDEBAR_WIDTH + gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SIDEBAR_WIDTH / 2 || gestureState.vx > 0.5) {
          // Open sidebar
          Animated.spring(sidebarAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
          setSidebarOpen(true);
        } else {
          // Close sidebar
          Animated.spring(sidebarAnim, {
            toValue: -SIDEBAR_WIDTH,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
          setSidebarOpen(false);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  const handleSendMessage = async () => {
    // If there are selected files, send them
    if (selectedFiles.length > 0) {
      await handleSendFiles();
      return;
    }

    if (!newMessage.trim() || !activeChannelId) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      console.log('Sending message to:', `/channels/${activeChannelId}/messages`);
      const response = await api.post(`/channels/${activeChannelId}/messages`, {
        content,
        type: 'text'
      });
      console.log('Message sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      Alert.alert('Error', `Failed to send message: ${error.response?.data?.error || error.message}`);
      setNewMessage(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleSendFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setSending(true);

      // Upload all files
      for (const file of selectedFiles) {
        console.log('Uploading file:', {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          type: file.type
        });

        const { s3Key, fileMetadata, downloadUrl } = await uploadFile(
          file.uri,
          file.name,
          file.mimeType
        );

        console.log('File uploaded successfully:', { s3Key, downloadUrl });

        // Send message with file reference and download URL
        await api.post(`/channels/${activeChannelId}/messages`, {
          content: newMessage.trim() || file.name,
          type: file.type,
          fileRef: s3Key,
          fileUrl: downloadUrl,
          fileMetadata
        });
      }

      // Clear selection and message
      setSelectedFiles([]);
      setNewMessage('');
      handleCloseUploadSheet();
    } catch (error) {
      console.error('Failed to upload files:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', `Failed to upload files: ${error.response?.data?.error || error.message}`);
    } finally {
      setSending(false);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to upload them.');
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: 'photo',
        sortBy: ['creationTime'],
      });

      // Get full asset info for each photo to get localUri
      const photosWithLocalUri = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
            return {
              ...asset,
              localUri: assetInfo.localUri || assetInfo.uri
            };
          } catch (error) {
            console.error('Failed to get asset info:', error);
            return asset;
          }
        })
      );

      setPhotos(photosWithLocalUri);

      if (photosWithLocalUri.length === 0) {
        Alert.alert('No Photos', 'No photos found in your library. Try adding some photos to the simulator.');
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
      Alert.alert('Error', `Failed to load photos: ${error.message}`);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleOpenUploadSheet = async () => {
    setShowUploadSheet(true);
    await loadPhotos();
  };

  const handleCloseUploadSheet = () => {
    setShowUploadSheet(false);
    setSelectedFiles([]);
  };

  const handleSelectPhoto = async (photo) => {
    try {
      const fileData = {
        uri: photo.localUri || photo.uri,
        assetId: photo.id,
        name: photo.filename || `image-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        type: 'image'
      };

      // Check if already selected
      const isSelected = selectedFiles.some(f => f.assetId === photo.id);

      if (isSelected) {
        // Remove from selection
        setSelectedFiles(selectedFiles.filter(f => f.assetId !== photo.id));
      } else {
        // Add to selection
        setSelectedFiles([...selectedFiles, fileData]);
      }
    } catch (error) {
      console.error('Failed to select photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFiles([...selectedFiles, {
          uri: result.assets[0].uri,
          name: `photo-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          type: 'image'
        }]);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFiles([...selectedFiles, {
          uri: result.uri,
          name: result.name,
          mimeType: result.mimeType || 'application/octet-stream',
          type: 'file'
        }]);
      }
    } catch (error) {
      console.error('Failed to pick document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      Alert.alert('Error', 'Please enter a channel name');
      return;
    }

    try {
      setCreating(true);
      await api.post('/channels', {
        name: newChannelName.trim(),
        icon: newChannelIcon,
        color: '#5865f2'
      });
      setNewChannelName('');
      setNewChannelIcon('💬');
      setShowChannelModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {/* Chat Area (Full Screen) */}
            <View style={styles.chatArea}>
              {/* Chat Header with Menu Button and Search */}
              {activeChannel && (
                <View style={styles.chatHeaderContainer}>
                  <View style={styles.chatHeader}>
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={toggleSidebar}
                    >
                      <Text style={styles.menuIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.chatHeaderIcon}>{activeChannel.icon}</Text>
                    <Text style={styles.chatHeaderTitle}>{activeChannel.name}</Text>

                    {/* Search and Pin icons */}
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setSearchExpanded(!searchExpanded)}
                      >
                        <SearchIcon size={20} color="#949ba4" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setShowPinnedPanel(true)}
                      >
                        <BookmarkIcon
                          size={20}
                          color={pinnedMessages.length > 0 ? '#5865f2' : '#949ba4'}
                        />
                        {pinnedMessages.length > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pinnedMessages.length}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Expandable Search Bar */}
                  {searchExpanded && (
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search messages..."
                        placeholderTextColor="#72767d"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                      />
                      <View style={styles.searchActions}>
                        {searchScope === 'all' && (
                          <TouchableOpacity
                            style={styles.searchTag}
                            onPress={() => setSearchScope('current')}
                          >
                            <Text style={styles.searchTagText}>:all ×</Text>
                          </TouchableOpacity>
                        )}
                        {!searchScope === 'all' && (
                          <TouchableOpacity
                            style={styles.searchTag}
                            onPress={() => setSearchScope('all')}
                          >
                            <Text style={styles.searchTagText}>+:all</Text>
                          </TouchableOpacity>
                        )}
                        {showPinnedOnly && (
                          <TouchableOpacity
                            style={[styles.searchTag, styles.searchTagPinned]}
                            onPress={() => setShowPinnedOnly(false)}
                          >
                            <Text style={styles.searchTagText}>:pinned ×</Text>
                          </TouchableOpacity>
                        )}
                        {!showPinnedOnly && (
                          <TouchableOpacity
                            style={[styles.searchTag, styles.searchTagPinned]}
                            onPress={() => setShowPinnedOnly(true)}
                          >
                            <Text style={styles.searchTagText}>+:pinned</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Messages */}
              <View style={styles.messagesContainer}>
                {messagesLoading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator color="#5865f2" size="large" />
                  </View>
                ) : filteredMessages.length === 0 && debouncedSearchQuery ? (
                  <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No messages found</Text>
                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                  </View>
                ) : messages.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubtext}>Send your first message!</Text>
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={filteredMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <MessageItem
                        message={item}
                        channelId={item.channelId || activeChannelId}
                        showChannelName={searchScope === 'all'}
                      />
                    )}
                    onEndReached={() => hasMore && loadMore() && !debouncedSearchQuery}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => !debouncedSearchQuery && flatListRef.current?.scrollToEnd()}
                    onLayout={() => !debouncedSearchQuery && flatListRef.current?.scrollToEnd()}
                  />
                )}
              </View>

              {/* Pinned Messages Panel */}
              {showPinnedPanel && (
                <Modal
                  visible={showPinnedPanel}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowPinnedPanel(false)}
                >
                  <TouchableOpacity
                    style={styles.pinnedOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPinnedPanel(false)}
                  >
                    <View style={styles.pinnedPanel}>
                      <View style={styles.pinnedHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <BookmarkIcon size={20} color="#5865f2" />
                          <Text style={styles.pinnedTitle}>Pinned Messages</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowPinnedPanel(false)}>
                          <Text style={styles.closeIcon}>×</Text>
                        </TouchableOpacity>
                      </View>

                      {pinnedMessages.length === 0 ? (
                        <View style={styles.centerContainer}>
                          <Text style={styles.emptyText}>No pinned messages</Text>
                          <Text style={styles.emptySubtext}>Long press a message to pin it</Text>
                        </View>
                      ) : (
                        <FlatList
                          data={pinnedMessages}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              onPress={() => setShowPinnedPanel(false)}
                            >
                              <MessageItem
                                message={item}
                                channelId={activeChannelId}
                              />
                            </TouchableOpacity>
                          )}
                          contentContainerStyle={styles.pinnedList}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}

              {/* Message Input */}
              {activeChannelId && (
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

                  <View style={styles.inputContainer}>
                      {/* Attachment Button */}
                      <TouchableOpacity
                        style={[styles.attachButton, (uploading || sending) && styles.attachButtonDisabled]}
                        onPress={handleOpenUploadSheet}
                        disabled={uploading || sending}
                      >
                        <Text style={styles.attachButtonText}>+</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={styles.messageInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#72767d"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={2000}
                        editable={!sending && !uploading}
                      />
                      <TouchableOpacity
                        style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                      >
                        <Text style={styles.sendButtonText}>
                          {sending ? '...' : '→'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
              )}
            </View>

            {/* Sliding Sidebar */}
            <Animated.View
              style={[
                styles.sidebar,
                {
                  transform: [{ translateX: sidebarAnim }]
                }
              ]}
            >
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Stashu</Text>
            <Text style={styles.sidebarSubtitle}>{user?.email}</Text>
          </View>

          {/* Channels List */}
          <View style={styles.channelsContainer}>
            <View style={styles.channelsHeader}>
              <Text style={styles.channelsTitle}>CHANNELS</Text>
              <TouchableOpacity onPress={() => setShowChannelModal(true)}>
                <Text style={styles.addButton}>+</Text>
              </TouchableOpacity>
            </View>

            {channelsLoading ? (
              <ActivityIndicator color="#5865f2" style={styles.loader} />
            ) : (
              <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.channelItem,
                      activeChannelId === item.id && styles.channelItemActive
                    ]}
                    onPress={() => {
                      setActiveChannelId(item.id);
                      // Close sidebar after selecting channel
                      if (sidebarOpen) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Text style={styles.channelIcon}>{item.icon}</Text>
                    <View style={styles.channelInfo}>
                      <Text style={styles.channelName}>{item.name}</Text>
                      <Text style={styles.channelCount}>
                        {item.messageCount || 0} messages
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No channels yet</Text>
                }
              />
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Overlay when sidebar is open */}
        {sidebarOpen && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleSidebar}
          />
        )}
      </Animated.View>

      {/* Upload Bottom Sheet Modal - Discord Style */}
      <Modal
        visible={showUploadSheet}
        animationType="slide"
        transparent
        onRequestClose={handleCloseUploadSheet}
      >
        <TouchableOpacity
          style={styles.uploadSheetOverlay}
          activeOpacity={1}
          onPress={handleCloseUploadSheet}
        >
          <View style={styles.uploadSheet}>
            {/* Message Input at Top */}
            <View style={styles.uploadInputContainer}>
              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <ScrollView
                  horizontal
                  style={styles.uploadFilePreviews}
                  showsHorizontalScrollIndicator={false}
                >
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={styles.uploadFilePreviewThumb}>
                      {file.type === 'image' ? (
                        <Image
                          source={{ uri: file.uri }}
                          style={styles.uploadPreviewThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.uploadPreviewThumbFile}>
                          <Text style={styles.uploadPreviewThumbFileIcon}>📄</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.uploadPreviewThumbCancel}
                        onPress={() => handleRemoveFile(index)}
                        disabled={uploading}
                      >
                        <Text style={styles.uploadPreviewCancelText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TextInput
                style={styles.uploadMessageInput}
                placeholder={selectedFiles.length > 0 ? 'Add a caption...' : 'Type a message...'}
                placeholderTextColor="#72767d"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={2000}
                editable={!sending && !uploading}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.uploadActions}>
              <TouchableOpacity
                style={styles.uploadActionButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.uploadActionIcon}>📷</Text>
                <Text style={styles.uploadActionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadActionButton}
                onPress={handlePickDocument}
              >
                <Text style={styles.uploadActionIcon}>📁</Text>
                <Text style={styles.uploadActionText}>Files</Text>
              </TouchableOpacity>
            </View>

            {/* Photo Grid - 3 Columns */}
            {loadingPhotos ? (
              <View style={styles.uploadLoadingContainer}>
                <ActivityIndicator color="#5865f2" size="large" />
              </View>
            ) : photos.length === 0 ? (
              <View style={styles.uploadLoadingContainer}>
                <Text style={styles.emptyText}>No photos in library</Text>
                <Text style={styles.emptySubtext}>Use "Take Photo" or "Files" above</Text>
              </View>
            ) : (
              <ScrollView style={styles.photoGrid}>
                <View style={styles.photoGridRow}>
                  {photos.map((photo, index) => {
                    return (
                      <TouchableOpacity
                        key={photo.id}
                        style={[
                          styles.photoGridItem,
                          selectedFiles.some(f => f.assetId === photo.id) && styles.photoGridItemSelected
                        ]}
                        onPress={() => handleSelectPhoto(photo)}
                      >
                        <Image
                          source={{ uri: photo.localUri || photo.uri }}
                          style={styles.photoGridImage}
                          resizeMode="cover"
                        />
                        {selectedFiles.some(f => f.assetId === photo.id) && (
                          <View style={styles.photoSelectedOverlay}>
                            <Text style={styles.photoSelectedCheck}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Send Button */}
            {selectedFiles.length > 0 && (
              <View style={styles.uploadSendContainer}>
                <TouchableOpacity
                  style={styles.uploadSendButton}
                  onPress={handleSendFiles}
                  disabled={uploading || sending}
                >
                  <Text style={styles.uploadSendButtonText}>
                    {uploading || sending ? 'Uploading...' : `Send ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Channel Modal */}
      <Modal
        visible={showChannelModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChannelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Channel</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Channel Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Ideas, Links, Notes"
                placeholderTextColor="#72767d"
                value={newChannelName}
                onChangeText={setNewChannelName}
                editable={!creating}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Icon (Emoji)</Text>
              <View style={styles.iconGrid}>
                {channelIcons.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.iconButton,
                      newChannelIcon === emoji && styles.iconButtonActive
                    ]}
                    onPress={() => setNewChannelIcon(emoji)}
                  >
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowChannelModal(false)}
                disabled={creating}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, creating && styles.modalButtonDisabled]}
                onPress={handleCreateChannel}
                disabled={creating || !newChannelName.trim()}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#171717',
    borderRightWidth: 1,
    borderRightColor: '#313338',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dbdee1',
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: '#949ba4',
  },
  channelsContainer: {
    flex: 1,
    padding: 8,
  },
  channelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  channelsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#949ba4',
  },
  addButton: {
    fontSize: 20,
    color: '#949ba4',
    fontWeight: '600',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  channelItemActive: {
    backgroundColor: '#313338',
  },
  channelIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dbdee1',
    marginBottom: 2,
  },
  channelCount: {
    fontSize: 12,
    color: '#949ba4',
  },
  logoutButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#313338',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#dbdee1',
    fontSize: 14,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
    backgroundColor: '#171717',
  },
  chatHeaderIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dbdee1',
  },
  messagesContainer: {
    flex: 1,
  },
  messageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
  },
  messageDate: {
    fontSize: 12,
    color: '#949ba4',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
    color: '#dbdee1',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: '#313338',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#dbdee1',
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
    color: '#949ba4',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#949ba4',
    textAlign: 'center',
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dbdee1',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#949ba4',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#dbdee1',
    borderWidth: 1,
    borderColor: '#313338',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: '#121212',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#5865f2',
  },
  iconEmoji: {
    fontSize: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#313338',
  },
  modalButtonPrimary: {
    backgroundColor: '#5865f2',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonSecondaryText: {
    color: '#dbdee1',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderContainer: {
    backgroundColor: '#171717',
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  headerIconButton: {
    position: 'relative',
    padding: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#5865f2',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#121212',
  },
  searchInput: {
    backgroundColor: '#171717',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#dbdee1',
    marginBottom: 8,
  },
  searchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchTag: {
    backgroundColor: '#5865f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  searchTagPinned: {
    backgroundColor: '#fbbf24',
  },
  searchTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    padding: 12,
  },
  pinnedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pinnedPanel: {
    backgroundColor: '#171717',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  pinnedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
  },
  pinnedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dbdee1',
  },
  closeIcon: {
    fontSize: 32,
    color: '#949ba4',
  },
  pinnedList: {
    padding: 12,
  },
  uploadProgressContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: '#313338',
  },
  uploadProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  uploadProgressText: {
    fontSize: 12,
    color: '#949ba4',
  },
  uploadProgressPercent: {
    fontSize: 12,
    color: '#949ba4',
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: '#121212',
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
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: '#313338',
  },
  previewCard: {
    backgroundColor: '#121212',
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
  attachButton: {
    marginRight: 8,
    width: 44,
    height: 44,
    backgroundColor: '#5865f2',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  attachButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  uploadSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  uploadSheet: {
    backgroundColor: '#171717',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%',
    paddingBottom: 20,
  },
  uploadInputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
  },
  uploadFilePreviews: {
    marginBottom: 8,
  },
  uploadFilePreviewThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
    backgroundColor: '#121212',
  },
  uploadPreviewThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadPreviewThumbFile: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#313338',
  },
  uploadPreviewThumbFileIcon: {
    fontSize: 32,
  },
  uploadPreviewThumbCancel: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ed4245',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPreviewCancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadMessageInput: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#dbdee1',
    minHeight: 50,
    maxHeight: 100,
  },
  uploadActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#313338',
  },
  uploadActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#313338',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  uploadActionIcon: {
    fontSize: 20,
  },
  uploadActionText: {
    color: '#dbdee1',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGrid: {
    maxHeight: 300,
    padding: 8,
  },
  photoGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoGridItem: {
    width: '32.5%',
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photoGridItemSelected: {
    borderWidth: 3,
    borderColor: '#5865f2',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoSelectedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5865f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSelectedCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadSendContainer: {
    padding: 16,
    paddingTop: 12,
  },
  uploadSendButton: {
    backgroundColor: '#5865f2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
