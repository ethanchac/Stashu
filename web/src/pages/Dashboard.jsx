import { useState, useEffect } from 'react';
import { useChannels } from '../hooks/useChannels';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/layout/ChatWindow';

export default function Dashboard() {
  const { channels, loading } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState(null);

  // Auto-select first channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-discord-darker">
        <div className="text-discord-text text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-discord-darker">
      {/* Sidebar - Channel List */}
      <Sidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
      />

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeChannelId ? (
          <ChatWindow channelId={activeChannelId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-discord-muted text-lg mb-4">
                {channels.length === 0
                  ? 'Create your first channel to get started'
                  : 'Select a channel from the sidebar'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
