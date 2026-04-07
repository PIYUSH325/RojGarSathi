import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import OnlineStatus from './OnlineStatus';
import { ChevronLeft, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { getAvatarUrl } from '../utils/photoUrl';
import './ChatHeader.css';
import { useTranslation } from 'react-i18next';

/**
 * ChatHeader Component
 * Enhanced header for the chat panel with user info, actions, and status
 */
const ChatHeader = ({ 
  conversation = {},
  user = {},
  onClose,
  onCallClick,
  onVideoClick,
  onInfoClick,
  isDarkMode = false,
  isUserBlocked = false,
  setIsUserBlocked = () => {},
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isUserBlockedLocal, setIsUserBlockedLocal] = useState(isUserBlocked);
  const { muteConversation, unmuteConversation, clearChat, deleteConversation, blockUser, unblockUser } = useChat();
  const { user: currentUser, apiBase } = useAuth();

  const getCurrentUserId = () => String(currentUser?.id || currentUser?._id || '');

  const getParticipantId = (participant) =>
    String(participant?._id || participant?.id || participant || '');

  const resolveOtherParty = () => {
    const currentUserId = getCurrentUserId();
    const employer = conversation?.employerId;
    const worker = conversation?.workerId;

    if (currentUserId) {
      if (getParticipantId(employer) === currentUserId) {
        return worker || {};
      }
      if (getParticipantId(worker) === currentUserId) {
        return employer || {};
      }
    }

    // Fallback to the prop when conversation payload is partial.
    return user || worker || employer || {};
  };

  const otherParty = resolveOtherParty();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Handle mute conversation
  const handleMuteConversation = async () => {
    const conversationId = conversation?.conversationId || conversation?._id;
    if (!conversationId) {
      console.error('Conversation ID not found');
      return;
    }

    try {
      const result = await muteConversation(conversationId);
      if (result?.success) {
        alert(t('chatHeader.conversationMuted'));
        setShowMenu(false);
      } else {
        alert(t('chatHeader.muteFailed'));
      }
    } catch (error) {
      console.error('Error muting conversation:', error);
      alert(t('chatHeader.muteError'));
    }
  };

  // Handle clear chat
  const handleClearChat = async () => {
    const conversationId = conversation?.conversationId || conversation?._id;
    if (!conversationId) {
      console.error('Conversation ID not found');
      return;
    }

    if (!window.confirm(t('chatHeader.confirmClearChat'))) {
      return;
    }

    try {
      const result = await clearChat(conversationId);
      if (result?.success) {
        alert(t('chatHeader.chatCleared'));
        setShowMenu(false);
        // Optionally refresh the page or reload messages
        window.location.reload();
      } else {
        alert(t('chatHeader.clearFailed'));
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert(t('chatHeader.clearError'));
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    const conversationId = conversation?.conversationId || conversation?._id;
    if (!conversationId) {
      console.error('Conversation ID not found');
      return;
    }

    if (!window.confirm(t('chatHeader.confirmDeleteConversation'))) {
      return;
    }

    try {
      const result = await deleteConversation(conversationId);
      if (result?.success) {
        alert(t('chatHeader.conversationDeleted'));
        // Reset blocked state since user will be automatically unblocked when conversation is deleted
        setIsUserBlockedLocal(false);
        setIsUserBlocked(false);
        setShowMenu(false);
        // Close the chat window
        onClose();
      } else {
        alert(t('chatHeader.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(t('chatHeader.deleteError'));
    }
  };

  // Handle block user
  const handleBlockUser = async () => {
    const blockedId = otherParty?._id;
    if (!blockedId) {
      console.error('User ID not found');
      return;
    }

    if (!window.confirm(t('chatHeader.confirmBlockUser', { name: otherParty?.name }))) {
      return;
    }

    try {
      const result = await blockUser(blockedId);
      if (result?.success) {
        alert(t('chatHeader.blockedUser', { name: otherParty?.name }));
        setIsUserBlockedLocal(true);
        setIsUserBlocked(true);
        setShowMenu(false);
      } else {
        alert(t('chatHeader.blockFailed'));
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert(t('chatHeader.blockError'));
    }
  };

  // Handle unblock user
  const handleUnblockUser = async () => {
    const blockedId = otherParty?._id;
    if (!blockedId) {
      console.error('User ID not found');
      return;
    }

    if (!window.confirm(t('chatHeader.confirmUnblockUser', { name: otherParty?.name }))) {
      return;
    }

    try {
      const result = await unblockUser(blockedId);
      if (result?.success) {
        alert(t('chatHeader.unblockedUser', { name: otherParty?.name }));
        setIsUserBlockedLocal(false);
        setIsUserBlocked(false);
        setShowMenu(false);
      } else {
        alert(t('chatHeader.unblockFailed'));
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert(t('chatHeader.unblockError'));
    }
  };

  return (
    <header className={`chat-header ${isDarkMode ? 'dark' : ''}`}>
      <div className="chat-header-left">
        {/* Back Button (Mobile) */}
        <button 
          className="btn-close-mobile"
          onClick={onClose}
          aria-label={t('chatHeader.closeChat')}
        >
          <ChevronLeft size={20} />
        </button>

        {/* User Avatar & Info */}
        <div className="header-user-info">
          <div className="header-avatar">
            {otherParty?.profilePhoto || otherParty?.photo ? (
              <img 
                src={getAvatarUrl(otherParty?.profilePhoto || otherParty?.photo, 40, apiBase)} 
                alt={otherParty.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="avatar-placeholder">
                {getInitials(otherParty?.name)}
              </div>
            )}
            <OnlineStatus status="online" size="sm" showLabel={false} />
          </div>

          <div className="header-user-details">
            <h2 className="header-name">{otherParty?.name || t('chatHeader.unknownUser')}</h2>
            <div className="header-status">
              <OnlineStatus 
                status="online" 
                showLabel={true}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="chat-header-right">
        {/* Action Buttons */}
        <button 
          className="btn-header-action"
          onClick={onCallClick}
          title={t('chatHeader.startCall')}
          aria-label={t('chatHeader.startVoiceCall')}
        >
          <Phone size={18} />
        </button>

        <button 
          className="btn-header-action"
          onClick={onVideoClick}
          title={t('chatHeader.startVideoCall')}
          aria-label={t('chatHeader.startVideoCall')}
        >
          <Video size={18} />
        </button>

        <button 
          className="btn-header-action"
          onClick={onInfoClick}
          title={t('chatHeader.conversationInfo')}
          aria-label={t('chatHeader.showConversationInfo')}
        >
          <Info size={18} />
        </button>

        {/* Menu Button */}
        <div className="header-menu">
          <button 
            className="btn-header-menu"
            onClick={() => setShowMenu(!showMenu)}
            aria-label={t('chatHeader.moreOptions')}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="header-dropdown-menu">
              <button className="menu-item" onClick={handleMuteConversation}>
                {t('chatHeader.muteConversation')}
              </button>
              <button className="menu-item" onClick={handleClearChat}>
                {t('chatHeader.clearChat')}
              </button>
              <button className="menu-item text-error" onClick={handleDeleteConversation}>
                {t('chatHeader.deleteConversation')}
              </button>
              
              {/* Block user button - visible when not blocked */}
              {!isUserBlockedLocal && (
                <button 
                  className="menu-item text-error"
                  onClick={handleBlockUser}
                >
                  {t('chatHeader.blockUser')}
                </button>
              )}
              
              {/* Unblock user button - visible when blocked */}
              {isUserBlockedLocal && (
                <button 
                  className="menu-item"
                  onClick={handleUnblockUser}
                >
                  {t('chatHeader.unblockUser')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
