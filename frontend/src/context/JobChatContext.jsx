import React, { createContext, useState } from 'react';
import { useAuth } from './AuthContext';

const JobChatContext = createContext();



export const JobChatProvider = ({ children }) => {
  const [jobConversations, setJobConversations] = useState([]);
  const [currentJobConversation, setCurrentJobConversation] = useState(null);
  const [jobMessages, setJobMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { apiBase } = useAuth();

  const value = {
    jobConversations,
    setJobConversations,
    currentJobConversation,
    setCurrentJobConversation,
    jobMessages,
    setJobMessages,
    loading,
    setLoading,
    error,
    setError,
  };

  return (
    <JobChatContext.Provider value={value}>
      {children}
    </JobChatContext.Provider>
  );
};

export const useJobChat = () => {
  const context = React.useContext(JobChatContext);
  if (!context) {
    throw new Error('useJobChat must be used within a JobChatProvider');
  }
  return context;
};

export default JobChatContext;
