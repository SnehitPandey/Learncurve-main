import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Users } from 'lucide-react';

const StreakWidget = ({ focusStreak = { count: 0 }, duoStreak = { count: 0 }, hasPartner = false }) => {
  const focusCount = focusStreak?.count ?? 0;
  const duoCount = duoStreak?.count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
    >
      <h2 className="text-lg font-semibold text-white mb-4">🔥 Streaks</h2>

      <div className="flex items-center gap-6">
        {/* Focus streak */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            focusCount > 0
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-slate-700 text-gray-500'
          }`}>
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{focusCount}</p>
            <p className="text-xs text-gray-400">
              Focus {focusCount === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Duo streak */}
        {hasPartner && (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              duoCount > 0
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-slate-700 text-gray-500'
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{duoCount}</p>
              <p className="text-xs text-gray-400">
                Duo {duoCount === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        )}
      </div>

      {focusCount === 0 && (
        <p className="text-xs text-gray-500 mt-3">Study today to start your streak ✨</p>
      )}
    </motion.div>
  );
};

export default StreakWidget;
