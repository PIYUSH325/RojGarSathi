import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { initializeSocket, getSocket } from '../utils/socketClient';
import axios from 'axios';
import './JobChatWindow.css';

const JobChatWindow = () => {
  const { t } = useTranslation();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, token, apiBase } = useAuth();
  const { sendMessage: contextSendMessage } = useChat();

  // State management
  const [jobDetails, setJobDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isTemporaryConversation, setIsTemporaryConversation] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [anonUser, setAnonUser] = useState({ name: '', email: '' });
  const [inquirySent, setInquirySent] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const socket = useRef(null);
  const API_BASE = apiBase || process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!containerRef.current) return;
    
    const { scrollHeight, clientHeight, scrollTop } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    if (force === true || isNearBottom || isInitialLoad.current) {
      containerRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
      if (scrollHeight > 0) {
        isInitialLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket and fetch messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);

        // Initialize socket with token (if available)
        let cleanToken = token;
        if (cleanToken) cleanToken = cleanToken.replace(/^"|"$/g, '');
        if (cleanToken) {
          socket.current = initializeSocket(cleanToken, API_BASE);
        }

        // Fetch job details (public endpoint)
        const jobRes = await axios.get(`${API_BASE}/jobs/${jobId}`);
        setJobDetails(jobRes.data.job || jobRes.data);

        // Get or create conversation (works for both authenticated and anonymous users)
        let conversationUrl = `${API_BASE}/chat/conversation/${jobId}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // For employers, include workerId if provided in URL params or from passed state
        if (user?.role === 'employer' && user?.id) {
          const urlParams = new URLSearchParams(window.location.search);
          const workerId = urlParams.get('workerId');
          
          if (workerId) {
            conversationUrl += `?workerId=${workerId}`;
          } else {
            console.warn('⚠️ Employer accessing JobChatWindow without workerId parameter');
            // Don't block - let the backend handle the error response
          }
        }
        
        const convRes = await axios.get(conversationUrl, { headers });
        
        if (!convRes.data.conversation) {
          setError(t('jobChatWindow.failedToLoadConversation'));
          setLoading(false);
          return;
        }

        const conv = convRes.data.conversation;
        const canonicalConversationId = conv.conversationId || conv._id;
        setIsTemporaryConversation(!!conv.isTemporary);
        setConversationId(conv.isTemporary ? null : canonicalConversationId);

        // Fetch chat history (skip for temporary conversations like employer browsing)
        if (canonicalConversationId && !conv.isTemporary) {
          try {
            const msgRes = await axios.get(
              `${API_BASE}/chat/history/${canonicalConversationId}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              }
            );
            console.log('📨 Chat history response:', msgRes.data);
            console.log(`📊 Received ${msgRes.data.messages?.length} messages`);
            setMessages(msgRes.data.messages || []); 
          } catch (historyErr) {
            console.log('No chat history yet:', historyErr.message);
            setMessages([]);
          }
        } else if (conv.isTemporary) {
          console.log('ℹ️ Temporary conversation (employer browsing) - no chat history needed');
          setMessages([]);
        }

        // Join socket room (only if socket is initialized and not a temporary conversation)
        if (socket.current && !conv.isTemporary) {
          const roomId = conv.conversationId || conv._id;
          console.log('🎯 Joining socket room with:', { 
            conversationId: roomId,
            convObject: { 
              _id: conv._id, 
              conversationId: conv.conversationId 
            }
          });
          
          socket.current.emit('joinRoom', { 
            jobId, 
            conversationId: roomId
          });

          // Ensure old listeners are removed before adding new ones
          socket.current.off('messageReceived');

          // Listen for new messages
          socket.current.on('messageReceived', (message) => {
            console.log('📬 [socket] messageReceived event:', message);
            setMessages((prev) => {
              if (message?._id && prev.some((msg) => String(msg?._id) === String(message._id))) {
                return prev;
              }
              console.log('✏️ Adding socket message to state, prev length:', prev.length);
              return [...prev, message];
            });
          });
        } else if (conv.isTemporary) {
          console.log('ℹ️ Skipping socket room join for temporary conversation');
        }

        setError(null);
      } catch (err) {
        console.error('❌ Error initializing chat:', err);
        console.error('   Request URL:', err.config?.url);
        console.error('   Status Code:', err.response?.status);
        console.error('   Response Data:', err.response?.data);
        console.error('   User Role:', user?.role);
        console.error('   Has Token:', !!token);
        setError(err.response?.data?.msg || t('jobChatWindow.failedToLoadChat'));
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      initializeChat();
    }

    return () => {
      if (socket.current) {
        socket.current.off('messageReceived');
        socket.current.emit('leaveRoom', { jobId, conversationId });
      }
    };
  }, [jobId, token, API_BASE, t, user?.role, user?.id, conversationId]);

  // Send message
  const handleSendMessage = useCallback(
    async (e, contactInfo = null) => {
      e?.preventDefault();
      if (!inputText.trim() || sending) return;

      if (isTemporaryConversation) {
        setError(t('jobChatWindow.selectWorkerFirst'));
        return;
      }

      if (!conversationId) {
        setError(t('jobChatWindow.conversationNotReady'));
        return;
      }
      
      // If anonymous and no contact info, show modal to collect it
      if (!user && !contactInfo) {
        setShowContactModal(true);
        return;
      }
      const messageData = {
      message: inputText.trim(),
       jobId,
       };

      try {
        setSending(true);

        const messageData = {
          message: inputText.trim(),
          jobId,
        };

        // Add contact info if anonymous
        if (!user && contactInfo) {
          messageData.senderName = contactInfo.name;
          messageData.senderEmail = contactInfo.email;
        }

        if (user) {
          if (!socket.current || !socket.current.connected) {
            setError(t('jobChatWindow.connectionNotReady'));
            return;
          }

          socket.current.emit('sendMessage', {
            conversationId,
            jobId,
            message: inputText.trim(),
          });

          setInputText('');
          setError(null);
          setTimeout(() => scrollToBottom(true), 100);
          return;
        }

        // Send via API with authentication (if available)
        const response = await axios.post(
          `${API_BASE}/chat/message/${conversationId}`,
          messageData,
          { 
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        console.log('✅ sendMessage API response:', response.data);

        // Handle response
        if (!user && response.data.contact) {
          // Anonymous user - Contact was created
          setInquirySent(true);
          setInputText('');
          setShowContactModal(false);
          setError(null);
          setTimeout(() => {
            setInquirySent(false);
          }, 5000);
        }
      } catch (err) {
        // Conversation IDs can become stale after backend-side regeneration.
        // Retry once by re-fetching the canonical conversation and resending.
        if (err.response?.status === 404) {
          try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let refreshConversationUrl = `${API_BASE}/chat/conversation/${jobId}`;
            if (user?.role === 'employer') {
              const urlParams = new URLSearchParams(window.location.search);
              const workerId = urlParams.get('workerId');
              if (workerId) {
                refreshConversationUrl += `?workerId=${workerId}`;
              }
            }

            const refreshConvRes = await axios.get(refreshConversationUrl, { headers });
            const refreshedConversation = refreshConvRes.data?.conversation;
            const refreshedConversationId = refreshedConversation?.conversationId || refreshedConversation?._id;

            if (refreshedConversationId && !refreshedConversation?.isTemporary) {
              setConversationId(refreshedConversationId);
              const retryResponse = await axios.post(
                `${API_BASE}/chat/message/${refreshedConversationId}`,
                
                messageData,
                { headers }
              );

              if (retryResponse.data.message) {
                setMessages((prev) => [...prev, retryResponse.data.message]);
                setInputText('');
                setError(null);
                return;
              }
            }
          } catch (retryErr) {
            console.error('Retry after 404 failed:', retryErr);
          }
        }

        console.error('Error sending message:', err);
        const errorMsg = err.response?.data?.msg || err.message || t('jobChatWindow.failedToSend');
        setError(errorMsg);
        // If auth error, redirect to login
        if (err.response?.status === 401 && user) {
          navigate('/login');
        }
      } finally {
        setSending(false);
      }
    },
    [inputText, conversationId, isTemporaryConversation, jobId, user, token, API_BASE, sending, navigate, t, scrollToBottom]
  );

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="job-chat-container">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('admin.common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !jobDetails) {
    return (
      <div className="job-chat-container">
        <div className="alert alert-danger m-4">
          <button
            type="button"
            className="btn-close"
            onClick={() => navigate('/messages')}
          />
          <h4>{t('jobChatWindow.errorTitle')}</h4>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => navigate('/messages')}
          >
            ← {t('jobChatWindow.backToMessages')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-chat-container">
      {/* Prompt unauthenticated users to login or send inquiry */}
      {!user && (
        <div className="alert alert-info m-3 d-flex justify-content-between align-items-center">
          <div>
            <strong><i className="bi bi-info-circle me-2"></i>{t('jobChatWindow.guestBrowsing')}</strong> {t('jobChatWindow.guestHint')}
          </div>
          <div>
            <button className="btn btn-sm btn-primary me-2" onClick={() => navigate('/login')}>
              <i className="bi bi-box-arrow-in-right me-1"></i>{t('jobs.login')}
            </button>
            <button className="btn btn-sm btn-success" onClick={() => navigate('/register')}>
              <i className="bi bi-person-plus me-1"></i>{t('jobChatWindow.signUp')}
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="chat-header">
        <button
          className="btn btn-sm btn-outline-secondary me-3"
          onClick={() => navigate('/messages')}
          title={t('jobChatWindow.backToMessages')}
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <div className="chat-header-info">
          <h5 className="mb-0 fw-bold">
            {jobDetails?.title || t('jobChatWindow.chatFallback')}
          </h5>
          {jobDetails?.postedBy && (
            <small className="text-muted">
              {jobDetails.postedBy} • {jobDetails?.city}
            </small>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container" ref={containerRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <i className="bi bi-chat-dots"></i>
            <p>{t('chatWindow.emptyMessages')}</p>
          </div>
        ) : (
          <>
            {console.log(`🎯 Rendering ${messages.length} messages`)}
            {messages.map((msg, idx) => {
              // Handle both old and new message formats
              const messageContent = msg.message || msg.text;
              const senderData = msg.senderId || msg.sender;
              let senderId;
              
              if (typeof senderData === 'string') {
                senderId = senderData;
              } else if (senderData && typeof senderData === 'object') {
                senderId = senderData._id || senderData.id;
              }
              
              const currentUserId = user?._id || user?.id;
              const isOwn = !!(user && senderId && currentUserId && String(senderId) === String(currentUserId));
              const senderName = (typeof senderData === 'object' && senderData?.name) ? senderData.name : t('conversationList.unknownUser');
              
              return (
                <div
                  key={idx}
                  className={`message-bubble ${isOwn ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {!isOwn && <small className="message-sender">{senderName}</small>}
                    <p className="message-text">{messageContent}</p>
                    <small className="message-time">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="chat-input-section">
        {inquirySent && (
          <div className="alert alert-success my-2">
            ✅ {t('jobChatWindow.inquirySent')}
          </div>
        )}
        {error && (
          <div className="alert alert-warning my-2">{error}</div>
        )}
        <form onSubmit={handleSendMessage} className="d-flex gap-2">
          <textarea
            className="form-control input-field"
            placeholder={user ? t('chatInput.placeholder') : t('jobChatWindow.inquiryPlaceholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
            disabled={sending}
            style={{ minHeight: '40px', maxHeight: '100px', resize: 'none' }}
          />
          <button
            type="submit"
            className="btn btn-primary send-button"
            disabled={!inputText.trim() || sending}
            title={user ? t('jobChatWindow.sendMessageTitle') : t('jobChatWindow.sendInquiryTitle')}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-send"></i>
            )}
          </button>
        </form>
      </div>

      {/* Contact Modal for Anonymous Users */}
      {showContactModal && !user && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('jobChatWindow.sendYourInquiry')}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowContactModal(false);
                    setAnonUser({ name: '', email: '' });
                  }}
                />
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">{t('jobChatWindow.yourName')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('jobChatWindow.enterYourName')}
                      value={anonUser.name}
                      onChange={(e) => setAnonUser({ ...anonUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('jobChatWindow.yourEmail')}</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder={t('jobChatWindow.enterYourEmail')}
                      value={anonUser.email}
                      onChange={(e) => setAnonUser({ ...anonUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('jobChatWindow.yourMessage')}</label>
                    <textarea
                      className="form-control"
                      placeholder={t('jobChatWindow.inquiryPlaceholder')}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows="4"
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowContactModal(false);
                    setAnonUser({ name: '', email: '' });
                  }}
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!anonUser.name || !anonUser.email || !inputText.trim() || sending}
                  onClick={(e) => handleSendMessage(e, anonUser)}
                >
                  {sending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t('passwordReset.sending')}
                    </>
                  ) : (
                    t('jobChatWindow.sendInquiry')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobChatWindow;

