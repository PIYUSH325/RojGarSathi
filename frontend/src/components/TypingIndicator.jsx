import React from 'react';
import './TypingIndicator.css';

/**
 * TypingIndicator Component
 * Shows animated typing indicator when someone is typing
 */
const TypingIndicator = ({ userName = 'Someone', isDarkMode = false }) => {
  return (
    <div className={`typing-indicator-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="typing-indicator-shell">
        <div className="typing-indicator-shimmer" aria-hidden="true"></div>
        <div className="typing-indicator">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </div>
      </div>
      {userName && (
        <span className="typing-text">{userName} is typing...</span>
      )}
    </div>
  );
};

export default TypingIndicator;