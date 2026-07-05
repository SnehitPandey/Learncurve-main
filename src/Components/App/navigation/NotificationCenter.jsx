import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, MessageSquare, Users, Calendar, AlertCircle } from 'lucide-react';
import { notificationService } from '../../../services/notificationService';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch notifications on mount and when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Initial unread count fetch
  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications({ limit: 20 });
      // Filter out read notifications
      const unreadNotifications = (data.notifications || []).filter(n => !n.read);
      setNotifications(unreadNotifications);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      // Mark all as read first
      await notificationService.markAllAsRead();
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'room':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'task':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-6 h-6 text-[var(--color-text)]" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed md:absolute left-4 right-4 bottom-20 md:left-16 md:right-auto md:bottom-0 md:w-96 md:max-w-[calc(100vw-6rem)] bg-[var(--color-background)] border border-white/10 rounded-lg shadow-2xl z-[1000] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-400 hover:text-red-300 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[50vh] md:max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-[var(--color-text)]/50">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>{error}</p>
                  <button
                    onClick={fetchNotifications}
                    className="mt-2 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text)]/50">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-[var(--color-primary)]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--color-text)] leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[var(--color-text)]/50 mt-1">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
