import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatWindow from '../components/ChatWidget/ChatWindow';

const AiChat = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="container py-4">
      <h1 className="mb-3">{t('chatWidget.title')}</h1>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <ChatWindow inline={true} onClose={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default AiChat;
