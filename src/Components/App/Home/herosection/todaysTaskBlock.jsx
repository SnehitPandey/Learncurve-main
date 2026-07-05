import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Users, Bell, Plus, PlayCircle, CheckCircle2, Clock, AlertCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { roomService } from "../../../../services/roomService";

const TodaysTaskBlock = ({ cardVariants, customIndex }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [smartReminders, setSmartReminders] = useState([]);
  const [progressStatus, setProgressStatus] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await roomService.getTodaysTasks();
      
      if (response.success && response.rooms) {
        // Keep rooms that have active tasks OR completed tasks today
        const activeRooms = response.rooms.filter(
          r => (r.todaysTasks && r.todaysTasks.length > 0) || r.completedTodayCount > 0
        );
        setRooms(activeRooms);
        
        // Calculate accurate completion stats from backend counts
        const completed = activeRooms.reduce((sum, r) => sum + (r.completedTodayCount || 0), 0);
        const total = activeRooms.reduce((sum, r) => sum + (r.totalTodayCount || 0), 0);
        setCompletedToday(completed);
        setTotalToday(total);
      }

      // Fetch user's rooms for smart reminders
      const roomsResponse = await roomService.getMyRooms();
      if (roomsResponse.success && roomsResponse.rooms) {
        calculateSmartReminders(roomsResponse.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for task-completed events to auto-refetch
  useEffect(() => {
    const handleTaskCompleted = () => {
      fetchData();
    };

    window.addEventListener('task-completed', handleTaskCompleted);
    return () => window.removeEventListener('task-completed', handleTaskCompleted);
  }, []);

  const calculateSmartReminders = (rooms) => {
    const reminders = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overallStatus = 'on-track';
    let maxDeviation = 0;

    rooms.forEach(room => {
      if (!room.roadmap || !room.roadmap.phases) return;

      let totalMilestones = 0;
      let completedMilestones = 0;
      let incompleteMilestones = [];

      room.roadmap.phases.forEach((phase, phaseIndex) => {
        phase.milestones.forEach((milestone, milestoneIndex) => {
          totalMilestones++;
          if (milestone.completed) {
            completedMilestones++;
          } else {
            incompleteMilestones.push({
              title: milestone.title,
              week: phaseIndex + 1,
              roomName: room.title,
              roomId: room.id
            });
          }
        });
      });

      const roomStartDate = room.startDate ? new Date(room.startDate) : new Date(room.createdAt);
      const roomEndDate = room.endDate ? new Date(room.endDate) : new Date(roomStartDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const totalDuration = roomEndDate - roomStartDate;
      const elapsed = today - roomStartDate;
      const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const actualProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

      const deviation = actualProgress - expectedProgress;
      if (Math.abs(deviation) > Math.abs(maxDeviation)) {
        maxDeviation = deviation;
        if (deviation < -10) {
          overallStatus = 'behind';
        } else if (deviation > 10) {
          overallStatus = 'ahead';
        } else {
          overallStatus = 'on-track';
        }
      }

      if (actualProgress < expectedProgress - 10) {
        const backlogCount = Math.ceil((expectedProgress - actualProgress) / 100 * totalMilestones);
        const estimatedTime = backlogCount * 30;
        
        reminders.push({
          type: 'backlog',
          message: `You're behind in "${room.title}" — catch up on ${backlogCount} topic${backlogCount > 1 ? 's' : ''} (${estimatedTime} mins)`,
          roomId: room.id,
          priority: 'high'
        });
      }

      if (incompleteMilestones.length > 0 && actualProgress < expectedProgress) {
        reminders.push({
          type: 'missed',
          message: `Complete "${incompleteMilestones[0].title}" in "${room.title}" to stay on track`,
          roomId: room.id,
          priority: 'medium'
        });
      }
    });

    const sortedReminders = reminders
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 2);

    setSmartReminders(sortedReminders);
    setProgressStatus(overallStatus);
  };

  const handleJoinRoom = () => {
    navigate('/joinroom');
  };

  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Check if there are any active tasks across all rooms
  const hasActiveTasks = rooms.some(r => r.todaysTasks && r.todaysTasks.length > 0);

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="lg:col-span-4 p-6 rounded-2xl border border-primary/40 bg-background/50 backdrop-blur-sm h-[420px] flex flex-col"
      style={{
        boxShadow: '0 0 20px rgba(var(--color-primary-rgb), 0.15)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        <h2 className="text-xl font-bold text-primary">Today's Task Block</h2>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : hasActiveTasks || completedToday > 0 ? (
        <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0 custom-scrollbar">
          {/* Completion Meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text/80">Completion meter for the day</span>
              <span className="text-sm font-semibold text-primary">{completionPercentage}%</span>
            </div>
            <p className="text-xs text-text/50 mb-2">
              {completedToday} of {totalToday} tasks completed
            </p>
            <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Task list — one section per room */}
          {rooms.map((room, roomIndex) => {
            if (!room.todaysTasks || room.todaysTasks.length === 0) return null;

            // Calculate global lesson index across all previous rooms
            const prevTaskCount = rooms
              .slice(0, roomIndex)
              .reduce((sum, r) => sum + (r.todaysTasks?.length || 0), 0);

            return (
              <div key={room.roomId} className="space-y-2">
                {/* Room label (only show if multiple rooms have tasks) */}
                {rooms.filter(r => r.todaysTasks?.length > 0).length > 1 && (
                  <div className="flex items-center gap-2 mt-2">
                    <BookOpen size={14} className="text-primary/70" />
                    <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">
                      {room.roomTitle}
                    </p>
                  </div>
                )}

                {/* Tasks for this room */}
                {room.todaysTasks.map((task, taskIndex) => {
                  const globalIndex = prevTaskCount + taskIndex + 1;
                  const displayMinutes = task.estimatedMinutes || 30;

                  // Robust fallback for stringified JSON titles
                  let displayTitle = task.title;
                  if (typeof task.title === 'string' && task.title.trim().startsWith('{')) {
                    try {
                      const titleMatch = task.title.match(/title:\s*['"]([^'"]+)['"]/);
                      if (titleMatch && titleMatch[1]) {
                        displayTitle = titleMatch[1];
                      }
                    } catch (e) { /* keep original */ }
                  }

                  return (
                    <div key={task.taskId || taskIndex} className="p-3 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors">
                      <h3 className="text-sm font-bold text-text">
                        Lesson {globalIndex}: {displayTitle} — {displayMinutes} mins
                      </h3>
                      <p className="text-xs text-text/50 mt-0.5">
                        {task.column === 'inProgress' ? '▶ In progress' : 'Start button with timer + check-off system'}
                      </p>
                    </div>
                  );
                })}

                {/* Room link */}
                <div className="flex items-start gap-2 mt-1">
                  <Users size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#51a2ff' }} />
                  <div>
                    <button 
                      onClick={() => navigate(`/room/${room.roomId}`)}
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#51a2ff' }}
                    >
                      Resume with your group →{' '}
                      {room.paceStatus === 'BEHIND' && <span className="text-orange-500">catch up now</span>}
                      {room.paceStatus === 'AHEAD' && <span className="text-green-500">you are ahead</span>}
                      {(room.paceStatus === 'ON_TRACK' || !room.paceStatus) && <span style={{ color: '#51a2ff' }}>you are on track</span>}
                    </button>
                    <p className="text-xs text-text/50 mt-0.5">
                      Join {room.roomTitle} room
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Daily Quiz — link to first room */}
          {rooms.length > 0 && rooms[0].todaysTasks?.length > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-primary">Daily Quiz Available</h4>
                    <p className="text-xs text-text/50">5-question checkpoint quiz ready</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/room/${rooms[0].roomId}?tab=quiz`)}
                  className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
                >
                  Take Quiz →
                </button>
              </div>
            </div>
          )}

          {/* Smart Reminders */}
          {smartReminders.length > 0 && (
            <div className="p-3 bg-orange-500/5 rounded-lg border-l-4 border-orange-500/50 border-t border-r border-b border-orange-500/20">
              <div className="flex items-start gap-2">
                <Bell size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-orange-500 mb-1">
                    Smart reminders:
                  </h4>
                  <div className="space-y-0.5">
                    {smartReminders.map((reminder, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(`/room/${reminder.roomId}`)}
                        className="text-xs text-text/70 hover:text-text/90 transition-colors text-left w-full block"
                      >
                        {reminder.message}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <CheckCircle size={32} className="text-primary/50" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-text mb-2">No Tasks Yet</h3>
          <p className="text-sm text-text/70 mb-6 max-w-md">
            Join a study room to see your daily tasks and collaborate with others
          </p>
          <button
            onClick={handleJoinRoom}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Join a Room</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TodaysTaskBlock;
