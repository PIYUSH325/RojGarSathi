import io from 'socket.io-client';

// ================================================================
// PRODUCTION-READY SOCKET CLIENT WITH PROPER JWT AUTHENTICATION
// LOCATION: /frontend/src/utils/socketClient.js
// ================================================================

const DEFAULT_SOCKET_URL = process.env.REACT_APP_SOCKET_URL ||
  (process.env.NODE_ENV === 'production'
    ? window.location.origin
    : 'http://localhost:5000');

let socket = null;
let currentSocketUrl = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const resolveSocketUrl = (apiBase) => {
  if (!apiBase) {
    return DEFAULT_SOCKET_URL;
  }

  try {
    const parsed = new URL(apiBase);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (error) {
    console.warn('[SocketClient] Invalid apiBase for socket URL, using default:', apiBase);
    return DEFAULT_SOCKET_URL;
  }
};

/**
 * Retrieve and clean JWT token from storage
 * CRITICAL: This must handle all token storage formats
 */
const getCleanToken = () => {
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    return null;
  }

  // Remove all formatting issues
  token = String(token).trim();
  token = token.replace(/^"|"$/g, '');  // Remove surrounding quotes
  token = token.replace(/^'|'$/g, '');  // Remove single quotes
  token = token.replace(/^Bearer\s+/i, ''); // Remove Bearer prefix
  
  console.log(`[SocketClient] Token retrieved - length: ${token.length}, format: clean`);
  return token;
};

/**
 * MAIN: Initialize Socket.IO connection with JWT authentication
 * MUST be called AFTER successful login
 * @param {string} customToken - Optional token override (for testing)
 * @returns {Object} Socket instance
 */
export const initializeSocket = (customToken, apiBase) => {
  const targetSocketUrl = resolveSocketUrl(apiBase);

  // CRITICAL: Always clean token, even if custom token provided
  let token = customToken ? String(customToken).trim() : getCleanToken();
  
  // Clean custom token if provided
  if (customToken) {
    token = token.replace(/^"|"$/g, '');  // Remove quotes
    token = token.replace(/^'|'$/g, '');  // Remove single quotes
    token = token.replace(/^Bearer\s+/i, ''); // Remove Bearer prefix
    token = token.trim();
    console.log(`[SocketClient] 🧹 Custom token cleaned - length: ${token.length}`);
  }

  // === PREVENT INITIALIZATION WITHOUT TOKEN ===
  if (!token) {
    console.error('[SocketClient] ❌ Cannot initialize socket - no token found');
    console.error('   Make sure user is logged in before initializing socket');
    console.error('[SocketClient] Debug - localStorage.token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
    console.error('[SocketClient] Debug - sessionStorage.token:', sessionStorage.getItem('token') ? 'EXISTS' : 'MISSING');
    return null;
  }

  // === HANDLE EXISTING SOCKET CONNECTION ===
  if (socket) {
    const hasUrlChanged = currentSocketUrl !== targetSocketUrl;
    const hasTokenChanged = socket.auth?.token !== token;

    if (hasUrlChanged) {
      console.log(`[SocketClient] 🌐 Socket URL changed (${currentSocketUrl} -> ${targetSocketUrl}), reconnecting`);
      socket.disconnect();
      socket = null;
      currentSocketUrl = null;
    } else if (hasTokenChanged) {
      console.log('[SocketClient] 🔄 Token updated - reconnecting socket');
      socket.auth = { token };
      socket.disconnect();
      socket.connect();
      console.log(`[SocketClient] ℹ️ Socket already exists - id: ${socket.id}`);
      return socket;
    }
    
    if (socket) {
      console.log(`[SocketClient] ℹ️ Socket already exists - id: ${socket.id}`);
      return socket;
    }
  }

  // === CREATE NEW SOCKET INSTANCE ===
  console.log(`[SocketClient] 🚀 Creating new socket connection to: ${targetSocketUrl}`);
  console.log(`[SocketClient] 🔑 Token being sent - length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...`);

  socket = io(targetSocketUrl, {
    auth: {
      token: token, // Cleaned token only
    },
    transports: ['websocket', 'polling'], // Try websocket first
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    autoConnect: true,
  });
  currentSocketUrl = targetSocketUrl;

  // === EVENT HANDLERS ===
  
  socket.on('connect', () => {
    reconnectAttempts = 0;
    console.log(`✅ [Socket ${socket.id}] Connected successfully`);
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error(`[Socket] ❌ Connection error (attempt ${reconnectAttempts}):`, {
      message: error.message,
      code: error.code,
      data: error.data,
    });

    // Handle specific authentication errors
    if (error.message.includes('Authentication') || 
        error.message.includes('auth') ||
        error.message === '401' ||
        error.code === 'AUTH_ERROR') {
      console.error('[Socket] 🔒 Authentication failed - likely invalid or expired token');
      window.dispatchEvent(new Event('socketAuthError'));
    }

    // After max attempts, stop trying
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Socket] 🚫 Max reconnection attempts reached');
      window.dispatchEvent(new Event('socketMaxRetriesExceeded'));
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn(`⚠️ [Socket] Disconnected - reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`❌ [Socket] Error event:`, error);
    
    // Handle authentication errors from backend
    if (error?.msg && error.msg.includes('logged in')) {
      window.dispatchEvent(new CustomEvent('socketAuthRequired', { detail: error }));
    }
  });

  return socket;
};

/**
 * Check if socket is connected and authenticated
 */
export const isSocketReady = () => {
  if (!socket) {
    console.warn('[SocketClient] Socket not initialized');
    return false;
  }
  
  if (!socket.connected) {
    console.warn('[SocketClient] Socket not connected');
    return false;
  }

  return true;
};

/**
 * Get socket instance (do NOT use for checking if ready)
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket safely
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[SocketClient] 🔌 Disconnecting socket');
    socket.disconnect();
    socket = null;
    currentSocketUrl = null;
  }
};

/**
 * Force refresh socket connection (useful after token update)
 */
export const refreshSocket = async () => {
  console.log('[SocketClient] 🔄 Refreshing socket connection');
  disconnectSocket();
  return initializeSocket();
};

// ================================================================
// EMIT FUNCTIONS - For sending data to server
// ================================================================

/**
 * Join a chat room
 */
export const joinRoom = (conversationId, jobId) => {
  if (!isSocketReady()) {
    console.error('[SocketClient] Cannot join room - socket not ready');
    return false;
  }

  socket.emit('joinRoom', { conversationId, jobId });
  console.log(`[SocketClient] 📍 Sent: joinRoom - conversationId: ${conversationId}`);
  return true;
};

/**
 * Leave a chat room
 */
export const leaveRoom = (conversationId) => {
  if (!socket) return false;
  
  socket.emit('leaveRoom', { conversationId });
  console.log(`[SocketClient] 👋 Sent: leaveRoom - conversationId: ${conversationId}`);
  return true;
};

/**
 * Send a chat message
 * CRITICAL: Requires authentication
 */
export const sendMessage = (conversationId, message, attachments = [], type = null) => {
  // Validation: Allow if either message OR attachments exist
  const normalizedMessage = String(message || '').trim();
  const hasMessage = normalizedMessage !== '';
  const hasAttachments = attachments && attachments.length > 0;
  
  if (!hasMessage && !hasAttachments) {
    console.error('[SocketClient] Cannot send empty message without attachments');
    return false;
  }

  if (!conversationId) {
    console.error('[SocketClient] Conversation ID required');
    return false;
  }

  if (!isSocketReady()) {
    console.error('[SocketClient] ❌ Cannot send message - socket not ready');
    console.error('   Socket status:', {
      exists: !!socket,
      connected: socket?.connected,
      authenticated: socket?.connected === true,
    });
    return false;
  }

  socket.emit('sendMessage', {
    conversationId,
    message: normalizedMessage,
    content: normalizedMessage,
    type,
    attachments,
  });
  
  console.log(`[SocketClient] 📤 Message sent - length: ${normalizedMessage.length}, attachments: ${attachments.length}`);
  return true;
};

/**
 * Start typing indicator
 */
export const startTyping = (conversationId) => {
  if (!isSocketReady()) return false;
  socket.emit('typing:start', { conversationId });
  return true;
};

/**
 * Stop typing indicator
 */
export const stopTyping = (conversationId) => {
  if (!isSocketReady()) return false;
  socket.emit('typing:stop', { conversationId });
  return true;
};

/**
 * Mark messages as read
 */
export const markAsRead = (conversationId, messageIds = []) => {
  if (!isSocketReady()) return false;
  socket.emit('message:read', { conversationId, messageIds });
  return true;
};

// ================================================================
// LISTEN FUNCTIONS - For receiving data from server
// ================================================================

export const onMessageReceived = (callback) => {
  if (socket) socket.on('messageReceived', callback);
};

export const onTypingStart = (callback) => {
  if (socket) socket.on('typing:start', callback);
};

export const onTypingStop = (callback) => {
  if (socket) socket.on('typing:stop', callback);
};

export const onMessageRead = (callback) => {
  if (socket) socket.on('message:read', callback);
};

export const onUserOnline = (callback) => {
  if (socket) socket.on('userOnline', callback);
};

export const onUserOffline = (callback) => {
  if (socket) socket.on('userOffline', callback);
};

export const onUserJoinedRoom = (callback) => {
  if (socket) socket.on('userJoinedRoom', callback);
};

export const onUserLeftRoom = (callback) => {
  if (socket) socket.on('userLeftRoom', callback);
};

export const onRoomUsers = (callback) => {
  if (socket) socket.on('roomUsers', callback);
};

export const onConversationUpdated = (callback) => {
  if (socket) socket.on('conversationUpdated', callback);
};

export const onSocketError = (callback) => {
  if (socket) socket.on('error', callback);
};

/**
 * Remove event listener
 */
export const removeListener = (event, callback) => {
  if (socket) socket.off(event, callback);
};

/**
 * Remove all listeners for an event
 */
export const removeAllListeners = (event) => {
  if (socket) socket.removeAllListeners(event);
};
