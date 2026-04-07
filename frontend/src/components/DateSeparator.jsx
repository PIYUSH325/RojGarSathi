import React from 'react';
import './DateSeparator.css';

/**
 * DateSeparator Component
 * Shows date/time separator between message groups
 */
const DateSeparator = ({ 
  date,
  isDarkMode = false,
}) => {
  if (!date) return null;

  const formatDate = (dateObj) => {
    const now = new Date();
    const messageDate = new Date(dateObj);
    
    // Check if today
    if (messageDate.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Check if within a week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (messageDate > weekAgo) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Return full date
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className={`date-separator ${isDarkMode ? 'dark' : ''}`}>
      <div className="separator-line"></div>
      <span className="separator-text">{formatDate(date)}</span>
      <div className="separator-line"></div>
    </div>
  );
};

export default DateSeparator;
