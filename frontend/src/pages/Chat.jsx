import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { initializeSocket } from '../utils/socketClient';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import './Chat.css';
import { useTranslation } from 'react-i18next';

const CHAT_SELECTION_STORAGE_KEY = 'activeChatSelection';

const ChatPageContent = () => {
  const { t } = useTranslation();
  const { user, apiBase } = useAuth();
  const { fetchConversations, setCurrentConversation, conversations, setConversations } = useChat();
  const [selectedConversation, setSelectedConversation] = useState(() => {
    const savedSelection = sessionStorage.getItem(CHAT_SELECTION_STORAGE_KEY);
    if (!savedSelection) return null;

    try {
      const parsed = JSON.parse(savedSelection);
      return parsed.conversationId || null;
    } catch (error) {
      console.error('Failed to parse saved chat selection:', error);
      return null;
    }
  });
  const [selectedJobId, setSelectedJobId] = useState(() => {
    const savedSelection = sessionStorage.getItem(CHAT_SELECTION_STORAGE_KEY);
    if (!savedSelection) return null;

    try {
      const parsed = JSON.parse(savedSelection);
      return parsed.jobId || null;
    } catch (error) {
      return null;
    }
  });
  const [isMobileViewChat, setIsMobileViewChat] = useState(() => {
    const savedSelection = sessionStorage.getItem(CHAT_SELECTION_STORAGE_KEY);
    return !!savedSelection;
  });

  // Initialize socket and fetch conversations
  useEffect(() => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) token = token.replace(/^"|"$/g, ''); // Strip quotes if saved via JSON.stringify
    if (token && user) {
      const socket = initializeSocket(token, apiBase);
      fetchConversations();

      // Listen for real-time conversation updates (new messages in sidebar)
      socket.on('conversationUpdated', (updatedConversation) => {
        console.log('📌 conversationUpdated event received:', updatedConversation);
        
        setConversations((prevConversations) => {
          // Check if conversation already exists
          const existingIndex = prevConversations.findIndex(
            (conv) => conv._id === updatedConversation._id
          );

          if (existingIndex >= 0) {
            // Update existing conversation
            const updated = [...prevConversations];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...updatedConversation,
              lastMessage: updatedConversation.lastMessage,
            };
            // Move to top (most recent)
            const [conv] = updated.splice(existingIndex, 1);
            return [conv, ...updated];
          } else {
            // Add new conversation at top
            return [updatedConversation, ...prevConversations];
          }
        });
      });

      return () => {
        socket.off('conversationUpdated');
      };
    }
  }, [user, fetchConversations, setConversations, apiBase]);

  useEffect(() => {
    if (!selectedConversation) {
      sessionStorage.removeItem(CHAT_SELECTION_STORAGE_KEY);
      return;
    }

    const activeConversation =
      conversations.find(
        (conversation) =>
          conversation._id === selectedConversation ||
          conversation.conversationId === selectedConversation
      ) || null;

    if (activeConversation) {
      setCurrentConversation(activeConversation);
      setSelectedJobId(activeConversation.jobId?._id || activeConversation.jobId || selectedJobId || null);
    }

    sessionStorage.setItem(
      CHAT_SELECTION_STORAGE_KEY,
      JSON.stringify({
        conversationId: selectedConversation,
        jobId: activeConversation?.jobId?._id || activeConversation?.jobId || selectedJobId || null,
      })
    );
  }, [selectedConversation, selectedJobId, conversations, setCurrentConversation]);

  const handleSelectConversation = (conversationId, jobId, conversationData) => {
    setSelectedConversation(conversationId);
    setSelectedJobId(jobId);
    // Set the full conversation data in ChatContext so ChatWindow can use it immediately
    if (conversationData) {
      setCurrentConversation(conversationData);
    }
    sessionStorage.setItem(
      CHAT_SELECTION_STORAGE_KEY,
      JSON.stringify({ conversationId, jobId })
    );
    setIsMobileViewChat(true);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    setSelectedJobId(null);
    setCurrentConversation(null);
    setIsMobileViewChat(false);
    sessionStorage.removeItem(CHAT_SELECTION_STORAGE_KEY);
  };

  const handleRefreshConversations = () => {
    fetchConversations();
  };

  if (!user) {
    return (
      <div className="chat-page-unauthorized">
        <p>{t('chatPage.loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="chat-page-container">
      {/* Conversations List - Hidden on mobile if chat is open */}
      <div
        className={`conversations-panel ${
          isMobileViewChat ? 'hidden-mobile' : ''
        }`}
      >
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation}
        />
      </div>

      {/* Chat Window - Hidden on mobile if no chat selected */}
      <div className={`chat-panel ${!selectedConversation ? 'hidden-mobile' : ''}`}>
        {selectedConversation ? (
          <ChatWindow
            jobId={selectedJobId}
            conversationId={selectedConversation}
            onClose={handleCloseChat}
          />
        ) : (
          <div className="no-conversation-selected">
            <div className="empty-message">
              <h2>{t('chatPage.selectConversation')}</h2>
              <p>{t('chatPage.selectConversationHint')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPageContent;
