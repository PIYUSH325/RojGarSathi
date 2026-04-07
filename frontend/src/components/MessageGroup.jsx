import React from 'react';
import './MessageGroup.css';
import ChatMessage from './ChatMessage';
import { useTranslation } from 'react-i18next';

/**
 * MessageGroup Component
 * Groups consecutive messages from the same sender
 */
const MessageGroup = ({
  messages = [],
  isCurrentUser = false,
  isDarkMode = false,
  otherUser = null,
  apiBase = '',
  onReact,
  onReply,
}) => {
  const { t } = useTranslation();
  if (!messages.length) return null;

  return (
    <div className={`message-group ${isCurrentUser ? 'sent' : 'received'} ${isDarkMode ? 'dark' : ''}`}>
      {messages.map((message, index) => (
        <div
          key={message._id || index}
          className={`message-item ${index === messages.length - 1 ? 'last' : ''} ${index === 0 ? 'first' : ''}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="message-bubble-wrapper">
            <ChatMessage
              message={message}
              isOwn={isCurrentUser}
              otherUser={otherUser}
              apiBase={apiBase}
            />
          </div>

          <div className="message-actions">
            <button
              className="action-btn reaction-btn"
              onClick={() => onReact?.(message._id)}
              title={t('messageGroup.reactWithEmoji')}
              aria-label={t('messageGroup.reactWithEmoji')}
            >
              😊
            </button>
            <button
              className="action-btn reply-btn"
              onClick={() => onReply?.(message._id)}
              title={t('messageGroup.replyToMessage')}
              aria-label={t('messageGroup.replyToMessage')}
            >
              ↩️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageGroup;