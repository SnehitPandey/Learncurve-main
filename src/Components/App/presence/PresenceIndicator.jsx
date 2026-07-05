/**
 * PresenceIndicator Component
 * Discord-style presence indicator with status colors and activity display
 */

import React from 'react';
import { motion } from 'framer-motion';

const PresenceIndicator = ({ 
  status = 'offline', 
  activity = null, 
  username = 'User',
  size = 'md',
  showActivity = false,
  className = ''
}) => {
  // Status colors
  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  // Status labels
  const statusLabels = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
  };

  // Size variants
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColor = statusColors[status] || statusColors.offline;
  const statusLabel = statusLabels[status] || statusLabels.offline;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Status Indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${sizeClass} rounded-full ${statusColor} ring-2 ring-background relative`}
      >
        {/* Pulse animation for online status */}
        {status === 'online' && (
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping" />
        )}
        
        {/* Moon icon for idle */}
        {status === 'idle' && size !== 'sm' && (
          <span className="absolute inset-0 flex items-center justify-center text-[8px]">
            🌙
          </span>
        )}
        
        {/* Minus icon for DND */}
        {status === 'dnd' && size !== 'sm' && (
          <span className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-white rounded-full" />
          </span>
        )}
      </motion.div>

      {/* Activity Tooltip */}
      {showActivity && (
        <div className="ml-2 flex flex-col">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {username}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: 'rgba(var(--color-text-rgb), 0.6)' }}>
              {statusLabel}
            </span>
            {activity && status !== 'offline' && (
              <>
                <span className="text-xs" style={{ color: 'rgba(var(--color-text-rgb), 0.4)' }}>
                  —
                </span>
                <span className="text-xs" style={{ color: 'rgba(var(--color-text-rgb), 0.8)' }}>
                  {activity}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator;
