import React from 'react';
import ChatPageContent from './Chat';
import './Messages.css';

/**
 * Messages Page Component
 * Displays conversation list and chat interface
 * Route: /messages
 */
const MessagesPage = () => {
  return (
    <div className="messages-page">
      <ChatPageContent />
    </div>
  );
};

export default MessagesPage;
