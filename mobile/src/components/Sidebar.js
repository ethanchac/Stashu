import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChannels } from '../hooks/useChannels';
import api from '../services/api';

export default function Sidebar({ activeChannelId, onSelectChannel, onClose }) {
  const { user, logout } = useAuth();
  const { channels, loading: channelsLoading } = useChannels();
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('💬');
  const [creating, setCreating] = useState(false);

  const channelIcons = ['💬', '💡', '🔗', '📝', '📷', '📁', '⭐', '🎯'];

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

  const handleSelectChannel = (channelId) => {
    onSelectChannel(channelId);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            if (onClose) onClose();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stashu</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
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
                onPress={() => handleSelectChannel(item.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b2d31',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3f4147',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#b5bac1',
  },
  channelsContainer: {
    flex: 1,
    padding: 12,
  },
  channelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  channelsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b5bac1',
  },
  addButton: {
    fontSize: 24,
    color: '#b5bac1',
    fontWeight: '600',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  channelItemActive: {
    backgroundColor: '#3f4147',
  },
  channelIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  channelCount: {
    fontSize: 14,
    color: '#b5bac1',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#3f4147',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#b5bac1',
    textAlign: 'center',
    marginTop: 40,
  },
  loader: {
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2b2d31',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b5bac1',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#1e1f22',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3f4147',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: '#1e1f22',
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
    backgroundColor: '#3f4147',
  },
  modalButtonPrimary: {
    backgroundColor: '#5865f2',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
