import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Book, ArrowRight } from 'lucide-react';
import { roomService } from '../../../../services/roomService';
import { apiClient } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';

// Get real learning resources based on topic
const getTopicResources = (topicTitle) => {
	const normalizedTopic = topicTitle.toLowerCase();
	
	// Mapping of topics to actual learning resources
	const resourceMap = {
		'internet vs web': [
			{ title: 'How Does the Internet Work? - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work', type: 'documentation' },
			{ title: 'Khan Academy: Internet 101', url: 'https://www.khanacademy.org/computing/computers-and-internet', type: 'documentation' },
		],
		'browsers': [
			{ title: 'How Browsers Work - Web.dev', url: 'https://web.dev/articles/howbrowserswork', type: 'documentation' },
			{ title: 'Chrome DevTools Docs', url: 'https://developer.chrome.com/docs/devtools/', type: 'documentation' },
		],
		'http/s': [
			{ title: 'HTTP Protocol - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'documentation' },
			{ title: 'HTTP Status Codes Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status', type: 'documentation' },
		],
		'urls': [
			{ title: 'What is a URL? - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL', type: 'documentation' },
			{ title: 'URI Generic Syntax - RFC 3986', url: 'https://datatracker.ietf.org/doc/html/rfc3986', type: 'documentation' },
		],
		'html structure': [
			{ title: 'HTML Basics - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics', type: 'documentation' },
			{ title: 'HTML Tutorial - W3Schools', url: 'https://www.w3schools.com/html/', type: 'documentation' },
		],
		'tags': [
			{ title: 'HTML Elements Reference - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element', type: 'documentation' },
			{ title: 'HTML Cheat Sheet', url: 'https://htmlcheatsheet.com/', type: 'documentation' },
		],
		'elements': [
			{ title: 'HTML Elements - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element', type: 'documentation' },
			{ title: 'Semantic HTML - MDN', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics', type: 'documentation' },
		],
	};
	
	// Try to find exact match, then partial match
	for (const [key, resources] of Object.entries(resourceMap)) {
		if (normalizedTopic === key || normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
			return resources;
		}
	}
	
	// Default resources
	return [
		{ title: 'MDN Learn Web Development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', type: 'documentation' },
		{ title: 'Oracle Java Tutorials', url: 'https://docs.oracle.com/javase/tutorial/', type: 'documentation' },
	];
};

// Fetch AI-generated study content from backend
const generateStudyContent = async (topicTitle, roadmapContext) => {
	try {
		console.log(`🎯 Generating content for: ${topicTitle}`);
		console.log(`🎯 Roadmap context: ${roadmapContext}`);
		
		// Don't create another timeout - apiClient already has one
		// Just increase the timeout for content generation specifically
		const response = await apiClient.post(API_ENDPOINTS.CONTENT.GENERATE, {
			topicTitle,
			roadmapContext
		}, {
			timeout: 60000 // 60 second timeout for AI generation
		});

		console.log('📦 Raw API response:', response);
		console.log('📦 response.success:', response.success);
		console.log('📦 response.data:', response.data);

		if (response.success && response.data) {
			console.log(`✅ Content generated successfully`);
			console.log('✅ Content structure:', {
				hasContent: !!response.data.content,
				hasCodeExample: !!response.data.codeExample,
				hasResources: !!response.data.studyResources
			});
			return response.data;
		}

		// Fallback if response is invalid
		console.warn('⚠️ Invalid response from content API, using fallback. Response:', response);
		return getFallbackContent(topicTitle);
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('❌ Content generation timed out after 30s');
		} else {
			console.error('❌ Failed to generate content. API Error:', error.response?.data || error.message);
		}
		return getFallbackContent(topicTitle);
	}
};

// Fallback content if API fails
const getFallbackContent = (topicTitle) => {
	return {
		content: `${topicTitle} is an essential concept in modern web development. Understanding this topic will enhance your development skills and make you more productive.\n\nThis topic works by organizing code in a structured way. Think of it as a blueprint that helps you build scalable and maintainable software. The core principle is to break down complex problems into manageable pieces.\n\nLearning ${topicTitle} provides the foundation for building robust applications. You'll learn best practices and common patterns used by professionals, understand how to apply concepts in real-world scenarios, and master debugging and optimization techniques.`,
		codeExample: `// Practical Example: ${topicTitle}\n\nfunction demonstrate() {\n  // Step 1: Setup\n  const data = getData();\n  \n  // Step 2: Process\n  const result = processData(data);\n  \n  // Step 3: Output\n  return result;\n}\n\n// This pattern is commonly used in production code`,
		studyResources: [
			{
				type: 'documentation',
				title: 'MDN Learn Web Development',
				url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development'
			}
		]
	};
};

const StudyLayout = ({ 
	milestone, 
	roomData, 
	userId,
	onClose, 
	onSubtopicComplete,
	onTopicComplete,
	timerState,
	onPauseResume,
	onCompleteSession,
	onResetTimer,
	userProgress,
	streak = 0,
	onlineMembers = [],
	specificTopic = null, // New prop for pre-selected topic
	todaysTasks = [], // Today's scheduled tasks
	onMilestoneChange = null // Callback to change milestone
}) => {
	const [activeSubtopic, setActiveSubtopic] = useState(null);
	const [completedSubtopics, setCompletedSubtopics] = useState([]);
	const [studyContent, setStudyContent] = useState(null);
	const [completing, setCompleting] = useState(false);
	const [showCodeExample, setShowCodeExample] = useState(false);
	const [showCompletionModal, setShowCompletionModal] = useState(false);
	const [isExtraTopic, setIsExtraTopic] = useState(false);
	const [completedTopicName, setCompletedTopicName] = useState('');
	
	// ✨ Prevent useEffect from resetting activeSubtopic right after completion
	const justCompletedRef = React.useRef(false);
	
	// Cache for study content to avoid re-fetching and enable prefetching
	const contentCache = React.useRef({});

	// Helper to fetch content (checks cache first)
	const fetchContent = async (topic, context) => {
		const topicTitle = typeof topic === 'string' ? topic : topic.title;
		if (!topicTitle) {
			console.warn('⚠️ fetchContent called with no topic title');
			return null;
		}
		
		// Check cache
		if (contentCache.current[topicTitle]) {
			console.log(`📦 Using cached content for: ${topicTitle}`);
			return contentCache.current[topicTitle];
		}
		
		// Fetch from API
		console.log(`🌐 Fetching content from API for: ${topicTitle}`);
		const content = await generateStudyContent(topicTitle, context);
		
		// Update cache only if we got valid content
		if (content && content.content) {
			console.log(`✅ Cached content for: ${topicTitle}`);
			contentCache.current[topicTitle] = content;
		} else {
			console.warn(`⚠️ Failed to fetch content for: ${topicTitle}`);
		}
		return content;
	};

	// Track the last loaded topic to prevent duplicate loads
	const lastLoadedTopic = React.useRef(null);

	// Effect to load content when activeSubtopic changes (and prefetch next topics)
	useEffect(() => {
		if (!activeSubtopic || !milestone) return;

		const topicTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic.title;
		
		// Always reset lastLoadedTopic when activeSubtopic changes to allow reload
		console.log(`🔄 Topic changed to: ${topicTitle}`);
		lastLoadedTopic.current = topicTitle;
		
		const roadmapContext = roomData?.roadmap?.title || milestone?.title || '';

		// Load content only when user navigates to the topic (no prefetching)
		const loadContent = async () => {
			console.log(`🔄 Loading content for topic: ${topicTitle}`);
			
			// Check cache first
			const cachedContent = contentCache.current[topicTitle];
			if (cachedContent) {
				console.log(`📦 Found in cache, setting immediately: ${topicTitle}`);
				setStudyContent(cachedContent);
			} else {
				// Not in cache, fetch and show loading state
				console.log(`⏳ Not cached, fetching: ${topicTitle}`);
				setStudyContent(null);
				const content = await fetchContent(activeSubtopic, roadmapContext);
				if (content) {
					console.log(`✅ Content fetched and set for: ${topicTitle}`);
					setStudyContent(content);
				} else {
					console.error(`❌ No content received for: ${topicTitle}`);
				}
			}
		};

		loadContent();
	}, [activeSubtopic, milestone?.id]); // Only depend on milestone ID, not entire object

	// ✨ Track the milestone ID that was last initialized to prevent unexpected resets on socket sync
	const initializedMilestoneId = React.useRef(null);

	// Initialize first topic or specific topic
	useEffect(() => {
		console.log('🔄 StudyLayout useEffect - milestone:', milestone, 'specificTopic:', specificTopic);
		
		// ✨ Skip reset if we just completed a topic IN THE SAME MILESTONE
		if (justCompletedRef.current && milestone?.id === initializedMilestoneId.current) {
			console.log('⏭️ Skipping topic reset — justCompletedRef is true and milestone unchanged');
			return;
		}

		if (milestone?.id && initializedMilestoneId.current === milestone.id && !specificTopic) {
			// Don't auto-reset the topic just because of a room data sync if we're already active in this milestone
			if (activeSubtopic) {
				console.log('⏭️ Skipping topic reset — already initialized and active in this milestone');
				return;
			}
		}

		if (milestone && milestone.topics && milestone.topics.length > 0) {
			initializedMilestoneId.current = milestone.id;
			// If specific topic is provided, use it
			if (specificTopic) {
				console.log('✅ Using specific topic:', specificTopic);
				setActiveSubtopic(specificTopic);
				return;
			}
			
			// ✨ NEW: If milestone has currentTopicTitle, start there
			if (milestone.currentTopicTitle) {
				const currentTopic = milestone.topics.find(t => {
					const tTitle = typeof t === 'string' ? t : t.title;
					return tTitle === milestone.currentTopicTitle;
				});
				
				if (currentTopic) {
					console.log('📍 Starting at current topic:', milestone.currentTopicTitle);
					setActiveSubtopic(currentTopic);
					return;
				}
			}
			
			// Otherwise find first uncompleted
			const firstUncompleted = milestone.topics.find(
				topic => {
					if (typeof topic !== 'object') return true; // string topics are always "pending"
					// Check BOTH status field AND isCompleted field (backend uses isCompleted)
					const isCompletedByStatus = topic.status === 'completed';
					const isCompletedByFlag = topic.isCompleted === true;
					return !isCompletedByStatus && !isCompletedByFlag;
				}
			);
			const selected = firstUncompleted || milestone.topics[0];
			console.log('📌 Selected first uncompleted topic:', selected);
			setActiveSubtopic(selected);
		}
	}, [milestone, specificTopic]); // DO NOT include roomData — socket refreshes must not reset the active topic

	const handleTopicSelect = async (topic) => {
		setActiveSubtopic(topic);
		// Content loading is now handled by useEffect
	};

	const handleMarkComplete = async () => {
		if (!activeSubtopic) return;

		// Use raw title (with backticks) for backend operations
		const topicTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic.title;
		const topicId = typeof activeSubtopic === 'object' ? (activeSubtopic.topicId || activeSubtopic._id || activeSubtopic.id) : null;
		const milestoneId = milestone?.backendMilestoneId || milestone?.milestoneId || milestone?.id || milestone?._id;
		const topicIndex = milestone?.topics?.findIndex((t) => {
			const title = typeof t === 'string' ? t : t?.title;
			return title === topicTitle;
		}) ?? -1;

		console.log('🔍 handleMarkComplete DEBUG:');
		console.log('   activeSubtopic:', activeSubtopic);
		console.log('   topicTitle:', topicTitle);
		console.log('   topicId:', topicId);
		console.log('   roomData.id:', roomData?.id);
		console.log('   userId:', userId);
		console.log('   milestone:', milestone);

		if (!completedSubtopics.includes(topicTitle)) {
			// Optimistically update UI
			setCompletedSubtopics([...completedSubtopics, topicTitle]);

			if (roomData?.id && userId && milestoneId && topicIndex >= 0) {
				try {
					setCompleting(true);

					console.log('📤 Sending to backend:', {
						roomId: roomData.id,
						milestoneId,
						topicIndex,
						userId,
					});

					const response = await roomService.completeTopicAndUpdateProgress(
						roomData.id,
						milestoneId,
						topicIndex
					);

					console.log('✅ Topic completed successfully:', response);

					// ✨ CAPTURE THE COMPLETED TOPIC NAME for modal display
					setCompletedTopicName(topicTitle);

					// ✨ UPDATE LOCAL activeSubtopic status (for UI display only)
					// Keep the original structure, just add/update the status
					setActiveSubtopic(prev => {
						if (typeof prev === 'string') {
							// If it's a string, convert to object but keep title
							const updated = { title: prev, status: 'completed' };
							console.log('   Updated activeSubtopic (string->object):', updated);
							return updated;
						} else {
							// If it's already an object, just update status
							const updated = { ...prev, status: 'completed' };
							console.log('   Updated activeSubtopic (object):', updated);
							return updated;
						}
					});

					// ✨ CHECK IF THIS IS AN EXTRA TOPIC (beyond today's tasks)
					console.log('🔍 Checking if extra topic...');
					console.log('  📋 Today\'s tasks:', todaysTasks);
					console.log('  📝 Completed topic:', topicTitle);
					
					// Check if the completed topic matches any of today's scheduled tasks
					// Normalize titles by removing backticks and extra spaces for comparison
					const normalizeTitle = (title) => {
						if (!title) return '';
						return title.replace(/`/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
					};
					
					const normalizedCompletedTitle = normalizeTitle(topicTitle);
					
					console.log('🔍 TODAY\'S TASKS DEBUG:');
					console.log('  📋 Total tasks:', todaysTasks.length);
					console.log('  📝 Completed topic title (raw):', topicTitle);
					console.log('  📝 Completed topic title (normalized):', normalizedCompletedTitle);
					todaysTasks.forEach((task, idx) => {
						const taskTitle = task.title || task.topicTitle || '';
						const normalizedTaskTitle = normalizeTitle(taskTitle);
						console.log(`  ${idx + 1}. Task title (raw): "${taskTitle}"`);
						console.log(`     Task title (normalized): "${normalizedTaskTitle}"`);
						console.log(`     Match: ${normalizedTaskTitle === normalizedCompletedTitle}`);
					});
					
					const isScheduledForToday = todaysTasks.some(task => {
						// Match by topic title
						const taskTitle = task.title || task.topicTitle || '';
						const normalizedTaskTitle = normalizeTitle(taskTitle);
						return normalizedTaskTitle === normalizedCompletedTitle;
					});
					
					console.log(`📋 Topic "${topicTitle}" scheduled for today:`, isScheduledForToday);
					console.log(`🎯 Is extra topic:`, !isScheduledForToday);
					setIsExtraTopic(!isScheduledForToday);
					
					// Set ref to prevent useEffect from resetting activeSubtopic
					justCompletedRef.current = true;
					// Clear after 3 seconds (enough time for refetch to complete)
					setTimeout(() => { justCompletedRef.current = false; }, 3000);

					// ✨ SHOW COMPLETION MODAL instead of auto-advancing
					setShowCompletionModal(true);

					// Emit socket event
					if (roomService.emitEvent) {
						roomService.emitEvent('room:topicCompleted', {
							userId,
							milestoneId: milestone.id,
							topicId: topicId || topicTitle,  // Use title as fallback
							topicTitle,
							completedAt: new Date().toISOString(),
						});
					}

					// Call parent callback to trigger refetch
					if (onTopicComplete) {
						await onTopicComplete({
							milestoneId: milestoneId,
							milestone,
							topicId: topicId || topicTitle,  // Use title as fallback
							topicTitle,
							order: topicIndex,
						});
					}
					
					// Also trigger subtopic complete for refetch
					if (onSubtopicComplete) {
						await onSubtopicComplete({
							topic: activeSubtopic,
							milestone: milestone
						});
					}
				} catch (error) {
					console.error('❌ Failed to mark topic complete:', error);
					// Revert optimistic update on error
					setCompletedSubtopics((prev) => prev.filter((t) => t !== topicTitle));
				} finally {
					setCompleting(false);
				}
			} else {
				// Fallback for local-only completion
				if (onSubtopicComplete) {
					onSubtopicComplete({
						topic: activeSubtopic,
						milestone: milestone
					});
				}
			}
		}
	};

	const handleNext = () => {
		console.log('🚀 handleNext called');
		console.log('   milestone:', milestone);
		console.log('   milestone.topics:', milestone?.topics);
		console.log('   activeSubtopic:', activeSubtopic);
		
		if (!milestone || !milestone.topics) {
			console.log('❌ No milestone or topics');
			return;
		}
		
		const currentIndex = milestone.topics.findIndex(t => {
			const tTitle = typeof t === 'string' ? t : t.title;
			const aTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic?.title;
			const match = tTitle === aTitle;
			console.log(`   Comparing: "${tTitle}" === "${aTitle}" = ${match}`);
			return match;
		});
		
		console.log('🔄 handleNext - currentIndex:', currentIndex, 'totalTopics:', milestone.topics.length);
		console.log('   Current topic:', activeSubtopic);
		
		if (currentIndex === -1) {
			console.error('❌ Current topic not found in milestone.topics!');
			console.log('   Looking for:', typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic?.title);
			console.log('   Available topics:', milestone.topics.map(t => typeof t === 'string' ? t : t.title));
			return;
		}
		
		if (currentIndex >= 0 && currentIndex < milestone.topics.length - 1) {
			// Move to next UNCOMPLETED topic in same milestone
			// Don't just pick currentIndex+1 — skip any already-completed topics
			let nextTopic = null;
			for (let i = currentIndex + 1; i < milestone.topics.length; i++) {
				const candidate = milestone.topics[i];
				const candidateTitle = typeof candidate === 'string' ? candidate : candidate?.title;
				const candidateStatus = typeof candidate === 'object' ? candidate.status : 'pending';
				const candidateIsCompleted = typeof candidate === 'object' && candidate.isCompleted;
				const isCompletedLocally = completedSubtopics.includes(candidateTitle);
				
				if (candidateStatus !== 'completed' && !candidateIsCompleted && !isCompletedLocally) {
					nextTopic = candidate;
					break;
				}
			}
			
			if (nextTopic) {
				console.log('➡️ Moving to next uncompleted topic:', nextTopic);
				try {
					handleTopicSelect(nextTopic);
					console.log('✅ Topic selection completed');
				} catch (error) {
					console.error('❌ Error selecting next topic:', error);
				}
			} else {
				// All remaining topics are completed — treat like end of milestone
				console.log('🏁 All remaining topics completed in this milestone.');
				if (roomData?.roadmap?.phases && onMilestoneChange) {
					let foundNext = false;
					let currentMilestoneFound = false;
					for (const phase of roomData.roadmap.phases) {
						for (const m of phase.milestones) {
							if (currentMilestoneFound) {
								console.log('✅ Found next milestone:', m.title);
								onMilestoneChange(m);
								foundNext = true;
								break;
							}
							const mId = m.id || m._id;
							const currentId = milestone.id || milestone._id;
							if (mId === currentId || m.title === milestone.title) {
								currentMilestoneFound = true;
							}
						}
						if (foundNext) break;
					}
					if (!foundNext) alert('🎉 Congratulations! You\'ve completed all topics in this milestone!');
				} else {
					alert('🎉 You\'ve completed all topics in this milestone!');
				}
			}
			// Content loading is now handled by useEffect
		} else if (currentIndex === milestone.topics.length - 1) {
			// Last topic in milestone - try to move to next milestone
			console.log('🏁 Last topic in milestone. Looking for next milestone...');
			
			if (roomData?.roadmap?.phases && onMilestoneChange) {
				// Find current milestone in roadmap
				let foundNext = false;
				let currentMilestoneFound = false;
				
				for (const phase of roomData.roadmap.phases) {
					for (const m of phase.milestones) {
						if (currentMilestoneFound) {
							// This is the next milestone!
							console.log('✅ Found next milestone:', m.title);
							onMilestoneChange(m);
							foundNext = true;
							break;
						}
						
						// Check if this is the current milestone
						const mId = m.id || m._id;
						const currentId = milestone.id || milestone._id;
						if (mId === currentId || m.title === milestone.title) {
							console.log('📍 Found current milestone, looking for next...');
							currentMilestoneFound = true;
						}
					}
					if (foundNext) break;
				}
				
				if (!foundNext) {
					console.log('🎓 No more milestones - you completed the entire roadmap!');
					alert('🎉 Congratulations! You\'ve completed all topics in this milestone!');
				}
			} else {
				console.log('⚠️ Cannot move to next milestone - missing roadmap data or onMilestoneChange callback');
				alert('🎉 You\'ve completed all topics in this milestone!');
			}
		} else {
			console.log('🏁 No more topics in this milestone');
		}
	};

	const handleContinueToNext = () => {
		console.log('🎯 handleContinueToNext called');
		setShowCompletionModal(false);
		
		// Use setTimeout to ensure modal closes before navigation
		setTimeout(() => {
			console.log('🚀 Calling handleNext after modal close');
			handleNext(); // Move to next topic
		}, 100);
	};

	const handleStayOnTopic = () => {
		setShowCompletionModal(false);
		// User stays on current completed topic
	};

	const formatTime = (seconds) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Format topic title - remove backticks and clean up HTML tags
	const formatTopicTitle = (title) => {
		if (!title) return '';
		return title
			.replace(/`/g, '') // Remove backticks
			.replace(/<(\w+)>/g, '$1') // Convert <tag> to tag
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();
	};
	
	const rawTopicTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic?.title;
	const activeTopicTitle = formatTopicTitle(rawTopicTitle);
	const activeTopicStatus = (activeSubtopic && typeof activeSubtopic === 'object') ? (activeSubtopic.isCompleted ? 'completed' : (activeSubtopic.status || 'pending')) : 'pending';
	const isCompleted = activeTopicStatus === 'completed' || (activeSubtopic && typeof activeSubtopic === 'object' && activeSubtopic.isCompleted) || completedSubtopics.includes(activeTopicTitle);

	// Debug logging for completion status (commented out to reduce spam)
	// console.log('🔍 Completion Status Check:');
	// console.log('   activeSubtopic:', activeSubtopic);
	// console.log('   activeTopicTitle:', activeTopicTitle);
	// console.log('   activeTopicStatus:', activeTopicStatus);
	// console.log('   completedSubtopics:', completedSubtopics);
	// console.log('   isCompleted:', isCompleted);

	if (!milestone) {
		return null;
	}

	return (
		<div className="flex-1 p-4 flex gap-4 items-start justify-center overflow-hidden">
			{/* Study Content Panel - Compact with Max Height */}
		<div className="flex-1 max-w-3xl max-h-[calc(100vh-8rem)] bg-slate-900/50 border border-cyan-500/30 rounded-xl overflow-hidden flex flex-col">
			{!studyContent ? (
				<div className="flex-1 flex items-center justify-center p-6">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
						<p className="text-slate-400 text-sm">Loading content for {activeTopicTitle}...</p>
					</div>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto p-6">
					<div className="space-y-5">
						{/* Topic Header */}
						<div>
							<h2 className="text-2xl font-bold text-white mb-1">{activeTopicTitle}</h2>
							<p className="text-xs text-slate-400">Master this concept before moving to the next topic</p>
						</div>							{/* Content */}
							<div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
								<h3 className="text-xs font-semibold text-cyan-400 mb-3 flex items-center gap-2">
									<Book className="w-3.5 h-3.5" />
									Learn
								</h3>
								<p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{studyContent.content}</p>
							</div>

							{/* Code Example */}
							{studyContent.codeExample && (
								<div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
									<h3 className="text-xs font-semibold text-cyan-400 mb-3">💻 Code Example</h3>
									<pre className="bg-slate-950/50 border border-slate-700/30 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
										<code>{studyContent.codeExample}</code>
									</pre>
								</div>
							)}

							{/* Learning Resources - Study Links */}
							<div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5 max-h-[400px] flex flex-col">
								<h3 className="text-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
									🔗 Study Resources
								</h3>
							<p className="text-slate-300 text-xs mb-3">
								Dive deeper into {activeTopicTitle}:
							</p>
							<div className="space-y-2 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-slate-800/20">
								{studyContent.studyResources?.map((resource, idx) => (
									<a
										key={idx}
										href={resource.url}
										target="_blank"
										rel="noopener noreferrer"
											className="group flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 rounded-lg transition-all"
										>
											<div className="flex items-center gap-2.5 flex-1 min-w-0">
												<div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-lg ${
													resource.type === 'documentation' 
														? 'bg-blue-500/20' 
														: resource.type === 'video'
														? 'bg-red-500/20'
														: 'bg-green-500/20'
												}`}>
													{resource.type === 'documentation' ? '📚' : resource.type === 'video' ? '🎥' : '⚡'}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-medium text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
														{resource.title}
													</p>
													<p className="text-xs text-slate-400 capitalize">
														{resource.type}
													</p>
												</div>
											</div>
											<ArrowRight className="w-4 h-4 flex-shrink-0 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all ml-2" />
										</a>
									))}
								</div>
								<p className="text-xs text-slate-500 mt-3 text-center">
									💡 Opens in new tabs
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-4">
								<button
									onClick={handleMarkComplete}
									disabled={isCompleted || completing}
									className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
										isCompleted
											? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
											: 'bg-cyan-500 hover:bg-cyan-600 text-white'
									}`}
								>
									{isCompleted ? '✓ Completed' : completing ? 'Marking...' : 'Mark Complete'}
								</button>
								<button
									onClick={(e) => {
										console.log('🖱️ Next Topic button clicked!');
										console.log('   isCompleted:', isCompleted);
										console.log('   Button disabled:', !isCompleted);
										if (!isCompleted) {
											console.log('❌ Button is disabled, click ignored');
											e.preventDefault();
											return;
										}
										handleNext();
									}}
									disabled={!isCompleted}
									className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 border ${
										!isCompleted
											? 'bg-slate-900/50 text-slate-600 cursor-not-allowed border-slate-800/50'
											: 'bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700/50'
									}`}
									title={!isCompleted ? 'Complete current topic first' : 'Move to next topic'}
								>
									Next Topic
									<ArrowRight className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* ✨ COMPLETION MODAL */}
			{showCompletionModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl">
						{/* Success Icon */}
						<div className="flex justify-center mb-4">
							<div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
								<svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>

						{/* Title */}
						<h3 className="text-2xl font-bold text-center mb-2" style={{ color: '#22d3c1' }}>
							🎉 Topic Completed!
						</h3>

						{/* Message */}
						<p className="text-slate-300 text-center mb-4">
							Great job mastering <span className="font-semibold text-white">{completedTopicName || activeTopicTitle}</span>!
						</p>

						{/* Extra Topic Badge */}
						{isExtraTopic && (
							<div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3 mb-4">
								<div className="flex items-center gap-2 mb-1">
									<svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									<span className="text-sm font-semibold text-purple-300">Additional Task</span>
								</div>
								<p className="text-xs text-purple-200/80">
									This topic is beyond today's scheduled tasks. You're ahead of the roadmap timeline!
								</p>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={handleStayOnTopic}
								className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all border border-slate-600"
							>
								Stay Here
							</button>
							<button
								onClick={handleContinueToNext}
								className="flex-1 py-3 text-white rounded-lg font-medium transition-all shadow-lg"
								style={{ background: 'linear-gradient(to right, #22d3c1, #10b981)' }}
								onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
								onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
							>
								Next Topic →
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default StudyLayout;
