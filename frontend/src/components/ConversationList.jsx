import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, X, Trash2 } from 'lucide-react';
import { getAvatarUrl } from '../utils/photoUrl';
import './ConversationList.css';
import { useTranslation } from 'react-i18next';

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const { t } = useTranslation();
  const {
    conversations,
    fetchConversations,
    searchConversations,
    deleteConversation,
    loading,
    error,
    setError = () => {},
  } = useChat();

  const { user, apiBase } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hoveredConversationId, setHoveredConversationId] = useState(null);
  const hasMore = conversations.length >= 20;
  const searchTimeoutRef = useRef(null);

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId, conversationName) => {
    if (!window.confirm(t('conversationList.confirmDelete', { name: conversationName }))) {
      return;
    }

    try {
      const result = await deleteConversation(conversationId);
      if (result?.success) {
        alert(t('conversationList.deletedSuccess'));
      } else {
        alert(t('conversationList.deletedFail'));
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(t('conversationList.deletedError'));
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchConversations(20, 0);
  }, [fetchConversations, user]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (query.trim()) {
          searchConversations(query.trim());
        } else {
          fetchConversations(20, 0);
          setPage(0);
        }
      }, 500);
    },
    [fetchConversations, searchConversations]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    fetchConversations(20, nextPage * 20);
    setPage(nextPage);
  }, [page, fetchConversations]);

  const formatLastMessage = (lastMessage, maxLength = 40) => {
    if (!lastMessage) return t('conversationList.startNewConversation');
    const text = lastMessage.substring(0, maxLength);
    return text.length === maxLength ? text + '...' : text;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('conversationList.yesterday');
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getCurrentUserId = () => String(user?.id || user?._id || '');

  const getParticipantId = (participant) =>
    String(participant?._id || participant?.id || participant || '');

  const getReceiver = (conversation) => {
    const currentUserId = getCurrentUserId();
    const employer = conversation?.employerId;
    const worker = conversation?.workerId;

    if (!currentUserId) {
      return worker || employer || {};
    }

    if (getParticipantId(employer) === currentUserId) {
      return worker || {};
    }

    if (getParticipantId(worker) === currentUserId) {
      return employer || {};
    }

    return worker || employer || {};
  };

  const getConversationName = (conversation) => getReceiver(conversation)?.name || t('conversationList.unknownUser');
  const getFallbackConversationName = () => t('conversationList.unknownUser');

  const getUnreadCount = (conversation) =>
    Math.max(conversation.employerUnreadCount || 0, conversation.workerUnreadCount || 0);

  return (
    <div className="conversation-list">
      <div className="conversation-list-shell">
        <div className="list-header">
          <div className="list-header-copy">
            <span className="list-overline">{t('conversationList.inbox')}</span>
            <h2>{t('conversationList.messages')}</h2>
            <p className="list-subtitle">
              {t('conversationList.subtitle')}
            </p>
          </div>
          <button className="new-chat-btn" title={t('conversationList.newConversation')} type="button">
            <Plus size={20} />
          </button>
        </div>

        <div className="conversation-toolbar">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={t('conversationList.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => handleSearch('')}
                title={t('conversationList.clearSearch')}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="conversation-toolbar-meta">
            <span className="conversation-count">{t('conversationList.chatCount', { count: conversations.length })}</span>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <div className="error-banner-copy">
              <strong>{t('conversationList.somethingWrong')}</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={() => setError && setError(null)}>
              ×
            </button>
          </div>
        )}

        <div className="conversations-scroll">
          {loading && conversations.length === 0 ? (
            <div className="loading-state premium-state-card">
              <div className="spinner-small"></div>
              <h3>{t('conversationList.loadingTitle')}</h3>
              <p>{t('conversationList.loadingDesc')}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state premium-state-card">
              <div className="empty-state-icon">💬</div>
              <h3>{t('conversationList.emptyTitle')}</h3>
              <p>{t('conversationList.emptyDesc')}</p>
            </div>
          ) : (
            <>
              <div className="conversation-list-inner">
                {conversations.map((conversation, index) => {
                  const receiver = getReceiver(conversation);
                  const unreadCount = getUnreadCount(conversation);
                  const isActive =
                    selectedConversationId === conversation._id ||
                    selectedConversationId === conversation.conversationId;

                  return (
                    <div
                      key={conversation._id}
                      className={`conversation-item ${isActive ? 'active' : ''} ${
                        unreadCount > 0 ? 'has-unread' : ''
                      }`}
                      onClick={() =>
                        onSelectConversation(
                          conversation.conversationId,
                          conversation.jobId?._id,
                          conversation
                        )
                      }
                      onMouseEnter={() => setHoveredConversationId(conversation._id)}
                      onMouseLeave={() => setHoveredConversationId(null)}
                      style={{ animationDelay: `${index * 0.04}s` }}
                    >
                      <div className="conversation-avatar">
                        <div className="avatar-ring">
                          <img
                            src={getAvatarUrl(receiver?.profilePhoto || receiver?.photo, 48, apiBase)}
                            alt={getConversationName(conversation) || getFallbackConversationName()}
                            className="avatar-image"
                          />
                        </div>

                        <span
                          className={`presence-dot ${
                            unreadCount > 0 ? 'presence-dot-active' : ''
                          }`}
                        />

                        {unreadCount > 0 && (
                          <span className="unread-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="conversation-content">
                        <div className="conversation-header-row">
                          <h4 className="conversation-name">
                            {getConversationName(conversation)}
                          </h4>
                          <span className="conversation-time">
                            {formatTime(conversation.lastMessage?.timestamp)}
                          </span>
                        </div>

                        <div className="conversation-body">
                          <p className="conversation-job">
                            {conversation.jobId?.title || t('conversationList.generalConversation')}
                          </p>
                          <p className="conversation-message">
                            {formatLastMessage(conversation.lastMessage?.text)}
                          </p>
                        </div>

                        <div className="conversation-footer">
                          {conversation.applicationStatus && (
                            <span className={`status-badge ${conversation.applicationStatus}`}>
                              {conversation.applicationStatus}
                            </span>
                          )}

                          {unreadCount > 0 && (
                            <span className="message-preview-pill">{t('conversationList.newActivity')}</span>
                          )}
                        </div>
                      </div>

                      {/* Delete button - visible on hover */}
                      {hoveredConversationId === conversation._id && (
                        <button
                          className="btn-delete-conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(
                              {
                                conversationId: conversation.conversationId,
                                _id: conversation._id,
                              },
                              getConversationName(conversation)
                            );
                          }}
                          title={t('conversationList.deleteConversation')}
                          aria-label={t('conversationList.deleteConversation')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="conversation-hover-preview" />
                    </div>
                  );
                })}
              </div>

              {hasMore && conversations.length >= 20 && (
                <div className="load-more-container">
                  <button
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loading}
                    type="button"
                  >
                    {loading ? t('conversationList.loading') : t('conversationList.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;