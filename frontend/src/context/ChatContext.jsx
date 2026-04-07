import React, { createContext, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const ChatContext = createContext();
const DELETED_CONVERSATIONS_KEY = 'deletedConversationsHidden';

const readHiddenConversationIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_CONVERSATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

const persistHiddenConversationIds = (ids) => {
  localStorage.setItem(DELETED_CONVERSATIONS_KEY, JSON.stringify(Array.from(new Set(ids))));
};

export const ChatProvider = ({ children }) => {
const { authFetch, apiBase, user } = useAuth();

  const inferAttachmentType = (attachment = {}) => {
    const explicitType = attachment.type || attachment.fileType || '';
    if (explicitType) return explicitType;

    const source = `${attachment.url || attachment.fileUrl || attachment.filePath || attachment.path || attachment.name || ''}`.toLowerCase();
    if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)/.test(source)) return 'image';
    if (/(\.mp4|\.webm|\.mov|\.mkv|\.avi)/.test(source)) return 'video';
    if (/(\.mp3|\.wav|\.ogg|\.aac|\.m4a)/.test(source)) return 'audio';
    if (/\.pdf/.test(source)) return 'pdf';
    return 'file';
  };

  const normalizeAttachment = (attachment = {}) => ({
    url: attachment.url || attachment.fileUrl || attachment.filePath || attachment.path || '',
    type: inferAttachmentType(attachment),
    name: attachment.name || attachment.fileName || '',
    size: attachment.size || attachment.fileSize || 0,
  });

  const normalizeMessage = useCallback((raw = {}) => {
    const normalizedAttachments = Array.isArray(raw.attachments)
      ? raw.attachments.map(normalizeAttachment).filter((att) => !!att.url)
      : [];

    const normalizedFileUrl = raw.fileUrl || raw.url || raw.filePath || '';

    if (normalizedFileUrl && !normalizedAttachments.some((att) => att.url === normalizedFileUrl)) {
      normalizedAttachments.unshift(
        normalizeAttachment({
          url: normalizedFileUrl,
          type: raw.type,
          name: raw.fileName,
          size: raw.fileSize,
        })
      );
    }

    return {
      ...raw,
      content: raw.content || raw.message || '',
      message: raw.message || raw.content || '',
      type: raw.type || (normalizedAttachments[0]?.type || 'text'),
      fileUrl: normalizedFileUrl,
      fileName: raw.fileName || normalizedAttachments[0]?.name || '',
      fileSize: raw.fileSize || normalizedAttachments[0]?.size || 0,
      attachments: normalizedAttachments,
    };
  }, []);

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const filterHiddenConversations = useCallback((items = []) => {
    const hiddenIds = new Set(readHiddenConversationIds());
    if (hiddenIds.size === 0) return items;
    return items.filter((conv) => !hiddenIds.has(conv?._id) && !hiddenIds.has(conv?.conversationId));
  }, []);

  // ===========================
  // FETCH CONVERSATIONS
  // ===========================
  const fetchConversations = useCallback(async (limit = 20, skip = 0) => {
    if (!user?.id) {
      console.log('User not authenticated, skipping conversations fetch');
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = `chat/conversations?limit=${limit}&skip=${skip}`;
      const response = await authFetch(endpoint);
      const data = await response.json();

      setConversations(filterHiddenConversations(data.conversations || []));

    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Error fetching conversations');

    } finally {
      setLoading(false);
    }
  }, [authFetch, user, filterHiddenConversations]);

  // ===========================
  // SEARCH CONVERSATIONS
  // ===========================
  const searchConversations = useCallback(async (query) => {
    if (!user?.id) {
      console.log('User not authenticated, skipping search');
      setConversations([]);
      setLoading(false);
      return;
    }

    // Guard: Don't make API call if query is empty
    if (!query || !query.trim()) {
      console.log('Empty search query, fetching all conversations instead');
      return fetchConversations(20, 0);
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = `chat/conversations/search?query=${encodeURIComponent(query)}`;
      const response = await authFetch(endpoint);
      const data = await response.json();

      setConversations(filterHiddenConversations(data.conversations || []));

    } catch (err) {
      console.error('Error searching conversations:', err);
      setError(err.message || 'Error searching conversations');

    } finally {
      setLoading(false);
    }
  }, [authFetch, user, fetchConversations, filterHiddenConversations]);

  // ===========================
  // GET / CREATE CONVERSATION
  // ===========================
  const getOrCreateConversation = useCallback(async (jobId, workerId = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = workerId ? { workerId } : {};
      const response = await authFetch(`chat/conversation/${jobId}`, {
        params,
      });
      const data = await response.json();

      setCurrentConversation(data.conversation);
      setMessages([]);
      return data.conversation;

    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Error creating conversation');
      return null;

    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // ===========================
  // FETCH CHAT HISTORY
  // ===========================
  const fetchChatHistory = useCallback(async (conversationId, limit = 50, skip = 0) => {
    // Guard: Check if conversationId is valid
    if (!conversationId) {
      console.warn('fetchChatHistory called without conversationId');
      setMessages([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // Build URL with query parameters
      const endpoint = `chat/history/${conversationId}?limit=${limit}&skip=${skip}`;
      console.log('📥 Fetching chat history from:', endpoint);
      
      const response = await authFetch(endpoint);
      
      // authFetch already handles error responses, so if we get here, response is ok
      const data = await response.json();
      console.log('✓ Chat history loaded:', data.messages?.length, 'messages');

      const normalizedMessages = (data.messages || []).map(normalizeMessage);
      setMessages(normalizedMessages);
      return normalizedMessages;

    } catch (err) {
      console.error('❌ Error fetching chat history:', err.message);
      setMessages([]);
      return [];

    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // ===========================
  // SEARCH MESSAGES
  // ===========================
  const searchMessages = useCallback(async (conversationId, query) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = `chat/history/${conversationId}/search?query=${encodeURIComponent(query)}`;
      const response = await authFetch(endpoint);
      const data = await response.json();

      setMessages(data.messages || []);

    } catch (err) {
      console.error('Error searching messages:', err);
      setError(err.message || 'Error searching messages');

    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // ===========================
  // MARK AS READ
  // ===========================
  const markAsRead = useCallback(async (conversationId) => {
    // Guard: Check if conversationId is valid
    if (!conversationId) {
      console.warn('markAsRead called without conversationId');
      return;
    }

    try {
      const endpoint = `chat/read/${conversationId}`;
      console.log('Marking conversation as read:', endpoint);
      
      const response = await authFetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send empty object as body
      });
      
      if (!response.ok) {
        console.warn(`Failed to mark as read: HTTP ${response.status}`);
        return;
      }
      
      console.log('✓ Marked as read successfully');
    } catch (err) {
      // Silently fail for read operations - they're not critical
      console.debug('Debug: Error marking messages as read:', err.message);
    }
  }, [authFetch]);

  // ===========================
  // BLOCK USER
  // ===========================
  const blockUser = useCallback(async (blockedId, reason = 'other', reasonDetails = '') => {
    try {
      const response = await authFetch('chat/block', {
        method: 'POST',
        body: JSON.stringify({ blockedId, reason, reasonDetails }),
      });
      const data = await response.json();
      return data;

    } catch (err) {
      console.error('Error blocking user:', err);
      return null;
    }
  }, [authFetch]);

  // ===========================
  // UNBLOCK USER
  // ===========================
  const unblockUser = useCallback(async (blockedId) => {
    try {
      const response = await authFetch(`chat/block/${blockedId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;

    } catch (err) {
      console.error('Error unblocking user:', err);
      return null;
    }
  }, [authFetch]);

  // ===========================
  // GET UNREAD COUNT
  // ===========================
  const getUnreadCount = useCallback(async () => {
    try {
      const response = await authFetch('chat/unread-count');
      const data = await response.json();
      return data.unreadCount;

    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  }, [authFetch]);

  // ===========================
  // MUTE CONVERSATION
  // ===========================
  const muteConversation = useCallback(async (conversationId) => {
    try {
      const response = await authFetch(`chat/mute/${conversationId}`, {
        method: 'PUT',
      });
      const data = await response.json();
      return data;

    } catch (err) {
      console.error('Error muting conversation:', err);
      return null;
    }
  }, [authFetch]);

  // ===========================
  // UNMUTE CONVERSATION
  // ===========================
  const unmuteConversation = useCallback(async (conversationId) => {
    try {
      const response = await authFetch(`chat/unmute/${conversationId}`, {
        method: 'PUT',
      });
      const data = await response.json();
      return data;

    } catch (err) {
      console.error('Error unmuting conversation:', err);
      return null;
    }
  }, [authFetch]);

  // ===========================
  // CLEAR CHAT
  // ===========================
  const clearChat = useCallback(async (conversationId) => {
    try {
      const response = await authFetch(`chat/clear/${conversationId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      // Clear messages from state
      setMessages([]);
      return data;

    } catch (err) {
      console.error('Error clearing chat:', err);
      return null;
    }
  }, [authFetch, setMessages]);

  // ===========================
  // DELETE CONVERSATION
  // ===========================
  const deleteConversation = useCallback(async (conversationRef) => {
    const requestedId =
      typeof conversationRef === 'string'
        ? conversationRef
        : (conversationRef?.conversationId || conversationRef?._id || conversationRef?.id || '');

    if (!requestedId) {
      return { success: false, msg: 'Conversation ID is required' };
    }

    const matchingConversation = conversations.find(
      (conv) =>
        conv?._id === requestedId ||
        conv?.conversationId === requestedId ||
        conv?._id === conversationRef?._id ||
        conv?.conversationId === conversationRef?.conversationId
    );

    const deleteCandidates = [
      requestedId,
      matchingConversation?.conversationId,
      matchingConversation?._id,
    ].filter((value, index, arr) => value && arr.indexOf(value) === index);

    const hideConversationLocally = () => {
      const hiddenIds = readHiddenConversationIds();
      persistHiddenConversationIds([...hiddenIds, ...deleteCandidates]);
      setConversations((prev) =>
        prev.filter((conv) => !deleteCandidates.includes(conv._id) && !deleteCandidates.includes(conv.conversationId))
      );
      setMessages([]);
      if (currentConversation && deleteCandidates.includes(currentConversation._id || currentConversation.conversationId)) {
        setCurrentConversation(null);
      }
    };

    let data = null;
    let lastError = null;

    for (const candidateId of deleteCandidates) {
      try {
        const response = await authFetch(`chat/delete/${candidateId}`, {
          method: 'DELETE',
        });
        data = await response.json();
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!data?.success) {
      console.error('Error deleting conversation:', lastError || data);
      // Fallback: persistently hide on client even if backend returns 500.
      hideConversationLocally();
      return {
        success: true,
        localOnly: true,
        msg: 'Conversation hidden permanently in this app. Backend delete failed.',
      };
    }

    hideConversationLocally();

    // Re-sync from server so deleted conversations do not reappear after refresh.
    await fetchConversations(20, 0);

    return data;
  }, [authFetch, conversations, setConversations, setMessages, currentConversation, fetchConversations]);

  // ===========================
  // Non-API helpers (unchanged)
  // ===========================
  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      if (!message) return prev;
      const normalizedIncoming = normalizeMessage(message);
      const incomingId = normalizedIncoming._id ? String(normalizedIncoming._id) : '';

      if (incomingId && prev.some((msg) => msg?._id && String(msg._id) === incomingId)) {
        return prev;
      }

      return [...prev, normalizedIncoming];
    });
  }, [normalizeMessage]);

  const updateMessageStatus = useCallback((messageId, status) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, status } : msg
      )
    );
  }, []);

  const value = {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    loading,
    error,
    unreadCount,
    setUnreadCount,
    typingUsers,
    setTypingUsers,
    onlineUsers,
    setOnlineUsers,
    fetchConversations,
    searchConversations,
    getOrCreateConversation,
    fetchChatHistory,
    searchMessages,
    addMessage,
    updateMessageStatus,
    markAsRead,
    blockUser,
    unblockUser,
    getUnreadCount,
    muteConversation,
    unmuteConversation,
    clearChat,
    deleteConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

