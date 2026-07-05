import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { roomService } from "../../../../services/roomService";

const RoomUpdates = ({ cardVariants, customIndex }) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await roomService.getTodaysTasks();
      if (response.success && response.roomActivity) {
        setActivity(response.roomActivity.slice(0, 5));
      } else {
        setActivity([]);
      }
    } catch (error) {
      console.error('Failed to fetch room activity:', error);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    
    // Refresh periodically
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for task-completed events to refresh activity
  useEffect(() => {
    const handleTaskCompleted = () => {
      fetchActivity();
    };

    window.addEventListener('task-completed', handleTaskCompleted);
    return () => window.removeEventListener('task-completed', handleTaskCompleted);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'join':
        return '👥';
      case 'complete':
        return '✅';
      case 'behind':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getActivityDotColor = (color) => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'teal':
        return 'bg-teal-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-primary';
    }
  };

  const getActivityTextColor = (color) => {
    switch (color) {
      case 'green':
        return 'text-green-400';
      case 'teal':
        return 'text-teal-400';
      case 'orange':
        return 'text-orange-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="p-4 rounded-2xl border border-primary/30 bg-background/50 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-primary">Updates about rooms</h3>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8 h-full flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : activity.length > 0 ? (
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
          {activity.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => item.roomId && navigate(`/room/${item.roomId}`)}
              className="p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${getActivityDotColor(item.color)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${getActivityTextColor(item.color)}`}>
                    {item.text}
                  </p>
                  {item.timestamp && (
                    <p className="text-xs text-text/40 mt-0.5">
                      {formatTimeAgo(item.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-text/70">No room updates yet</p>
          <p className="text-xs text-text/50 mt-1">Check back later for activity in your rooms</p>
        </div>
      )}
    </motion.div>
  );
};

// Helper to format timestamps as relative time
function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default RoomUpdates;
