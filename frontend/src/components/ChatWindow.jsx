import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  initializeSocket,
  joinRoom,
  leaveRoom,
  sendMessage as emitSendMessage,
  startTyping,
  stopTyping,
  onMessageReceived,
  onTypingStart,
  onTypingStop,
  onMessageRead,
  markAsRead as emitMarkAsRead,
  onUserOnline,
  onUserOffline,
  onSocketError,
  removeListener,
} from '../utils/socketClient';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import DateSeparator from './DateSeparator';
import TypingIndicator from './TypingIndicator';
import { getAvatarUrl } from '../utils/photoUrl';
import './ChatWindow.css';
import { MoreVertical, Phone, Video, Search, X, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatWindow = ({ jobId, conversationId, onClose }) => {
  const { t } = useTranslation();
  const { user, apiBase } = useAuth();
  const { isDarkMode } = useTheme();
  const {
    currentConversation,
    messages,
    addMessage,
    fetchChatHistory,
    markAsRead,
    unblockUser,
    error,
    setError = () => {},
  } = useChat();

  const [loading, setLoading] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const isInitialLoad = useRef(true);

  const getIdString = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value._id) return String(value._id);
      if (value.id) return String(value.id);
    }
    return String(value);
  }, []);

  // Helper function to group messages by sender and date
  const groupMessagesBySenderAndDate = useCallback((msgs) => {
    const groups = [];
    let currentGroup = null;

    msgs.forEach((message) => {
      const messageDate = new Date(message.createdAt || message.timestamp).toDateString();
      const senderId = getIdString(message.senderId);
      const currentUserId = getIdString(user?._id || user?.id);
      const isCurrentUser = senderId !== '' && currentUserId !== '' && senderId === currentUserId;

      if (
        !currentGroup ||
        currentGroup.senderId !== senderId ||
        currentGroup.date !== messageDate
      ) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          senderId,
          isCurrentUser,
          date: message.createdAt || message.timestamp,
          messages: [message],
        };
      } else {
        currentGroup.messages.push(message);
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [user?._id, user?.id, getIdString]);

  // === INITIALIZE SOCKET CONNECTION (AFTER LOGIN) ===
  useEffect(() => {
    isInitialLoad.current = true;

    // Step 1: Get and validate token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn('[ChatWindow] ⚠️ No token - user not authenticated');
      console.warn('[ChatWindow] localStorage token:', localStorage.getItem('token') ? `exists (${localStorage.getItem('token').length} chars)` : 'missing');
      console.warn('[ChatWindow] sessionStorage token:', sessionStorage.getItem('token') ? `exists (${sessionStorage.getItem('token').length} chars)` : 'missing');
      setError(t('chatWindow.loginRequired'));
      return;
    }

    console.log('[ChatWindow] Token found - length:', token.length, 'First 30 chars:', token.substring(0, 30) + '...');
    
    // Step 2: Initialize socket with token
    console.log('[ChatWindow] 🔐 Initializing socket with authentication');
    const socketInstance = initializeSocket(token, apiBase);
    
    if (!socketInstance) {
      console.error('[ChatWindow] ❌ Failed to initialize socket');
      setError('Failed to initialize chat connection');
      return;
    }

    console.log('[ChatWindow] Socket instance created - checking connection status');
    console.log('[ChatWindow] Socket connected:', socketInstance.connected);
    console.log('[ChatWindow] Socket auth:', socketInstance.auth);

    // Step 3: Wait for socket to be ready, then join room
    const checkSocketReady = () => {
      if (socketInstance.connected) {
        console.log('[ChatWindow] ✅ Socket ready, joining room');
        if (conversationId && jobId) {
          joinRoom(conversationId, jobId);
          fetchChatHistory(conversationId, 50, 0);
          markAsRead(conversationId);
        }
      } else {
        console.log('[ChatWindow] ⏳ Waiting for socket connection... (connected:', socketInstance.connected + ')');
        setTimeout(checkSocketReady, 500);
      }
    };

    // If already connected, join immediately. Otherwise wait.
    if (socketInstance.connected) {
      checkSocketReady();
    } else {
      socketInstance.once('connect', checkSocketReady);
    }

    // Cleanup
    return () => {
      if (conversationId) {
        leaveRoom(conversationId);
      }
    };
  }, [conversationId, jobId, fetchChatHistory, markAsRead, apiBase]);

  // Set other user information
  useEffect(() => {
    if (currentConversation) {
      const isEmployer = user?.role === 'employer';
      const otherUserData = isEmployer
        ? currentConversation.workerId
        : currentConversation.employerId;
      setOtherUser(otherUserData);
      setIsOnline(false); // Default to offline, will be updated by socket
    }
  }, [currentConversation, user?.role]);

  // Listen to socket events
  useEffect(() => {
    // Handle incoming messages
    const handleMessageReceived = (data) => {
      console.log('📬 [socket] messageReceived event:', data);
      console.log('   Current conversationId:', conversationId);
      console.log('   Message conversationId:', data.conversationId);
      console.log('   Match:', data.conversationId === conversationId);
      
      if (data.conversationId === conversationId) {
        console.log('✅ Message matches current conversation, adding to state');
        addMessage(data);
        
        // Mark as read if we're the receiver
        const senderId = getIdString(data.senderId);
        const currentUserId = getIdString(user?._id || user?.id);
        if (senderId && currentUserId && senderId !== currentUserId) {
          emitMarkAsRead(conversationId, [data._id]);
        }
      } else {
        console.log('⏭️ Message is for different conversation, skipping');
      }
    };

    // Handle typing indicators
    const handleTypingStart = (data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    // Handle message read receipt
    const handleMessageRead = (data) => {
      if (data.conversationId === conversationId) {
        // Update message read status in UI
        // This can be extended to update individual message status
      }
    };

    // Handle user online/offline
    const handleUserOnline = (data) => {
      if (otherUser && data.userId === otherUser._id) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = (data) => {
      if (otherUser && data.userId === otherUser._id) {
        setIsOnline(false);
      }
    };

    // Handle socket errors
    const handleSocketError = (errorData) => {
      console.error('🚨 Socket error received:', errorData);
      console.error('   Error details:', JSON.stringify(errorData, null, 2));
      
      let errorMessage = 'An error occurred with the connection';
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.msg) {
        errorMessage = errorData.msg;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      setError(errorMessage);
    };

    onMessageReceived(handleMessageReceived);
    onTypingStart(handleTypingStart);
    onTypingStop(handleTypingStop);
    onMessageRead(handleMessageRead);
    onUserOnline(handleUserOnline);
    onUserOffline(handleUserOffline);
    onSocketError(handleSocketError);

    return () => {
      removeListener('messageReceived', handleMessageReceived);
      removeListener('typing:start', handleTypingStart);
      removeListener('typing:stop', handleTypingStop);
      removeListener('message:read', handleMessageRead);
      removeListener('userOnline', handleUserOnline);
      removeListener('userOffline', handleUserOffline);
    };
  }, [conversationId, user?._id, user?.id, otherUser, addMessage, getIdString]);

  const scrollToBottom = useCallback((force = false) => {
    if (!containerRef.current) return;
    
    const { scrollHeight, clientHeight, scrollTop } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    // Scroll if forced, near bottom, or on initial load
    if (force === true || isNearBottom || isInitialLoad.current) {
      containerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
      if (scrollHeight > 0) {
        isInitialLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]); // Fixed exhaustive-deps

  const handleSendMessage = async (data) => {
    const { message, content, type, attachments = [] } = data;

    try {
      // === AUTHENTICATION CHECK ===
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.error('[ChatWindow] ❌ not authenticated');
        setError('You must log in to send messages');
        return;
      }

      // === VALIDATION ===
      const normalizedText = String(content || message || '').trim();
      const hasText = normalizedText !== '';
      const hasAttachments = attachments.length > 0;
      const transportText = hasText ? normalizedText : (hasAttachments ? '[Attachment]' : '');

      if (!hasText && !hasAttachments) {
        setError('Message or media is required');
        return;
      }

      if (!conversationId) {
        setError('Conversation ID missing');
        return;
      }

      // === SEND MESSAGE ===
      console.log('[ChatWindow] 📤 Sending message via socket');
      setError(null);
      setLoading(true);
      
      const sent = emitSendMessage(
        conversationId,
        transportText,
        attachments,
        type || (hasText ? 'text' : attachments[0]?.type)
      );
      
      if (!sent) {
        console.error('[ChatWindow] ❌ Socket not ready for sending');
        setError(t('chatWindow.connectionNotReady'));
        setLoading(false);
        return;
      }
      
      console.log('[ChatWindow] ✅ Message sent successfully');
    } catch (err) {
      console.error('[ChatWindow] ❌ Error sending message:', err);
      setError(err.message || t('chatWindow.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (conversationId, isTyping) => {
    if (isTyping) {
      startTyping(conversationId);
    } else {
      stopTyping(conversationId);
    }
  };

  const handleUnblockUser = async () => {
    const blockedId = otherUser?._id;
    if (!blockedId) {
      console.error('User ID not found');
      return;
    }

    if (!window.confirm(t('chatWindow.confirmUnblock', { name: otherUser?.name }))) {
      return;
    }

    try {
      const result = await unblockUser(blockedId);
      if (result?.success) {
        setIsUserBlocked(false);
        alert(t('chatWindow.unblocked', { name: otherUser?.name }));
      } else {
        alert(t('chatWindow.unblockFailed'));
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert(t('chatWindow.unblockError'));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = messages.filter((msg) =>
        String(msg.content || msg.message || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages([]);
    }
  };

  const displayMessages = searchQuery ? filteredMessages : messages;
  const groupedMessages = groupMessagesBySenderAndDate(displayMessages);

  if (!currentConversation || !otherUser) {
    return (
      <div className="chat-window-loading">
        <div className="spinner"></div>
        <p>{t('chatWindow.loadingConversation')}</p>
      </div>
    );
  }

  return (
    <div className={`chat-window ${isDarkMode ? 'dark' : ''}`}>
      {/* Error Banner */}
      {error && (
        <div className="error-banner" style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '12px 16px',
          borderBottom: '1px solid #cc0000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Enhanced Header with new ChatHeader component */}
      <ChatHeader
        conversation={currentConversation}
        user={otherUser}
        onClose={onClose}
        isDarkMode={isDarkMode}
        isUserBlocked={isUserBlocked}
        setIsUserBlocked={setIsUserBlocked}
      />

      {/* Messages Area with MessageGroup and DateSeparator */}
      <div className="messages-container" ref={containerRef}>
        {isUserBlocked && (
          <div className="blocked-notification" style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#fee2e2',
            borderLeft: '4px solid #dc2626',
            borderRadius: '4px',
            color: '#991b1b',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <p>{t('chatWindow.blockedNotice')}</p>
            <p style={{fontSize: '12px', marginTop: '8px'}}>{t('chatWindow.blockedHelp')}</p>
          </div>
        )}
        
        {displayMessages.length === 0 ? (
          <div className="empty-state">
            <p>{t('chatWindow.emptyMessages')}</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx}>
              {groupIdx > 0 && (
                <DateSeparator 
                  date={group.date}
                  isDarkMode={isDarkMode}
                />
              )}

              {group.messages.map((msg, idx) => (
                <ChatMessage
                  key={msg._id || `${groupIdx}-${idx}`}
                  message={msg}
                  isOwn={group.isCurrentUser}
                  otherUser={otherUser}
                  apiBase={apiBase}
                />
              ))}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator 
            userName={otherUser?.name || t('chatWindow.userFallback')}
            isDarkMode={isDarkMode}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Unblock section - shown when user is blocked */}
      {isUserBlocked && (
        <div className="blocked-input-section">
          <div className="blocked-message-banner">
            <Unlock size={18} />
            <p>{t('chatWindow.blockedBanner')}</p>
          </div>
          <button 
            className="btn-unblock-user"
            onClick={handleUnblockUser}
          >
            {t('chatWindow.unblockUser')}
          </button>
        </div>
      )}

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isLoading={loading}
        conversationId={conversationId}
        apiBase={apiBase}
        senderId={getIdString(user?._id || user?.id)}
        receiverId={getIdString(otherUser?._id || otherUser?.id)}
        disabled={isUserBlocked}
      />
    </div>
  );
};

export default ChatWindow;
