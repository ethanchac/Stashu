import { useState, useRef } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import api from '../../services/api';

export default function MessageInput({ channelId }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { uploadFile, uploading, progress } = useFileUpload();
  const fileInputRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      await api.post(`/channels/${channelId}/messages`, {
        content: message.trim(),
        type: 'text'
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload file to S3
      const { s3Key, fileMetadata } = await uploadFile(file);

      // Determine message type based on file MIME type
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';

      // Send message with file reference
      await api.post(`/channels/${channelId}/messages`, {
        content: file.name,
        type: messageType,
        fileRef: s3Key,
        fileMetadata
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    }
  };

  return (
    <div className="border-t border-discord-gray p-4 bg-discord-dark">
      {uploading && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm text-discord-muted mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-discord-gray rounded-full h-2">
            <div
              className="bg-discord-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.txt,.zip,.doc,.docx"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending}
          className="p-3 bg-discord-gray hover:bg-discord-lightgray text-discord-text rounded-lg transition-colors disabled:opacity-50"
          title="Upload file"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1"
          disabled={uploading || sending}
        />

        <button
          type="submit"
          disabled={!message.trim() || uploading || sending}
          className="px-6 bg-discord-accent hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      <p className="text-xs text-discord-muted mt-2">
        Press Enter to send • Supports images, PDFs, and documents
      </p>
    </div>
  );
}
