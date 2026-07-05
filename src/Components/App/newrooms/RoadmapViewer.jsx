import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';

/**
 * RoadmapViewer Component
 * Displays AI-generated learning roadmap with phases, milestones, and progress tracking
 */
const RoadmapViewer = ({ roadmap, userProgress = null, onMilestoneClick = null }) => {
  const [expandedPhases, setExpandedPhases] = useState([0]); // First phase expanded by default

  if (!roadmap) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No roadmap available</p>
      </div>
    );
  }

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev => 
      prev.includes(phaseIndex) 
        ? prev.filter(i => i !== phaseIndex)
        : [...prev, phaseIndex]
    );
  };

  const isMilestoneCompleted = (milestoneId) => {
    if (!userProgress?.completedMilestones) return false;
    return userProgress.completedMilestones.includes(milestoneId);
  };

  const isCurrentMilestone = (phaseIndex, milestoneIndex) => {
    if (!userProgress) return false;
    return userProgress.currentPhase === phaseIndex && 
           userProgress.currentMilestone === milestoneIndex;
  };

  const calculateProgress = () => {
    if (!userProgress?.completedMilestones) return 0;
    const totalMilestones = roadmap.phases.reduce((sum, phase) => sum + phase.milestones.length, 0);
    return (userProgress.completedMilestones.length / totalMilestones) * 100;
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Roadmap Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Learning Roadmap</h2>
            </div>
            <p className="text-lg opacity-90">{roadmap.goal}</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Skill Level</div>
            <div className="text-xl font-bold">{roadmap.skillLevel}</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {roadmap.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Progress Bar */}
        {userProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
          <Clock className="w-4 h-4" />
          <span>Total Duration: {roadmap.totalDuration}</span>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {roadmap.phases.map((phase, phaseIndex) => {
          const isExpanded = expandedPhases.includes(phaseIndex);
          const completedMilestones = phase.milestones.filter(m => isMilestoneCompleted(m.id)).length;
          const phaseProgress = (completedMilestones / phase.milestones.length) * 100;

          return (
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
            >
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phaseIndex)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                ${phaseProgress === 100 
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                                  : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'}`}
                  >
                    {phase.phase}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {phase.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {phase.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {completedMilestones}/{phase.milestones.length} completed
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {/* Phase Progress Bar */}
              {phaseProgress > 0 && (
                <div className="px-6 pb-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${phaseProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Milestones */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t-2 border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6 space-y-4">
                      {phase.milestones.map((milestone, milestoneIndex) => {
                        const isCompleted = isMilestoneCompleted(milestone.id);
                        const isCurrent = isCurrentMilestone(phaseIndex, milestoneIndex);

                        return (
                          <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: milestoneIndex * 0.05 }}
                            onClick={() => onMilestoneClick && onMilestoneClick(milestone, phaseIndex, milestoneIndex)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200
                              ${isCompleted 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                                : isCurrent
                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 ring-2 ring-purple-200 dark:ring-purple-800'
                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                              }
                              ${onMilestoneClick ? 'cursor-pointer hover:shadow-md' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Completion Icon */}
                              <div className="mt-1">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                ) : (
                                  <Circle className={`w-6 h-6 ${isCurrent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                                )}
                              </div>

                              {/* Milestone Content */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className={`font-bold text-lg ${isCompleted ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {milestone.title}
                                  </h4>
                                  {isCurrent && (
                                    <span className="px-2 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">
                                      Current
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                  {milestone.description}
                                </p>

                                {/* Topics */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {milestone.topics.map((topic, topicIndex) => (
                                    <span 
                                      key={topicIndex}
                                      className={`px-2 py-1 rounded text-xs font-medium
                                        ${isCompleted 
                                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                      {topic}
                                    </span>
                                  ))}
                                </div>

                                {/* Estimated Hours */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span>{milestone.estimatedHours} hours estimated</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Generated on {new Date(roadmap.generatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default RoadmapViewer;
