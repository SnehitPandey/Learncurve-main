/**
 * Task Generator Utility
 * 
 * Generates today's tasks based on active milestone and timeline pacing.
 * Only the first active milestone is processed, and topics are distributed
 * evenly across the milestone's duration.
 */

/**
 * Calculate number of days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days
 */
export function calculateDaysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate number of days elapsed since start
 * @param {Date|string} startDate - Milestone start date
 * @param {Date|string} currentDate - Current date (default: today)
 * @returns {number} Days elapsed
 */
export function calculateDaysElapsed(startDate, currentDate = new Date()) {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diffTime = current - start;
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  return diffDays;
}

/**
 * Normalize topic to object format (handle both string and object topics)
 * @param {string|Object} topic - Topic as string or object
 * @returns {Object} Topic object with title, description, status, estimatedHours
 */
export function normalizeTopic(topic) {
  if (typeof topic === 'string') {
    return {
      title: topic,
      description: '',
      status: 'pending',
      estimatedHours: 1,
    };
  }
  
  return {
    title: topic.title || 'Untitled Topic',
    description: topic.description || '',
    status: topic.isCompleted ? 'completed' : (topic.status || 'pending'),
    estimatedHours: topic.estimatedHours || 1,
  };
}

/**
 * Find the first active milestone from a roadmap
 * @param {Array} milestones - Array of milestone objects
 * @param {Date} currentDate - Current date (default: today)
 * @returns {Object|null} Active milestone or null
 */
export function findActiveMilestone(milestones, currentDate = new Date()) {
  if (!milestones || milestones.length === 0) return null;

  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  // Find first milestone that:
  // 1. Has not ended yet (endDate >= today)
  // 2. Has uncompleted topics
  const activeMilestone = milestones.find((milestone) => {
    if (!milestone.startDate || !milestone.endDate) return false;
    
    const endDate = new Date(milestone.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Normalize topics to objects before checking status
    const normalizedTopics = milestone.topics ? milestone.topics.map(normalizeTopic) : [];
    const hasUncompletedTopics = normalizedTopics.some(
      (topic) => topic.status !== 'completed'
    );
    
    return endDate >= today && hasUncompletedTopics;
  });

  return activeMilestone || null;
}

/**
 * Calculate how many topics should be studied per day
 * @param {Object} milestone - Milestone object with topics, startDate, endDate
 * @param {Date} currentDate - Current date (default: today)
 * @returns {number} Topics per day
 */
export function calculateTopicsPerDay(milestone, currentDate = new Date()) {
  if (!milestone || !milestone.topics || !milestone.startDate || !milestone.endDate) {
    return 0;
  }

  const totalDays = calculateDaysBetween(milestone.startDate, milestone.endDate) || 1;
  
  // Normalize topics before filtering
  const normalizedTopics = milestone.topics.map(normalizeTopic);
  const remainingTopics = normalizedTopics.filter((t) => t.status !== 'completed').length;
  
  const daysElapsed = calculateDaysElapsed(milestone.startDate, currentDate);
  const remainingDays = Math.max(1, totalDays - daysElapsed);
  
  const topicsPerDay = Math.ceil(remainingTopics / remainingDays);
  
  return Math.max(1, topicsPerDay); // Minimum 1 topic per day
}

/**
 * Generate today's task list from active milestone
 * @param {Array} milestones - Array of milestone objects with dates and topics
 * @param {Date} currentDate - Current date (default: today)
 * @returns {Array} Array of today's tasks
 */
export function generateTodaysTasks(milestones, currentDate = new Date()) {
  if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
    console.warn('generateTodaysTasks: Invalid or empty milestones array', milestones);
    return [];
  }

  // Step 1: Find the first active milestone
  const activeMilestone = findActiveMilestone(milestones, currentDate);
  
  if (!activeMilestone) {
    return []; // No active milestone found
  }

  // Step 2: Calculate how many topics should be studied today
  const topicsPerDay = calculateTopicsPerDay(activeMilestone, currentDate);

  // Step 3: Normalize all topics and get uncompleted ones with their original indices
  const normalizedTopics = activeMilestone.topics.map((topic, originalIndex) => ({
    ...normalizeTopic(topic),
    originalIndex, // Track original position in milestone.topics array
  }));
  
  const uncompletedTopics = normalizedTopics.filter(
    (topic) => topic.status !== 'completed'
  );

  // Step 4: Select today's chunk of topics
  const todaysTopics = uncompletedTopics.slice(0, topicsPerDay);

  // Step 5: Format as task objects
  // ✨ CRITICAL: Use _id (MongoDB ObjectId) not id, and originalIndex for order
  const milestoneId = activeMilestone._id?.toString() || activeMilestone._id || activeMilestone.id;
  
  return todaysTopics.map((topic) => ({
    id: `${milestoneId}-topic-${topic.originalIndex}`,
    title: topic.title,
    description: topic.description || `Study topic from ${activeMilestone.title}`,
    status: topic.status,
    milestone: activeMilestone.title,
    milestoneId: milestoneId, // ✨ Use MongoDB _id, not fallback id
    estimatedHours: topic.estimatedHours || Math.ceil((activeMilestone.estimatedHours || 1) / (activeMilestone.topics?.length || 1)),
    startDate: activeMilestone.startDate,
    endDate: activeMilestone.endDate,
    order: topic.originalIndex, // ✨ Use original index from milestone.topics array
  }));
}

/**
 * Generate today's tasks for a specific room
 * @param {Object} room - Room object with roadmap
 * @param {Date} currentDate - Current date (default: today)
 * @returns {Array} Array of today's tasks with room context
 */
export function generateRoomTodaysTasks(room, currentDate = new Date()) {
  if (!room || !room.roadmap) {
    return [];
  }

  // Extract all milestones from phases
  let allMilestones = [];
  
  if (room.roadmap.phases && Array.isArray(room.roadmap.phases)) {
    room.roadmap.phases.forEach((phase) => {
      if (phase.milestones && Array.isArray(phase.milestones)) {
        allMilestones = allMilestones.concat(phase.milestones);
      }
    });
  } else if (room.customRoadmap && Array.isArray(room.customRoadmap)) {
    // Handle flat roadmap structure (customRoadmap)
    allMilestones = room.customRoadmap;
  }

  // Generate today's tasks
  const tasks = generateTodaysTasks(allMilestones, currentDate);

  // Add room context to each task
  return tasks.map((task) => ({
    ...task,
    roomId: room._id || room.id,
    roomName: room.title,
    roomCode: room.code,
  }));
}

/**
 * Generate today's tasks from multiple rooms
 * @param {Array} rooms - Array of room objects
 * @param {Date} currentDate - Current date (default: today)
 * @param {number} limit - Maximum number of tasks to return (default: 10)
 * @returns {Array} Combined array of today's tasks
 */
export function generateMultiRoomTodaysTasks(rooms, currentDate = new Date(), limit = 10) {
  if (!rooms || rooms.length === 0) {
    return [];
  }

  let allTasks = [];

  // Generate tasks from each room
  rooms.forEach((room) => {
    const roomTasks = generateRoomTodaysTasks(room, currentDate);
    allTasks = allTasks.concat(roomTasks);
  });

  // Sort by milestone start date (earliest first)
  allTasks.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA - dateB;
  });

  // Apply limit
  return allTasks.slice(0, limit);
}

/**
 * Mark a topic as completed and check if milestone is complete
 * @param {Object} milestone - Milestone object
 * @param {string} topicId - Topic ID or title to mark complete
 * @returns {Object} Updated milestone with completion status
 */
export function markTopicCompleted(milestone, topicId) {
  if (!milestone || !milestone.topics) {
    return milestone;
  }

  // Find and mark topic as completed
  const updatedTopics = milestone.topics.map((topic) => {
    if (topic.id === topicId || topic.title === topicId || topic === topicId) {
      return typeof topic === 'string' 
        ? { title: topic, status: 'completed' }
        : { ...topic, status: 'completed' };
    }
    return topic;
  });

  // Calculate completion
  const completedCount = updatedTopics.filter(
    (t) => (typeof t === 'object' ? (t.status === 'completed' || t.isCompleted) : false)
  ).length;
  const totalCount = updatedTopics.length;
  const isComplete = completedCount === totalCount;

  return {
    ...milestone,
    topics: updatedTopics,
    completedTopics: completedCount,
    completed: isComplete,
    progress: Math.round((completedCount / totalCount) * 100),
  };
}

/**
 * Get milestone progress summary
 * @param {Object} milestone - Milestone object
 * @returns {Object} Progress summary
 */
export function getMilestoneProgress(milestone) {
  if (!milestone || !milestone.topics) {
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      percentage: 0,
      isComplete: false,
    };
  }

  const topics = milestone.topics;
  const total = topics.length;
  const completed = topics.filter(
    (t) => (typeof t === 'object' ? (t.status === 'completed' || t.isCompleted) : false)
  ).length;
  const remaining = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    remaining,
    percentage,
    isComplete: completed === total && total > 0,
  };
}

/**
 * Get overall roadmap progress
 * @param {Array} milestones - Array of milestones
 * @returns {Object} Overall progress summary
 */
export function getRoadmapProgress(milestones) {
  if (!milestones || milestones.length === 0) {
    return {
      totalMilestones: 0,
      completedMilestones: 0,
      currentMilestone: null,
      overallPercentage: 0,
    };
  }

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const currentMilestone = findActiveMilestone(milestones);
  
  // Calculate overall percentage based on completed milestones
  const overallPercentage = Math.round((completedMilestones / totalMilestones) * 100);

  return {
    totalMilestones,
    completedMilestones,
    currentMilestone: currentMilestone ? currentMilestone.title : null,
    overallPercentage,
  };
}

/**
 * Generate today's task with fallback logic
 * @param {Object} room - Room object with roadmap
 * @param {Date} currentDate - Current date (default: today)
 * @returns {Object} Task object and additionalTopics array
 */
export function generateTodayTaskWithFallback(room, currentDate = new Date()) {
  if (!room || !room.roadmap) {
    return { task: null, additionalTopics: [] };
  }

  const milestones = room.roadmap;
  const activeMilestone = findActiveMilestone(milestones, currentDate);

  if (activeMilestone) {
    const todayTasks = generateTodaysTasks([activeMilestone], currentDate);
    if (todayTasks.length > 0) {
      return { task: todayTasks[0], additionalTopics: [] };
    }

    // If all topics in the active milestone are complete, move to the next milestone
    const currentIndex = milestones.indexOf(activeMilestone);
    const nextMilestone = milestones[currentIndex + 1];

    if (nextMilestone && nextMilestone.topics.length > 0) {
      const firstTopic = normalizeTopic(nextMilestone.topics[0]);
      return {
        task: {
          id: `${nextMilestone._id}-topic-0`,
          title: firstTopic.title,
          description: firstTopic.description || `Study topic from ${nextMilestone.title}`,
          milestone: nextMilestone.title,
          milestoneId: nextMilestone._id,
          order: 0,
        },
        additionalTopics: [],
      };
    }
  }

  // If all milestones are complete, show "additional topics covered"
  const completedTopics = milestones.flatMap((milestone) =>
    milestone.topics.filter((topic) => topic.status === "completed" || topic.isCompleted)
  );

  return { task: null, additionalTopics: completedTopics };
}
