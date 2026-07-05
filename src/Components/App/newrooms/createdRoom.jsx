// Components/App/newrooms/createdRoom.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
    Send,
    Bot,
    User,
    CheckCircle,
    Target,
    Calendar,
    Clock,
    Users,
    Plus,
    Minus,
    X,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Map,
    MessageCircle,
    PlayCircle,
    Edit3,
    RefreshCw
} from "lucide-react";

import { Card, Button, Badge, Avatar } from "../../elements/elements";
import { aiService } from "../../../services/aiService";
import { 
    parseTimeframeToDays, 
    distributeMilestonesAcrossTimeline,
    formatDisplayDate as formatDateDisplay,
    getTimelineSummary
} from "../../../utils/roadmapTimelineUtils";

const CreatedRoom = ({ formData, aiSummary, onBack, onCreateRoom }) => {
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [expandedItems, setExpandedItems] = useState(new Set());
    
    // Fixed date utility functions
    const formatDate = (date) => {
        // Use UTC to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDate = (dateStr) => {
        // Parse as local date to avoid timezone shifts
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const addDays = (dateStr, days) => {
        const date = parseDate(dateStr);
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };

    // Format date for display (7 Aug)
    const formatDisplayDate = (dateStr) => {
        const date = parseDate(dateStr);
        const day = date.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    };

    // State for roadmap and loading
    const [roadmap, setRoadmap] = useState([]);
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);

    // Generate roadmap from AI API
    useEffect(() => {
        let isMounted = true; // Track if component is mounted
        
        const generateRoadmap = async () => {
            if (!isMounted) return;
            
            setIsLoadingRoadmap(true);
            try {
                // Calculate duration in weeks from timeframe
                const timeframeMap = {
                    '1 week': 1,
                    '2 weeks': 2,
                    '1 month': 4,
                    '2 months': 8,
                    '3 months': 12,
                    '6 months': 24,
                };
                const durationWeeks = timeframeMap[formData.timeframe] || 4;

                // Call AI roadmap generation
                const response = await aiService.generateRoadmap({
                    goal: formData.goal,
                    tags: formData.selectedTags,
                    skillLevel: formData.proficiency,
                    durationWeeks: durationWeeks
                });

                // Only update state if component is still mounted
                if (!isMounted) return;

                // Extract roadmap from response wrapper
                const roadmapData = response.roadmap || response;

                // Validate response structure
                if (!roadmapData || !roadmapData.phases || !Array.isArray(roadmapData.phases)) {
                    throw new Error('Invalid roadmap response structure');
                }

                // Transform AI response to roadmap format
                const transformedRoadmap = [];
                let milestoneIndex = 0;

                // Flatten all milestones from all phases
                roadmapData.phases.forEach(phase => {
                    if (phase.milestones && Array.isArray(phase.milestones)) {
                        phase.milestones.forEach(milestone => {
                            transformedRoadmap.push({
                                id: milestoneIndex++,
                                title: milestone.title,
                                description: milestone.description,
                                enabled: true,
                                completed: 0,
                                total: milestone.topics?.length || 0,
                                topics: milestone.topics || [],
                                estimatedHours: milestone.estimatedHours,
                                phase: phase.title,
                                weight: milestone.weight || milestone.estimatedHours || milestone.topics?.length || 1
                            });
                        });
                    }
                });

                // ✨ NEW: Distribute milestones across user-selected timeline
                const totalDays = parseTimeframeToDays(formData.timeframe);
                const today = new Date();
                const distributedRoadmap = distributeMilestonesAcrossTimeline(
                    transformedRoadmap,
                    totalDays,
                    today
                );

                // If no milestones were generated, throw error to use fallback
                if (distributedRoadmap.length === 0) {
                    throw new Error('No milestones generated from AI response');
                }

                if (isMounted) {
                    setRoadmap(distributedRoadmap);
                }
            } catch (error) {
                console.warn('AI roadmap generation failed, using fallback:', error.message);
                
                // Log detailed error for debugging
                if (error.response) {
                    console.error('API Error Details:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                }
                
                // Only update state if component is still mounted
                if (!isMounted) return;
                
                // Show user-friendly notification (optional - can be removed if too intrusive)
                console.info('📋 Using simplified roadmap. You can customize milestones below.');
                
                // Create fallback roadmap based on user's goal
                const goal = formData.goal || 'this subject';
                const baseRoadmap = aiSummary?.roadmapPreview || [
                    `Introduction to ${goal}`,
                    `Core concepts and practice`,
                    `Advanced topics and projects`
                ];

                const baseMilestones = baseRoadmap.map((item, index) => ({
                    id: index,
                    title: typeof item === 'string' ? item.replace(/^Week\s+\d+(-\d+)?\s*:\s*/i, '') : item,
                    enabled: true,
                    description: `Complete this milestone to progress in ${goal}`,
                    completed: 0,
                    total: Math.floor(Math.random() * 6) + 5,
                    weight: 1 // Equal weight for fallback
                }));

                // ✨ NEW: Apply timeline distribution to fallback roadmap
                const totalDays = parseTimeframeToDays(formData.timeframe);
                const today = new Date();
                const fallbackRoadmap = distributeMilestonesAcrossTimeline(
                    baseMilestones,
                    totalDays,
                    today
                );

                if (isMounted) {
                    setRoadmap(fallbackRoadmap);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingRoadmap(false);
                }
            }
        };

        generateRoadmap();
        
        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, []); // Run once on component mount
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            type: 'bot',
            message: `Hi! I'm your AI learning assistant. I can help you restructure your ${formData.goal} roadmap with better milestones, timeline adjustments, and additional learning paths. What changes would you like to make?`,
            timestamp: new Date()
        }
    ]);
    
    const [currentMessage, setCurrentMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Create room object from form data
    const room = {
        name: aiSummary?.roomName || `${formData.goal} Mastery Group`,
        description: `Learn ${formData.goal} with personalized guidance`,
        avatar: formData.selectedTags[0]?.slice(0, 2).toUpperCase() || "SG",
        creator: "You",
        timeframe: formData.timeframe || "1 month",
        schedule: aiSummary?.schedule || `${formData.availability} sessions`,
        dailyTime: formData.dailyTime,
        proficiency: formData.proficiency,
        tags: formData.selectedTags
    };

    // Check if any roadmap items are enabled
    const hasEnabledSteps = roadmap.some(item => item.enabled);

    // Prevent navigation away
    useEffect(() => {
        let isActive = true;
        
        const handleBeforeUnload = (e) => {
            if (!isActive) return;
            e.preventDefault();
            e.returnValue = '';
        };

        const handlePopState = (e) => {
            if (!isActive) return;
            
            const shouldLeave = window.confirm(
                'Are you sure you want to leave? This will discard your room and you\'ll need to start over.'
            );
            
            if (shouldLeave) {
                isActive = false;
                navigate('/createroom', { replace: true });
            } else {
                if (isActive) {
                    window.history.pushState(null, '', window.location.pathname);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        
        // Only push state if component is active
        if (isActive) {
            window.history.pushState(null, '', window.location.pathname);
        }

        return () => {
            isActive = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    // Fixed constraint check - more logical for single-date roadmap
    const canChangeDate = (index, newDate) => {
        const newDateObj = parseDate(newDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for comparison
        
        // Can't set date in the past
        if (newDateObj < today) return false;
        
        // Check previous milestone constraint (if enabled)
        if (index > 0) {
            const prevItem = roadmap[index - 1];
            if (prevItem?.enabled) {
                const prevDate = parseDate(prevItem.endDate);
                // New date must be at least 1 day after previous milestone
                if (newDateObj <= prevDate) return false;
            }
        }
        
        // Check next milestone constraint (if enabled)
        if (index < roadmap.length - 1) {
            const nextItem = roadmap[index + 1];
            if (nextItem?.enabled) {
                const nextDate = parseDate(nextItem.endDate);
                // New date must be at least 1 day before next milestone
                if (newDateObj >= nextDate) return false;
            }
        }
        
        return true;
    };

    // Fixed date change handler
    const handleDateChange = (index, increment) => {
        const currentItem = roadmap[index];
        const newDate = addDays(currentItem.endDate, increment ? 1 : -1);

        if (canChangeDate(index, newDate)) {
            const newRoadmap = [...roadmap];
            newRoadmap[index] = {
                ...newRoadmap[index],
                endDate: newDate
            };
            setRoadmap(newRoadmap);
        }
    };

    // Toggle roadmap step enabled/disabled
    const toggleRoadmapStep = (index) => {
        const newRoadmap = [...roadmap];
        newRoadmap[index] = {
            ...newRoadmap[index],
            enabled: !newRoadmap[index].enabled
        };
        setRoadmap(newRoadmap);
    };

    // Toggle expanded state
    const toggleExpanded = (index) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedItems(newExpanded);
    };

    // ✨ NEW: Regenerate roadmap timeline (when user changes timeline in chat)
    const regenerateRoadmapWithNewTimeline = (newTimeframe) => {
        const totalDays = parseTimeframeToDays(newTimeframe);
        const today = new Date();
        
        // Preserve existing milestone structure, just recalculate dates
        const regenerated = distributeMilestonesAcrossTimeline(
            roadmap.map(m => ({
                ...m,
                // Keep all existing properties but recalculate dates
            })),
            totalDays,
            today
        );
        
        setRoadmap(regenerated);
        console.log(`✅ Roadmap regenerated for ${newTimeframe} (${totalDays} days)`);
    };

    // Calculate duration from previous milestone
    const getDuration = (index) => {
        if (index === 0) {
            // First milestone duration from today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = parseDate(roadmap[index].endDate);
            const diffTime = endDate - today;
            return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else {
            // Duration from previous milestone's end date
            const prevEndDate = parseDate(roadmap[index - 1].endDate);
            const currentEndDate = parseDate(roadmap[index].endDate);
            const diffTime = currentEndDate - prevEndDate;
            return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
    };

    // Enhanced roadmap item component with theme colors
    const RoadmapItem = ({ item, index }) => {
        const isExpanded = expandedItems.has(index);
        
        // Check if buttons can be used
        const canIncrement = item.enabled && canChangeDate(index, addDays(item.endDate, 1));
        const canDecrement = item.enabled && canChangeDate(index, addDays(item.endDate, -1));

        return (
            <motion.div 
                className={`group border-b border-text/10 last:border-b-0 transition-all duration-200 ${
                    item.enabled ? 'bg-background/50' : 'bg-alt/30'
                }`}
                whileHover={{ backgroundColor: item.enabled ? 'rgba(var(--color-primary-rgb), 0.04)' : 'rgba(var(--color-text-rgb), 0.05)' }}
            >
                <div 
                    className="flex items-center justify-between py-5 px-4 cursor-pointer"
                    onClick={() => toggleExpanded(index)}
                >
                    {/* Left side - enhanced checkbox and title */}
                    <div className="flex items-center gap-4">
                        <motion.div 
                            className={`relative w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                                item.enabled 
                                    ? 'bg-primary border-primary shadow-lg' 
                                    : 'border-text/30 hover:border-text/50'
                            }`}
                            style={{
                                boxShadow: item.enabled ? `0 4px 14px rgba(var(--color-primary-rgb), 0.25)` : 'none'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleRoadmapStep(index);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {item.enabled && (
                                <motion.div
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                    <CheckCircle size={16} className="text-background" />
                                </motion.div>
                            )}
                        </motion.div>
                        
                        <div className={`transition-colors duration-200 ${item.enabled ? 'text-text' : 'text-text/50'}`}>
                            <div className="font-semibold text-lg mb-1">
                                {item.title}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    item.enabled 
                                        ? 'text-primary' 
                                        : 'text-text/40'
                                }`}
                                style={{
                                    backgroundColor: item.enabled 
                                        ? `rgba(var(--color-primary-rgb), 0.1)` 
                                        : `rgba(var(--color-text-rgb), 0.05)`
                                }}>
                                    <Target size={12} />
                                    <span>{item.completed}/{item.total} tasks</span>
                                </div>
                                <div className="text-text/60">
                                    {getDuration(index)} days
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - enhanced date controls */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                            <div className="text-text/60 text-xs font-medium mb-1">Complete by</div>
                            <div className="flex items-center gap-2">
                                <motion.button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDateChange(index, false);
                                    }}
                                    disabled={!canDecrement}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        canDecrement 
                                            ? 'text-text hover:bg-red-500/10 hover:text-red-600 cursor-pointer' 
                                            : 'text-text/30 cursor-not-allowed'
                                    }`}
                                    whileHover={canDecrement ? { scale: 1.1 } : {}}
                                    whileTap={canDecrement ? { scale: 0.9 } : {}}
                                >
                                    <Minus size={14} />
                                </motion.button>
                                
                                <div className={`min-w-[80px] text-center font-bold text-lg px-3 py-2 rounded-lg transition-colors duration-200 border ${
                                    item.enabled 
                                        ? 'text-primary border-primary/20' 
                                        : 'text-text/50 border-text/20'
                                }`}
                                style={{
                                    backgroundColor: item.enabled 
                                        ? `rgba(var(--color-primary-rgb), 0.05)` 
                                        : `rgba(var(--color-text-rgb), 0.03)`
                                }}>
                                    {formatDisplayDate(item.endDate)}
                                </div>
                                
                                <motion.button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDateChange(index, true);
                                    }}
                                    disabled={!canIncrement}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        canIncrement 
                                            ? 'text-text hover:bg-green-500/10 hover:text-green-600 cursor-pointer' 
                                            : 'text-text/30 cursor-not-allowed'
                                    }`}
                                    whileHover={canIncrement ? { scale: 1.1 } : {}}
                                    whileTap={canIncrement ? { scale: 0.9 } : {}}
                                >
                                    <Plus size={14} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Enhanced expand icon */}
                        <motion.div 
                            className="ml-2 p-2 rounded-lg hover:bg-text/10 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                        >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </motion.div>
                    </div>
                </div>

                {/* Enhanced expanded content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-10 pb-6 border-t border-primary/20"
                                style={{
                                    background: `linear-gradient(to right, rgba(var(--color-primary-rgb), 0.03) 0%, rgba(var(--color-primary-rgb), 0.08) 100%)`
                                }}>
                                <div className="pt-4">
                                    <p className="text-text/80 mb-4 leading-relaxed">{item.description}</p>
                                    
                                    {/* Show topics if available */}
                                    {item.topics && item.topics.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target size={14} className="text-primary" />
                                                <span className="font-medium text-sm text-primary">Topics to Cover</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {item.topics.map((topic, idx) => (
                                                    <span 
                                                        key={idx}
                                                        className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                                    >
                                                        {typeof topic === 'string' ? topic : (topic?.title || 'Untitled Topic')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-background/70 p-3 rounded-lg border border-primary/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock size={14} className="text-primary" />
                                                <span className="font-medium text-sm text-primary">Duration</span>
                                            </div>
                                            <p className="text-text/80 text-sm">
                                                {getDuration(index)} days
                                                {index === 0 ? ' (from today)' : ' (from previous milestone)'}
                                            </p>
                                            {item.estimatedHours && (
                                                <p className="text-text/60 text-xs mt-1">
                                                    ~{item.estimatedHours}h total
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-background/70 p-3 rounded-lg border border-primary/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar size={14} className="text-primary" />
                                                <span className="font-medium text-sm text-primary">Target date</span>
                                            </div>
                                            <p className="text-text/80 text-sm font-semibold">
                                                {formatDisplayDate(item.endDate)}
                                            </p>
                                            {item.phase && (
                                                <p className="text-text/60 text-xs mt-1">
                                                    Phase: {item.phase}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-background/70 p-3 rounded-lg border border-primary/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Target size={14} className="text-primary" />
                                                <span className="font-medium text-sm text-primary">Status</span>
                                            </div>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                item.enabled 
                                                    ? 'text-primary' 
                                                    : 'text-text/60'
                                            }`}
                                            style={{
                                                backgroundColor: item.enabled 
                                                    ? `rgba(var(--color-primary-rgb), 0.1)` 
                                                    : `rgba(var(--color-text-rgb), 0.1)`
                                            }}>
                                                {item.enabled ? <CheckCircle size={12} /> : <X size={12} />}
                                                {item.enabled ? 'Enabled' : 'Disabled'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    // AI-powered roadmap optimization chat
    const sendMessage = async () => {
        if (!currentMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            message: currentMessage,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        const userQuery = currentMessage;
        setCurrentMessage("");
        setIsTyping(true);

        try {
            // Build context about the current roadmap
            const roadmapContext = roadmap.map((item, index) => {
                return `${index + 1}. ${item.title} (Complete by: ${formatDisplayDate(item.endDate)}, ${item.enabled ? 'Enabled' : 'Disabled'}, Duration: ${getDuration(index)} days)`;
            }).join('\n');

            console.log('🤖 Sending AI request...');
            console.log('Roadmap context:', roadmapContext);
            console.log('User query:', userQuery);

            // Detect if user wants to modify timeline
            const lowerQuery = userQuery.toLowerCase();
            const isTimelineAdjustment = 
                lowerQuery.includes('timeline') || 
                lowerQuery.includes('month') || 
                lowerQuery.includes('week') || 
                lowerQuery.includes('day') ||
                lowerQuery.includes('extend') ||
                lowerQuery.includes('compress') ||
                lowerQuery.includes('longer') ||
                lowerQuery.includes('shorter');

            let prompt = '';
            let shouldApplyChanges = false;

            if (isTimelineAdjustment) {
                // Request structured JSON for timeline changes
                shouldApplyChanges = true;
                prompt = `You are a learning roadmap optimizer. Analyze the user's request and adjust the milestone durations accordingly.

Current Roadmap:
${roadmapContext}

User Request: "${userQuery}"

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "explanation": "Brief 2-3 sentence explanation of changes",
  "adjustments": [
    {"index": 0, "newDuration": 10},
    {"index": 1, "newDuration": 8}
  ]
}

Rules:
- Adjust durations proportionally based on user's request
- Maintain logical progression (earlier milestones can be longer)
- Total timeline should match user's request (e.g., "3 months" = ~90 days)
- Include ALL ${roadmap.length} milestones in adjustments array`;
            } else {
                // Advice-only mode
                prompt = `You are a learning roadmap assistant.

Goal: ${formData.goal} (${formData.proficiency} level)
Topics: ${formData.selectedTags.join(', ')}
Daily: ${formData.dailyTime}

Current: ${roadmap.length} milestones, ${Math.ceil(roadmap.length * 7)} days

User: "${userQuery}"

Provide 2-3 sentence advice. Be specific and actionable.`;
            }

            const response = await aiService.generateText({
                prompt,
                maxTokens: 1000
            });

            console.log('✅ AI Response received:', response);

            // If timeline adjustment, parse JSON and apply changes
            if (shouldApplyChanges && response.text) {
                try {
                    // Extract JSON from response (handle markdown code blocks)
                    let jsonText = response.text.trim();
                    if (jsonText.startsWith('```')) {
                        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
                    }
                    
                    const parsed = JSON.parse(jsonText);
                    console.log('📊 Parsed AI adjustments:', parsed);

                    if (parsed.adjustments && Array.isArray(parsed.adjustments)) {
                        // Apply duration changes to roadmap
                        const updatedRoadmap = roadmap.map((milestone, idx) => {
                            const adjustment = parsed.adjustments.find(adj => adj.index === idx);
                            if (adjustment && adjustment.newDuration) {
                                // Calculate new end date based on duration
                                const prevEndDate = idx === 0 ? new Date() : updatedRoadmap[idx - 1].endDate;
                                const newEndDate = new Date(prevEndDate);
                                newEndDate.setDate(newEndDate.getDate() + adjustment.newDuration);

                                return {
                                    ...milestone,
                                    endDate: newEndDate
                                };
                            }
                            return milestone;
                        });

                        console.log('✅ Applying roadmap updates:', updatedRoadmap);
                        setRoadmap(updatedRoadmap);

                        const botMessage = {
                            id: Date.now() + 1,
                            type: 'bot',
                            message: `✅ Roadmap Updated!\n\n${parsed.explanation || 'Timeline adjusted based on your request.'}`,
                            timestamp: new Date()
                        };

                        setChatMessages(prev => [...prev, botMessage]);
                    } else {
                        throw new Error('Invalid adjustments format');
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse AI adjustments:', parseError);
                    console.log('Raw response:', response.text);
                    
                    // Fallback to showing the text response
                    const botMessage = {
                        id: Date.now() + 1,
                        type: 'bot',
                        message: response.text || "I understand you want to adjust the timeline. Please use the +/- buttons next to each milestone to manually adjust dates.",
                        timestamp: new Date()
                    };

                    setChatMessages(prev => [...prev, botMessage]);
                }
            } else {
                // Advice-only response
                const botMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    message: response.text || "I can help you optimize your roadmap. Could you be more specific about what you'd like to adjust - timeline, milestones, or topics?",
                    timestamp: new Date()
                };

                setChatMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('❌ AI chat error:', error);
            console.error('Error details:', error.response || error.message || error);
            
            // Fallback to intelligent mock responses based on keywords
            const lowerQuery = userQuery.toLowerCase();
            let response = '';
            
            if (lowerQuery.includes('extend') || lowerQuery.includes('longer') || lowerQuery.includes('more time')) {
                response = "I recommend extending each milestone by 5-7 days to give you more buffer time. Use the + buttons next to each date to adjust the completion dates.";
            } else if (lowerQuery.includes('compress') || lowerQuery.includes('faster') || lowerQuery.includes('shorter')) {
                response = "To compress the timeline, focus on the core milestones and consider reducing buffer time. Use the - buttons to adjust dates, but ensure realistic pacing.";
            } else if (lowerQuery.includes('add') || lowerQuery.includes('more') || lowerQuery.includes('additional')) {
                response = "Based on your topics, consider adding intermediate review milestones between major phases. This helps reinforce learning before moving forward.";
            } else if (lowerQuery.includes('remove') || lowerQuery.includes('skip') || lowerQuery.includes('disable')) {
                response = "You can disable specific milestones using the checkboxes. Focus on the most critical learning objectives for your goals.";
            } else {
                response = "I can help you adjust completion dates, add strategic milestones, or reorganize your learning path. What specific changes would you like to make?";
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                message: response,
                timestamp: new Date()
            };

            setChatMessages(prev => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleCreateRoomClick = () => {
        setShowScheduleModal(true);
    };

    const handleRoomCreation = async (startNow = true, scheduleDays = 0) => {
        const enabledRoadmap = roadmap.filter(item => item.enabled);
        
        if (!startNow && scheduleDays > 0) {
            enabledRoadmap.forEach((item, index) => {
                const newEndDate = new Date();
                newEndDate.setDate(newEndDate.getDate() + scheduleDays + ((index + 1) * 14));
                item.endDate = formatDate(newEndDate);
            });
        }
        
        const finalRoomData = {
            ...formData,
            aiSummary,
            customRoadmap: enabledRoadmap,
            scheduledStart: startNow ? 'now' : scheduleDays,
            roomStartDate: startNow ? formatDate(new Date()) : addDays(formatDate(new Date()), scheduleDays)
        };
        
        console.log("Creating room with schedule:", finalRoomData);
        
        // Call the actual API to create the room
        await onCreateRoom();
    };

    // Enhanced Schedule Modal with theme colors
    const ScheduleModal = () => {
        const [selectedDays, setSelectedDays] = useState(0);
        const maxDays = 7;
        
        const today = new Date();
        const scheduledDate = addDays(formatDate(today), selectedDays);

        return (
            <AnimatePresence>
                {showScheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowScheduleModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background rounded-3xl max-w-md w-full p-8 shadow-2xl border border-text/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                        <PlayCircle size={20} className="text-background" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-text">Start Your Journey</h3>
                                </div>
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="p-2 hover:bg-text/10 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-text" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-text/70 text-lg">
                                        When would you like to begin your learning adventure?
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Start Now Option - Enhanced with theme colors */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <button
                                            onClick={() => handleRoomCreation(true)}
                                            className="w-full bg-primary hover:bg-primary/90 text-background rounded-2xl p-6 flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-xl"
                                            style={{
                                                boxShadow: `0 10px 25px rgba(var(--color-primary-rgb), 0.3)`
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-background/20 rounded-xl flex items-center justify-center">
                                                    <Sparkles size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-xl">Start Now</div>
                                                    <div className="text-background/80">Begin your learning journey today</div>
                                                </div>
                                            </div>
                                            <ChevronDown className="rotate-[-90deg]" size={20} />
                                        </button>
                                    </motion.div>

                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-3 text-text/40 font-medium">
                                            <div className="h-px bg-text/20 flex-1"></div>
                                            <span>OR</span>
                                            <div className="h-px bg-text/20 flex-1"></div>
                                        </div>
                                    </div>

                                    {/* Schedule Option - Enhanced with theme colors */}
                                    <div className="border-2 border-text/10 rounded-2xl p-6 bg-alt/30">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Calendar size={20} className="text-primary" />
                                            <h4 className="font-bold text-xl text-text">Schedule for Later</h4>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-text/80 mb-3">
                                                Days from now (max {maxDays} days)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <motion.button
                                                    type="button"
                                                    onClick={() => setSelectedDays(Math.max(0, selectedDays - 1))}
                                                    disabled={selectedDays <= 0}
                                                    className="p-3 border-2 border-text/20 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Minus size={18} />
                                                </motion.button>
                                                
                                                <div className="flex-1 text-center bg-background rounded-xl p-4 border-2 border-text/20">
                                                    <div className="font-bold text-3xl text-primary mb-1">{selectedDays}</div>
                                                    <div className="text-sm text-text/60 font-medium">
                                                        {selectedDays === 0 ? 'Today' : 
                                                         selectedDays === 1 ? 'Tomorrow' : 
                                                         `${selectedDays} days`}
                                                    </div>
                                                </div>
                                                
                                                <motion.button
                                                    type="button"
                                                    onClick={() => setSelectedDays(Math.min(maxDays, selectedDays + 1))}
                                                    disabled={selectedDays >= maxDays}
                                                    className="p-3 border-2 border-text/20 rounded-xl hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Plus size={18} />
                                                </motion.button>
                                            </div>
                                        </div>

                                        <div className="mb-6 p-4 rounded-xl border border-primary/20"
                                            style={{
                                                background: `linear-gradient(to right, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(var(--color-primary-rgb), 0.1) 100%)`
                                            }}>
                                            <div className="flex items-center gap-3 text-primary mb-2">
                                                <Calendar size={18} />
                                                <span className="font-semibold">Start Date</span>
                                            </div>
                                            <div className="font-bold text-xl text-text">
                                                {formatDisplayDate(scheduledDate)}
                                            </div>
                                        </div>

                                        <motion.button
                                            onClick={() => handleRoomCreation(false, selectedDays)}
                                            disabled={selectedDays === 0}
                                            className="w-full bg-background border-2 border-primary/30 hover:border-primary hover:bg-primary/5 text-text rounded-xl p-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: selectedDays > 0 ? 1.02 : 1 }}
                                            whileTap={{ scale: selectedDays > 0 ? 0.98 : 1 }}
                                        >
                                            Schedule Room
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    // Timeline Change Modal
    const TimelineModal = () => {
        const [selectedTimeline, setSelectedTimeline] = useState(formData.timeframe || '3months');
        
        const timelineOptions = [
            { value: '2weeks', label: '2 Weeks', days: 14 },
            { value: '1month', label: '1 Month', days: 30 },
            { value: '3months', label: '3 Months', days: 90 },
            { value: '6months', label: '6 Months', days: 180 },
            { value: '1year', label: '1 Year', days: 365 }
        ];

        const handleApplyTimeline = () => {
            // Update form data
            formData.timeframe = selectedTimeline;
            
            // Regenerate roadmap with new timeline
            regenerateRoadmapWithNewTimeline(selectedTimeline);
            
            // Close modal
            setShowTimelineModal(false);
        };

        return (
            <AnimatePresence>
                {showTimelineModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTimelineModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background rounded-3xl max-w-md w-full p-8 shadow-2xl border border-text/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                        <RefreshCw size={20} className="text-background" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-text">Change Timeline</h3>
                                </div>
                                <button
                                    onClick={() => setShowTimelineModal(false)}
                                    className="p-2 hover:bg-text/10 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-text" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-text/70 text-sm leading-relaxed">
                                        Select a new timeline duration. All milestone dates will be automatically 
                                        redistributed proportionally across the new timeline.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {timelineOptions.map((option) => (
                                        <motion.button
                                            key={option.value}
                                            onClick={() => setSelectedTimeline(option.value)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                                selectedTimeline === option.value
                                                    ? 'bg-primary/10 border-primary text-text'
                                                    : 'bg-background border-text/20 text-text/80 hover:border-text/40'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-base">{option.label}</div>
                                                    <div className="text-sm text-text/60 mt-1">
                                                        {option.days} days total
                                                    </div>
                                                </div>
                                                {selectedTimeline === option.value && (
                                                    <CheckCircle size={20} className="text-primary" />
                                                )}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowTimelineModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border-2 border-text/20 text-text font-medium hover:bg-text/5 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApplyTimeline}
                                        disabled={selectedTimeline === formData.timeframe}
                                        className="flex-1 px-6 py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                                        style={{
                                            boxShadow: selectedTimeline !== formData.timeframe 
                                                ? '0 10px 25px rgba(var(--color-primary-rgb), 0.3)' 
                                                : 'none'
                                        }}
                                    >
                                        Apply Changes
                                    </button>
                                </div>

                                {selectedTimeline !== formData.timeframe && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                                    >
                                        <p className="text-xs text-text/70 text-center">
                                            ⚠️ This will recalculate all milestone dates while preserving their structure
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="min-h-screen bg-gradient transition-colors duration-300 md:ml-20 mb-20 md:mb-0">
            {/* Enhanced Header with Group Details - KEPT EXACTLY THE SAME */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/90 backdrop-blur-sm border-b border-text/10 p-4 md:p-6"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {/* Group Info Section */}
                        <div className="flex items-center gap-4 flex-1">
                            <Avatar name={room.avatar} size="lg" />
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-text mb-1">{room.name}</h1>
                                <p className="text-text/70 mb-2">Created by {room.creator}</p>
                                
                                {/* Room Details in Compact Format */}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-text/60">
                                        <Target size={14} />
                                        <span className="capitalize">{room.proficiency}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-text/60">
                                        <Clock size={14} />
                                        <span>{room.dailyTime}/day</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-text/60">
                                        <Calendar size={14} />
                                        <span>{room.timeframe}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-text/60">
                                        <Users size={14} />
                                        <span>{room.schedule}</span>
                                    </div>
                                </div>
                                
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {room.tags.slice(0, 3).map((tag, index) => (
                                        <Badge key={index} variant="outline" size="sm">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {room.tags.length > 3 && (
                                        <Badge variant="outline" size="sm">
                                            +{room.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Create Room Button */}
                        <div className="flex flex-col items-end gap-2">
                            <Button
                                onClick={handleCreateRoomClick}
                                disabled={!hasEnabledSteps}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                Create Room
                            </Button>
                            {!hasEnabledSteps && (
                                <p className="text-xs text-red-500">Enable at least one milestone</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-6xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Enhanced Roadmap Editor with theme colors */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-8 shadow-xl border-0 bg-background/80 backdrop-blur-sm">
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                            <Map size={20} className="text-background" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-text">
                                            Your Learning Roadmap
                                        </h3>
                                    </div>
                                    <p className="text-text/70 leading-relaxed">
                                        Customize your learning journey by setting completion dates for each milestone. 
                                        Use the checkboxes to enable or disable specific milestones based on your goals.
                                    </p>
                                    
                                    {/* Timeline Summary */}
                                    {roadmap.length > 0 && (
                                        <div className="mt-6 p-4 rounded-xl border border-primary/20"
                                            style={{
                                                background: `linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(var(--color-primary-rgb), 0.1) 100%)`
                                            }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-primary" />
                                                    <h4 className="text-sm font-semibold text-text">Timeline Summary</h4>
                                                </div>
                                                <button
                                                    onClick={() => setShowTimelineModal(true)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Edit3 size={12} />
                                                    Change
                                                </button>
                                            </div>
                                            {(() => {
                                                const summary = getTimelineSummary(roadmap);
                                                const timelineText = formData.timeframe?.startsWith('custom-') 
                                                    ? `${formData.timeframe.replace('custom-', '')} days`
                                                    : formData.timeframe?.replace('weeks', ' weeks').replace('month', ' month').replace('months', ' months').replace('year', ' year');
                                                
                                                return (
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-text/60">Total Timeline</span>
                                                            <span className="font-semibold text-text">{timelineText || 'Not set'}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-text/60">Milestones</span>
                                                            <span className="font-semibold text-text">{summary.totalMilestones}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-text/60">Start Date</span>
                                                            <span className="font-semibold text-text">{summary.startDate}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-text/60">End Date</span>
                                                            <span className="font-semibold text-text">{summary.endDate}</span>
                                                        </div>
                                                        <div className="flex flex-col col-span-2">
                                                            <span className="text-text/60">Avg. Duration per Milestone</span>
                                                            <span className="font-semibold text-text">
                                                                {summary.averageDuration} {summary.averageDuration === 1 ? 'day' : 'days'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-alt/20 border-2 border-text/10 rounded-2xl overflow-hidden"
                                    style={{
                                        background: `linear-gradient(to bottom right, rgba(var(--color-alt-rgb), 0.2) 0%, rgba(var(--color-primary-rgb), 0.05) 100%)`
                                    }}>
                                    {isLoadingRoadmap ? (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-text/70 font-medium">Generating your personalized roadmap...</p>
                                            <p className="text-text/50 text-sm">Using AI to create optimal milestones</p>
                                        </div>
                                    ) : roadmap.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Target className="w-16 h-16 text-text/30 mb-4" />
                                            <p className="text-text/70">No roadmap generated</p>
                                        </div>
                                    ) : (
                                        roadmap.map((step, index) => (
                                            <RoadmapItem 
                                                key={step.id} 
                                                item={step} 
                                                index={index} 
                                            />
                                        ))
                                    )}
                                </div>

                                {!hasEnabledSteps && (
                                    <motion.div 
                                        className="text-center py-12"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <div className="w-20 h-20 bg-alt rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Target className="w-10 h-10 text-text/40" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-text/80 mb-2">No Milestones Selected</h4>
                                        <p className="text-text/60 max-w-sm mx-auto">
                                            All milestones are currently disabled. Enable at least one milestone to create your learning room!
                                        </p>
                                    </motion.div>
                                )}
                            </Card>
                        </motion.div>
                    </div>

                    {/* Enhanced AI Chatbot Assistant with theme colors */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 shadow-xl border-0 bg-background/80 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-background" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text text-lg">AI Roadmap Assistant</h3>
                                        <p className="text-text/60 text-sm">Powered by advanced AI</p>
                                    </div>
                                </div>
                                
                                <div className="rounded-xl p-4 mb-6 border border-primary/20"
                                    style={{
                                        background: `linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(var(--color-primary-rgb), 0.1) 100%)`
                                    }}>
                                    <p className="text-text/80 text-sm leading-relaxed">
                                        Get intelligent help to restructure your roadmap, optimize timelines, 
                                        add strategic milestones, or adjust completion dates based on your learning style.
                                    </p>
                                </div>
                                
                                {/* Enhanced Chat Messages with theme colors */}
                                <div className="h-80 overflow-y-auto mb-6 space-y-4 p-4 rounded-xl border border-text/10"
                                    style={{
                                        background: `linear-gradient(to bottom right, rgba(var(--color-alt-rgb), 0.1) 0%, rgba(var(--color-primary-rgb), 0.03) 100%)`
                                    }}>
                                    {chatMessages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex gap-3 max-w-xs ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                                    msg.type === 'user' 
                                                        ? 'bg-primary text-background' 
                                                        : 'bg-background border-2 border-primary/20 text-primary'
                                                }`}>
                                                    {msg.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                                                </div>
                                                <div className={`p-4 rounded-2xl shadow-sm ${
                                                    msg.type === 'user' 
                                                        ? 'bg-primary text-background' 
                                                        : 'bg-background border border-text/20 text-text'
                                                }`}>
                                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    
                                    {isTyping && (
                                        <motion.div 
                                            className="flex justify-start"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-background border-2 border-primary/20 flex items-center justify-center shadow-sm">
                                                    <Bot size={14} className="text-primary" />
                                                </div>
                                                <div className="p-4 bg-background border border-text/20 rounded-2xl shadow-sm">
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                
                                {/* Enhanced Chat Input with theme colors */}
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Ask AI to optimize your roadmap..."
                                        className="flex-1 p-4 border-2 border-text/20 rounded-xl bg-background text-text focus:outline-none focus:border-primary focus:ring-4 transition-all duration-200 placeholder-text/50"
                                        style={{
                                            focusRingColor: `rgba(var(--color-primary-rgb), 0.1)`
                                        }}
                                    />
                                    <motion.button
                                        onClick={sendMessage}
                                        disabled={!currentMessage.trim() || isTyping}
                                        className="p-4 bg-primary text-background rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all duration-200 shadow-lg"
                                        style={{
                                            boxShadow: `0 4px 14px rgba(var(--color-primary-rgb), 0.3)`
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Send size={16} />
                                    </motion.button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Enhanced Schedule Modal */}
            <ScheduleModal />
            
            {/* Timeline Change Modal */}
            <TimelineModal />
        </div>
    );
};

export default CreatedRoom;
