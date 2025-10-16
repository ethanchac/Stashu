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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMessages } from '../hooks/useMessages';
import api from '../services/api';

export default function ChatScreen({ route, navigation }) {
  const { channelId, channelName, channelIcon } = route.params || {};
  const { messages, loading: messagesLoading, loadMore, hasMore } = useMessages(channelId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const handleSendMessage = async () => {
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
              <View style={styles.messageItem}>
                <Text style={styles.messageDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.messageContent}>{item.content}</Text>
              </View>
            )}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.5}
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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#72767d"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={2000}
              editable={!sending}
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
  messageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3f4147',
  },
  messageDate: {
    fontSize: 12,
    color: '#b5bac1',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2b2d31',
    borderTopWidth: 1,
    borderTopColor: '#3f4147',
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
