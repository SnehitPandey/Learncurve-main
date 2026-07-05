/**
 * Roadmap Timeline Distribution Utility
 * 
 * Dynamically distributes milestone deadlines across a user-selected timeline
 * ensuring proportionate duration based on milestone weight/difficulty
 */

/**
 * Parse timeframe value to total days
 * @param {string} timeframe - Format: "1month", "3months", "custom-90", etc.
 * @returns {number} Total days in the timeline
 */
export const parseTimeframeToDays = (timeframe) => {
  if (!timeframe) return 30; // Default to 1 month

  // Handle custom format: "custom-90" (90 days)
  if (timeframe.startsWith('custom-')) {
    return parseInt(timeframe.replace('custom-', ''), 10);
  }

  // Preset timeframe mappings
  const timeframeMap = {
    '2weeks': 14,
    '3weeks': 21,
    '1month': 30,
    '6weeks': 42,
    '2months': 60,
    '3months': 90,
    '4months': 120,
    '5months': 150,
    '6months': 180,
    '1year': 365,
  };

  return timeframeMap[timeframe] || 30; // Default fallback
};

/**
 * Calculate milestone weight based on various factors
 * @param {object} milestone - Milestone object
 * @returns {number} Weight factor (higher = more time needed)
 */
const calculateMilestoneWeight = (milestone) => {
  // Priority 1: Use explicit weight if provided
  if (milestone.weight && milestone.weight > 0) {
    return milestone.weight;
  }

  // Priority 2: Use estimated hours if available
  if (milestone.estimatedHours && milestone.estimatedHours > 0) {
    // Convert hours to relative weight (normalize to 1-10 scale)
    // Assume average milestone is 10 hours
    return Math.max(1, Math.min(10, milestone.estimatedHours / 2));
  }

  // Priority 3: Use topic count as proxy for complexity
  if (milestone.topics && milestone.topics.length > 0) {
    return milestone.topics.length;
  }

  // Priority 4: Use task count if available
  if (milestone.total && milestone.total > 0) {
    return milestone.total;
  }

  // Default: Equal weight
  return 1;
};

/**
 * Distribute milestones across timeline with proportionate durations
 * @param {Array} milestones - Array of milestone objects
 * @param {number} totalDays - Total timeline duration in days
 * @param {Date} startDate - Start date (default: today)
 * @returns {Array} Milestones with calculated start/end dates and durations
 */
export const distributeMilestonesAcrossTimeline = (milestones, totalDays, startDate = new Date()) => {
  if (!milestones || milestones.length === 0) {
    return [];
  }

  // Calculate total weight of all milestones
  const totalWeight = milestones.reduce((sum, m) => sum + calculateMilestoneWeight(m), 0);

  // Track accumulated days for date calculation
  let accumulatedDays = 0;

  // Distribute days proportionally
  return milestones.map((milestone, index) => {
    // Calculate proportionate duration for this milestone
    const milestoneWeight = calculateMilestoneWeight(milestone);
    const proportionateDays = Math.round((milestoneWeight / totalWeight) * totalDays);

    // Ensure minimum 1 day per milestone
    const durationDays = Math.max(1, proportionateDays);

    // Calculate start date (end of previous milestone)
    const start = new Date(startDate);
    start.setDate(startDate.getDate() + accumulatedDays);

    // Calculate end date
    accumulatedDays += durationDays;
    const end = new Date(startDate);
    end.setDate(startDate.getDate() + accumulatedDays);

    // For the last milestone, ensure it ends exactly at timeline end
    if (index === milestones.length - 1) {
      const targetEnd = new Date(startDate);
      targetEnd.setDate(startDate.getDate() + totalDays);
      
      // Adjust last milestone to end exactly at timeline boundary
      const adjustedDuration = totalDays - (accumulatedDays - durationDays);
      end.setTime(targetEnd.getTime());
      
      return {
        ...milestone,
        startDate: formatDate(start),
        endDate: formatDate(end),
        durationDays: adjustedDuration,
        completeBy: formatDate(end),
      };
    }

    return {
      ...milestone,
      startDate: formatDate(start),
      endDate: formatDate(end),
      durationDays,
      completeBy: formatDate(end),
    };
  });
};

/**
 * Format date as YYYY-MM-DD (UTC-safe)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Regenerate roadmap with new timeline duration
 * Preserves milestone structure but recalculates all dates
 * @param {Array} existingRoadmap - Current roadmap
 * @param {number} newTotalDays - New timeline duration in days
 * @param {Date} startDate - Start date (default: today)
 * @returns {Array} Updated roadmap with new dates
 */
export const regenerateRoadmapTimeline = (existingRoadmap, newTotalDays, startDate = new Date()) => {
  return distributeMilestonesAcrossTimeline(existingRoadmap, newTotalDays, startDate);
};

/**
 * Format display date as "7 Nov"
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted display date
 */
export const formatDisplayDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayNum = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];
  return `${dayNum} ${monthName}`;
};

/**
 * Get timeline summary stats
 * @param {Array} roadmap - Roadmap with distributed dates
 * @returns {object} Summary statistics
 */
export const getTimelineSummary = (roadmap) => {
  if (!roadmap || roadmap.length === 0) {
    return {
      totalDays: 0,
      startDate: null,
      endDate: null,
      totalMilestones: 0,
      averageDuration: 0,
    };
  }

  const startDate = roadmap[0]?.startDate;
  const endDate = roadmap[roadmap.length - 1]?.endDate;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  return {
    totalDays,
    startDate: formatDisplayDate(startDate),
    endDate: formatDisplayDate(endDate),
    totalMilestones: roadmap.length,
    averageDuration: Math.round(totalDays / roadmap.length),
  };
};
