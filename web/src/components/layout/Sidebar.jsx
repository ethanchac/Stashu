import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Sidebar({ channels, activeChannelId, onSelectChannel }) {
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('💬');
  const [creating, setCreating] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelIcon, setEditChannelIcon] = useState('💬');
  const [updating, setUpdating] = useState(false);

  // Drag and drop state
  const [draggedChannel, setDraggedChannel] = useState(null);
  const [dragOverChannel, setDragOverChannel] = useState(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      setCreating(true);
      await api.post('/channels', {
        name: newChannelName.trim(),
        icon: newChannelIcon,
        color: '#6366f1'
      });
      setNewChannelName('');
      setNewChannelIcon('💬');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create channel:', error);

      // Show detailed error message
      let errorMsg = 'Failed to create channel';
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMsg = 'Cannot connect to backend. Make sure the backend server is running on http://localhost:3000';
      } else if (error.response?.status === 403) {
        errorMsg = 'Authentication failed. Try logging out and back in.';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }

      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleContextMenu = (e, channel) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      channel
    });
  };

  const handleEditChannel = (channel) => {
    setEditingChannel(channel);
    setEditChannelName(channel.name);
    setEditChannelIcon(channel.icon);
    setShowEditModal(true);
    setContextMenu(null);
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    if (!editChannelName.trim() || !editingChannel) return;

    try {
      setUpdating(true);
      await api.patch(`/channels/${editingChannel.id}`, {
        name: editChannelName.trim(),
        icon: editChannelIcon
      });
      setShowEditModal(false);
      setEditingChannel(null);
    } catch (error) {
      console.error('Failed to update channel:', error);
      alert('Failed to update channel: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (!confirm(`Are you sure you want to delete "${channel.name}"? This will delete all messages in this channel.`)) {
      return;
    }

    try {
      await api.delete(`/channels/${channel.id}`);
      setContextMenu(null);
      // If we're deleting the active channel, clear selection
      if (activeChannelId === channel.id) {
        const remainingChannels = channels.filter(c => c.id !== channel.id);
        if (remainingChannels.length > 0) {
          onSelectChannel(remainingChannels[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
      alert('Failed to delete channel: ' + (error.response?.data?.error || error.message));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, channel) => {
    setDraggedChannel(channel);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, channel) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedChannel && channel.id !== draggedChannel.id) {
      setDragOverChannel(channel);
    }
  };

  const handleDragLeave = () => {
    setDragOverChannel(null);
  };

  const handleDrop = async (e, targetChannel) => {
    e.preventDefault();

    if (!draggedChannel || draggedChannel.id === targetChannel.id) {
      setDraggedChannel(null);
      setDragOverChannel(null);
      return;
    }

    try {
      // Reorder channels
      const reorderedChannels = [...channels];
      const draggedIndex = reorderedChannels.findIndex(c => c.id === draggedChannel.id);
      const targetIndex = reorderedChannels.findIndex(c => c.id === targetChannel.id);

      // Remove dragged channel and insert at target position
      const [removed] = reorderedChannels.splice(draggedIndex, 1);
      reorderedChannels.splice(targetIndex, 0, removed);

      // Update order for all affected channels
      const updatePromises = reorderedChannels.map((channel, index) =>
        api.patch(`/channels/${channel.id}`, { order: index + 1 })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to reorder channels:', error);
      alert('Failed to reorder channels: ' + (error.response?.data?.error || error.message));
    } finally {
      setDraggedChannel(null);
      setDragOverChannel(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedChannel(null);
    setDragOverChannel(null);
  };

  return (
    <div className="w-64 bg-discord-dark flex flex-col border-r border-discord-gray">
      {/* Header */}
      <div className="p-4 border-b border-discord-gray">
        <h1 className="text-xl font-bold text-discord-text">Stashu</h1>
        <p className="text-xs text-discord-muted">{user?.email}</p>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold text-discord-muted uppercase">
            Channels
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 rounded hover:bg-discord-gray text-discord-muted hover:text-discord-text transition-colors"
            title="Create new channel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {channels.map((channel) => (
          <button
            key={channel.id}
            draggable
            onDragStart={(e) => handleDragStart(e, channel)}
            onDragOver={(e) => handleDragOver(e, channel)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, channel)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectChannel(channel.id)}
            onContextMenu={(e) => handleContextMenu(e, channel)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg mb-1
              transition-colors duration-150 cursor-move
              ${
                activeChannelId === channel.id
                  ? 'bg-discord-gray text-white'
                  : 'text-discord-muted hover:bg-discord-gray hover:text-white'
              }
              ${draggedChannel?.id === channel.id ? 'opacity-50' : ''}
              ${dragOverChannel?.id === channel.id ? 'border-2 border-discord-accent' : ''}
            `}
          >
            <span className="text-2xl">{channel.icon}</span>
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium truncate">{channel.name}</p>
              <p className="text-xs text-discord-muted">
                {channel.messageCount || 0} messages
              </p>
            </div>
          </button>
        ))}

        {channels.length === 0 && (
          <div className="text-center py-8 px-4">
            <p className="text-discord-muted text-sm">
              No channels yet. Create one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Create Channel Button */}
      <div className="p-4 border-t border-discord-gray">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2 bg-discord-accent hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
        >
          + New Channel
        </button>
        <button
          onClick={logout}
          className="w-full mt-2 py-2 bg-discord-gray hover:bg-discord-lightgray text-discord-text rounded-lg font-medium transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-discord-dark border border-discord-gray rounded-lg shadow-lg py-2 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={() => handleEditChannel(contextMenu.channel)}
            className="w-full px-4 py-2 text-left text-discord-text hover:bg-discord-gray flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Channel
          </button>
          <button
            onClick={() => handleDeleteChannel(contextMenu.channel)}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-discord-gray flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Channel
          </button>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-dark rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-discord-text mb-4">
              Create Channel
            </h2>

            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-discord-muted uppercase mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., Ideas, Links, Notes"
                  className="input-field w-full"
                  autoFocus
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-discord-muted uppercase mb-2">
                  Icon (Emoji)
                </label>
                <div className="flex gap-2">
                  {['💬', '💡', '🔗', '📝', '📷', '📁', '⭐', '🎯'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewChannelIcon(emoji)}
                      className={`
                        text-2xl p-2 rounded-lg transition-colors
                        ${
                          newChannelIcon === emoji
                            ? 'bg-discord-accent'
                            : 'bg-discord-gray hover:bg-discord-lightgray'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewChannelName('');
                    setNewChannelIcon('💬');
                  }}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={creating || !newChannelName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {showEditModal && editingChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-dark rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-discord-text mb-4">
              Edit Channel
            </h2>

            <form onSubmit={handleUpdateChannel}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-discord-muted uppercase mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                  placeholder="e.g., Ideas, Links, Notes"
                  className="input-field w-full"
                  autoFocus
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-discord-muted uppercase mb-2">
                  Icon (Emoji)
                </label>
                <div className="flex gap-2">
                  {['💬', '💡', '🔗', '📝', '📷', '📁', '⭐', '🎯'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditChannelIcon(emoji)}
                      className={`
                        text-2xl p-2 rounded-lg transition-colors
                        ${
                          editChannelIcon === emoji
                            ? 'bg-discord-accent'
                            : 'bg-discord-gray hover:bg-discord-lightgray'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingChannel(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={updating || !editChannelName.trim()}
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
