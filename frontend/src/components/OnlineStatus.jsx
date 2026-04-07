import React from 'react';
import './OnlineStatus.css';

/**
 * OnlineStatus Component
 * Shows online/offline/away status with animated indicator
 */
const OnlineStatus = ({ 
  status = 'online', // 'online', 'away', 'offline'
  userName = '',
  showLabel = true,
  size = 'md', // 'sm', 'md', 'lg'
}) => {
  const statusConfig = {
    online: {
      color: '#10b981',
      label: 'Online',
      icon: '●',
    },
    away: {
      color: '#f59e0b',
      label: 'Away',
      icon: '◐',
    },
    offline: {
      color: '#9ca3af',
      label: 'Offline',
      icon: '○',
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className={`online-status-container status-${status} size-${size}`}>
      <span 
        className={`status-dot status-${status}`}
        style={{ backgroundColor: config.color }}
        title={config.label}
      >
        {status === 'online' && <span className="pulse"></span>}
      </span>
      
      {showLabel && (
        <span className="status-label">
          {userName && `${userName} - `}{config.label}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
