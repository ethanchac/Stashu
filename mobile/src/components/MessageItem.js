import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet, Modal, Share } from 'react-native';
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
      // Use Share API as workaround for clipboard in Expo
      await Share.share({
        message: message.content
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Failed to share:', error);
      }
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

  return (
    <>
      <TouchableOpacity
        onPress={handleCopy}
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
