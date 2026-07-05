import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

const PACE_CONFIG = {
  BEHIND: { label: 'Behind', color: 'text-red-400', bg: 'bg-red-500/20', icon: TrendingDown, sort: 0 },
  ON_TRACK: { label: 'On Track', color: 'text-green-400', bg: 'bg-green-500/20', icon: Minus, sort: 1 },
  AHEAD: { label: 'Ahead', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: TrendingUp, sort: 2 },
};

const CircularProgress = ({ percentage, size = 56, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-cyan-400 transition-all duration-700"
      />
    </svg>
  );
};

const RoomProgressGrid = ({ rooms = [] }) => {
  const navigate = useNavigate();

  // Sort: BEHIND first → ON_TRACK → AHEAD
  const sorted = [...rooms].sort((a, b) => {
    const aSort = PACE_CONFIG[a.paceStatus]?.sort ?? 1;
    const bSort = PACE_CONFIG[b.paceStatus]?.sort ?? 1;
    return aSort - bSort;
  });

  if (sorted.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 text-center"
      >
        <p className="text-gray-400">No active rooms. Create or join a room to get started.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h2 className="text-lg font-semibold text-white mb-4">📚 Your Rooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((room) => {
          const pace = PACE_CONFIG[room.paceStatus] || PACE_CONFIG.ON_TRACK;
          const PaceIcon = pace.icon;

          return (
            <motion.button
              key={room.roomId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/room/${room.roomId}`)}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700 hover:border-cyan-500/30 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-white truncate flex-1 mr-2">
                  {room.roomTitle}
                </h3>
                <div className="relative flex-shrink-0">
                  <CircularProgress percentage={room.progressPercentage} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {Math.round(room.progressPercentage)}%
                  </span>
                </div>
              </div>

              {/* Pace badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${pace.bg} ${pace.color}`}>
                  <PaceIcon className="w-3 h-3" />
                  {pace.label}
                </span>
                <span className="text-xs text-gray-500">Room avg: {Math.round(room.averageProgress)}%</span>
              </div>

              {/* Phase / Milestone breadcrumb */}
              {(room.currentPhase || room.currentMilestone) && (
                <p className="text-xs text-gray-400 truncate">
                  {room.currentPhase}{room.currentPhase && room.currentMilestone ? ' → ' : ''}{room.currentMilestone}
                </p>
              )}

              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors absolute top-5 right-4 hidden group-hover:block" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RoomProgressGrid;
