import { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import MessageItem from '../messages/MessageItem';
import MessageInput from '../messages/MessageInput';

export default function ChatWindow({ channelId }) {
  const { messages, loading } = useMessages(channelId);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-discord-muted">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-discord-muted text-lg mb-2">
                No messages yet
              </p>
              <p className="text-discord-muted text-sm">
                Send your first message to get started
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} channelId={channelId} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput channelId={channelId} />
    </div>
  );
}
