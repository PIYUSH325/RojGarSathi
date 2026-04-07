import React from 'react';
import { FileText, Video, Music, Download, File } from 'lucide-react';
import { getAvatarUrl, getUploadUrl } from '../utils/photoUrl';
import './ChatMessage.css';

const ChatMessage = ({ message, isOwn, otherUser, apiBase = '' }) => {
  const {
    message: legacyText,
    content,
    type,
    fileUrl,
    fileName,
    fileSize,
    attachments = [],
    createdAt,
    status,
    isRead,
  } = message;

  const text = content || legacyText || '';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText size={18} color="#dc2626" />;
      case 'video':
        return <Video size={18} color="#0891b2" />;
      case 'audio':
        return <Music size={18} color="#0891b2" />;
      default:
        return <File size={18} color="#6b7280" />;
    }
  };

  const mediaList = [];
  if (fileUrl) {
    mediaList.push({
      url: fileUrl,
      type: type || 'text',
      name: fileName || 'Attachment',
      size: fileSize || 0,
    });
  }
  if (attachments.length > 0) {
    mediaList.push(...attachments);
  }

  const formatFileSize = (size) => {
    if (!size) return '';
    if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  };

  const renderMedia = (attachment, idx) => {
    if (!attachment?.url) {
      return null;
    }

    const resolvedUrl = getUploadUrl(attachment.url, apiBase);
    const normalizedType = attachment.type || (() => {
      const source = `${attachment.name || ''} ${attachment.url || ''}`.toLowerCase();
      if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)/.test(source)) return 'image';
      if (/(\.mp4|\.webm|\.mov|\.mkv|\.avi)/.test(source)) return 'video';
      if (/(\.mp3|\.wav|\.ogg|\.aac|\.m4a)/.test(source)) return 'audio';
      if (/\.pdf/.test(source)) return 'pdf';
      return 'file';
    })();

    if (normalizedType === 'image') {
      return (
        <img
          src={resolvedUrl}
          alt={attachment.name || 'Image'}
          className="attachment-image"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }

    if (normalizedType === 'video') {
      return (
        <video
          src={resolvedUrl}
          controls
          preload="metadata"
          className="attachment-video"
        />
      );
    }

    if (normalizedType === 'audio') {
      return (
        <div className="attachment-audio">
          <Music size={16} />
          <audio controls preload="metadata" src={resolvedUrl} className="attachment-audio-player" />
        </div>
      );
    }

    if (normalizedType === 'pdf') {
      return (
        <div className="attachment-pdf-row">
          <div className="attachment-file-icon">{getFileIcon('pdf')}</div>
          <div className="attachment-file-info">
            <span className="attachment-file-name">{attachment.name || 'Document.pdf'}</span>
            <span className="attachment-file-size">{formatFileSize(attachment.size)}</span>
          </div>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="attachment-download-btn"
            download
          >
            <Download size={14} />
            Download
          </a>
        </div>
      );
    }

    return (
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="attachment-file-link"
        title={attachment.name}
      >
        <div className="attachment-file-icon">{getFileIcon(normalizedType)}</div>
        <div className="attachment-file-info">
          <span className="attachment-file-name">{attachment.name || 'Download'}</span>
          <span className="attachment-file-size">{formatFileSize(attachment.size)}</span>
        </div>
      </a>
    );
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    if (isRead) return '✓✓'; // Double checkmark (blue)
    if (status === 'delivered') return '✓✓'; // Double checkmark
    return '✓'; // Single checkmark
  };

  return (
    <div className={`chat-message-container ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && otherUser && (
        <img
          src={getAvatarUrl(otherUser.profilePhoto, 32, apiBase)}
          alt={otherUser.name}
          className="message-avatar"
          title={otherUser.name}
        />
      )}

      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        {mediaList.length > 0 && (
          <div className="message-attachments">
            {mediaList.map((attachment, idx) => (
              <div key={idx} className={`attachment attachment-${attachment.type}`}>
                {renderMedia(attachment, idx)}
              </div>
            ))}
          </div>
        )}

        {text && <p className="message-text">{text}</p>}

        <div className="message-footer">
          <span className="message-time">{formatTime(createdAt)}</span>
          {isOwn && (
            <span className={`status-icon ${isRead ? 'read' : 'sent'}`}>
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
