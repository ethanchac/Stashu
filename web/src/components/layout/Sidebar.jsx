import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Sidebar({ channels, activeChannelId, onSelectChannel }) {
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('💬');
  const [creating, setCreating] = useState(false);

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
            onClick={() => onSelectChannel(channel.id)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg mb-1
              transition-colors duration-150
              ${
                activeChannelId === channel.id
                  ? 'bg-discord-gray text-white'
                  : 'text-discord-muted hover:bg-discord-gray hover:text-white'
              }
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
    </div>
  );
}
