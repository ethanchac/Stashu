import { useState } from 'react';
import api from '../../services/api';

export default function MessageItem({ message, channelId }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;

    try {
      setDeleting(true);
      await api.delete(`/channels/${channelId}/messages/${message.id}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
      setDeleting(false);
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
          <div className="mt-2">
            <img
              src={message.fileRef}
              alt={message.content}
              className="max-w-md rounded-lg border border-discord-gray"
              loading="lazy"
            />
            <p className="text-sm text-discord-muted mt-1">{message.content}</p>
          </div>
        );

      case 'file':
        return (
          <div className="mt-2 flex items-center gap-3 p-3 bg-discord-darker rounded-lg border border-discord-gray max-w-md">
            <svg
              className="w-8 h-8 text-discord-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{message.content}</p>
              {message.fileMetadata && (
                <p className="text-xs text-discord-muted">
                  {(message.fileMetadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <a
              href={message.fileRef}
              download
              className="text-discord-accent hover:underline text-sm"
            >
              Download
            </a>
          </div>
        );

      case 'link':
        return (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-discord-accent hover:underline break-all"
          >
            {message.content}
          </a>
        );

      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div
      className={`
        group relative p-4 rounded-lg transition-colors
        ${message.isPinned ? 'bg-discord-accent/10 border-l-4 border-discord-accent' : 'hover:bg-discord-dark'}
        ${deleting ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-discord-muted">
              {formatDate(message.createdAt)}
            </span>
            {message.isPinned && (
              <span className="text-xs bg-discord-accent px-2 py-0.5 rounded text-white">
                Pinned
              </span>
            )}
            {message.tags && message.tags.length > 0 && (
              <div className="flex gap-1">
                {message.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-discord-gray px-2 py-0.5 rounded text-discord-text"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-discord-text">{renderContent()}</div>

          {message.deviceInfo && (
            <p className="text-xs text-discord-muted mt-1">
              {message.deviceInfo.platform}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 hover:bg-red-500/20 rounded text-red-500 transition-colors"
            title="Delete message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
