import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, ChevronRight } from 'lucide-react';

const TodaysTasksPanel = ({ rooms = [] }) => {
  const navigate = useNavigate();

  // Flatten today's tasks from all rooms
  const allTasks = rooms.flatMap((room) =>
    (room.todaysTasks || []).map((task) => ({
      ...task,
      roomId: room.roomId,
      roomTitle: room.roomTitle,
    }))
  );

  if (allTasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 text-center"
      >
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold text-white mb-1">You're all caught up for today.</h3>
        <p className="text-sm text-gray-400">Check back tomorrow for new tasks.</p>
      </motion.div>
    );
  }

  const handleStartFocus = (task) => {
    navigate(`/room/${task.roomId}?task=${task.taskId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        📋 Today's Tasks
        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-medium">
          {allTasks.length}
        </span>
      </h2>

      <div className="space-y-3">
        {allTasks.map((task) => (
          <div
            key={`${task.roomId}-${task.taskId}`}
            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-slate-600 text-gray-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                  {task.roomTitle}
                </span>
                {task.estimatedMinutes && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {task.estimatedMinutes} min
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.column === 'inProgress'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {task.column === 'inProgress' ? 'IN PROGRESS' : 'TO DO'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleStartFocus(task)}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
            >
              <Play className="w-3.5 h-3.5" />
              Focus
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TodaysTasksPanel;
