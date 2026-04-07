import React from 'react';
import './MessageStatus.css';

/**
 * MessageStatus Component
 * Shows message delivery status (sending, sent, delivered, seen)
 */
const MessageStatus = ({ 
  status = 'sent', // 'sending', 'sent', 'delivered', 'seen'
  timestamp = null,
  isDarkMode = false,
}) => {
  const statusConfig = {
    sending: {
      icon: '⏳',
      label: 'Sending...',
      className: 'status-sending',
    },
    sent: {
      icon: '✓',
      label: 'Sent',
      className: 'status-sent',
    },
    delivered: {
      icon: '✓✓',
      label: 'Delivered',
      className: 'status-delivered',
    },
    seen: {
      icon: '✓✓',
      label: 'Seen',
      className: 'status-seen',
    },
  };

  const config = statusConfig[status] || statusConfig.sent;

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffMinutes = Math.floor((now - messageDate) / 60000);

    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return messageDate.toLocaleDateString();
  };

  return (
    <div className={`message-status ${config.className} ${isDarkMode ? 'dark' : ''}`}>
      <span className="status-icon">{config.icon}</span>
      {timestamp && (
        <span className="status-time">{formatTime(timestamp)}</span>
      )}
    </div>
  );
};

export default MessageStatus;
