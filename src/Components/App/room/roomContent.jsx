// Components/room/roomContent.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	TrendingUp,
	Clock,
	Target,
	Plus,
	MoreHorizontal,
	Users,
	Crown,
	Circle,
	CheckCircle,
	PlayCircle,
	Brain,
	Trophy,
	Timer,
	BookOpen,
	Award,
	Calendar,
	ArrowRight,
	Zap,
	Star,
	Kanban,
	Loader,
	CheckCircle2,
	XCircle,
	Lock,
} from "lucide-react";
import { Card, Button, Badge, ProgressBar } from "../../elements/elements";
import { TaskSkeleton, CardSkeleton, MilestoneSkeleton, QuizSkeleton } from "../../elements/Skeleton";
import KanbanView from "./kanbanView";
import MilestoneDetailModal from "./milestoneDetailModal";
import TaskTimerModal from "./taskTimerModal";
import StudyLayout from "./study/StudyLayout";
import MinimizedTimer from "./minimizedTimer";
import CompletionPromptModal from "./CompletionPromptModal";
import PresenceIndicator from "../presence/PresenceIndicator";
import { roomService } from "../../../services/roomService";
import { useRoomSync } from "../../../hooks/useRoomSync";
import { useFocusTimer } from "../../../hooks/useFocusTimer";

const RoomContent = ({
	activeView,
	roomData,
	members,
	onlineMembers = [],
	todaysTasks,
	roadmapItems,
	showMembers = true,
	onTaskComplete,
	onTopicComplete,
	onContinueToNextDay,
	onViewChange, // Add this prop to change views
	onRefetchRoom, // NEW: Function to refetch room data
	// Discord presence functions
	getUserPresence,
	isUserOnline,
}) => {
	// Quiz state
	const [currentQuiz, setCurrentQuiz] = useState(null);
	const [selectedAnswers, setSelectedAnswers] = useState({});
	const [availableQuizzes, setAvailableQuizzes] = useState([]); // List of available quizzes
	const [quizResults, setQuizResults] = useState(null);
	const [quizLoading, setQuizLoading] = useState(false);
	const [generatingQuiz, setGeneratingQuiz] = useState(false);
	const [quizzesRemaining, setQuizzesRemaining] = useState(2); // Track remaining quizzes for today
	
	// Progress state
	const [fetchedTodaysTasks, setFetchedTodaysTasks] = useState([]);
	const [userProgress, setUserProgress] = useState(null);
	const [progressLoading, setProgressLoading] = useState(false);
	const [additionalTopics, setAdditionalTopics] = useState([]);
	
	// Track if we've shown completion prompt for current task set (prevents loop)
	const completionPromptShownRef = useRef(false);
	
	// Use fetched tasks if available, otherwise fall back to prop
	const displayTodaysTasks = fetchedTodaysTasks.length > 0 ? fetchedTodaysTasks : (todaysTasks || []);
	
	// Get current user from localStorage
	const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
	const currentUserId = currentUser?.id || currentUser?._id;
	
	// Focus Timer Hook with persistence
	const {
		timerState,
		startSession,
		stopSession,
		pauseSession,
		resumeSession,
		updateProgress,
		setTimerState
	} = useFocusTimer(roomData?.id, currentUserId);
	
	// Modal states
	const [selectedMilestone, setSelectedMilestone] = useState(null);
	const [showMilestoneModal, setShowMilestoneModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [showTimerModal, setShowTimerModal] = useState(false);
	
	// Study session states
	const [showStudyPanel, setShowStudyPanel] = useState(false);
	const [showMinimizedTimer, setShowMinimizedTimer] = useState(false);
	const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
	const [allTasksCompleted, setAllTasksCompleted] = useState(false);
	const [expandedMilestoneId, setExpandedMilestoneId] = useState(null);

	// Task/Milestone handlers
	const handleStartTask = async (taskId) => {
		console.log('Starting task:', taskId);
		const task = displayTodaysTasks.find(t => t.id === taskId);
		if (task) {
			const milestone = roadmapItems.find(m => m.id === task.milestoneId);
			setSelectedTask(task);
			setSelectedMilestone(milestone);
			
			// Switch to roadmap view instead of opening timer modal
			if (onViewChange) {
				onViewChange('roadmap');
			}
		}
	};

	// Handle timer minimization - opens study panel
	const handleMinimizeTimer = () => {
		setShowTimerModal(false);
		setShowMinimizedTimer(true);
		setShowStudyPanel(true);
	};

	// Handle timer expand - returns to full timer
	const handleExpandTimer = () => {
		setShowMinimizedTimer(false);
		setShowTimerModal(true);
		setShowStudyPanel(false);
	};

	// Handle timer stop/resume toggle from minimized view
	const handleStopMinimizedTimer = async () => {
		if (timerState.isRunning) {
			await pauseSession();
		} else {
			await resumeSession();
		}
		// Keep the minimized timer visible
	};

	// Handle timer complete from minimized view
	const handleCompleteMinimizedTimer = async () => {
		const taskData = {
			taskId: timerState.task?.id,
			timeSpent: Math.floor(timerState.elapsedSeconds / 60) + ' minutes',
			elapsedSeconds: timerState.elapsedSeconds,
			// Mark this as a milestone-based task (not from todaysTasks)
			isMilestoneTask: true,
		};
		
		await handleTaskComplete(taskData);
		// Stop the session and hide timer after completion
		await stopSession();
		setShowMinimizedTimer(false);
		setShowStudyPanel(false);
	};

	// Handle subtopic completion in study panel
	const handleSubtopicComplete = async (data) => {
		console.log('Subtopic completed:', data);
		// Refetch progress data to update UI
		await refetchProgressData();
	};
	
	// Wrap parent's onTopicComplete to refetch data
	const handleTopicCompleteWrapper = async (data) => {
		console.log('✅ Topic completed wrapper called:', data);
		
		// ✨ IMMEDIATELY update local task state for instant UI feedback
		if (data && data.topicTitle) {
			setFetchedTodaysTasks(prev => 
				prev.map(task => 
					task.title === data.topicTitle 
						? { ...task, completed: true, status: 'completed' }
						: task
				)
			);
			console.log('✅ Local task state updated for:', data.topicTitle);
		}
		
		// Refetch room data to get updated completion status
		if (onRefetchRoom) {
			console.log('🔄 Refetching room data to update UI...');
			await onRefetchRoom();
		}
		
		// Refetch progress data (in background, don't block UI)
		refetchProgressData().catch(err => {
			console.warn('⚠️ Background refetch failed (non-critical):', err.message);
		});
		
		// Update local state immediately for UI responsiveness
		if (data && data.topicId && data.milestone) {
			// Force a state update to trigger re-render
			setSelectedMilestone({...data.milestone});
		}
		
		// Call parent callback if provided
		if (onTopicComplete) {
			console.log('🔄 Calling parent onTopicComplete...');
			await onTopicComplete(data);
		}
		
		// ✨ Dispatch custom event so dashboard todaysTaskBlock auto-refetches
		window.dispatchEvent(new CustomEvent('task-completed', { 
			detail: { topicTitle: data?.topicTitle, roomId: roomData?.id }
		}));
		
		console.log('✅ Topic completion handler finished');
	};

	// Handle study panel close
	const handleCloseStudyPanel = async () => {
		setShowStudyPanel(false);
		if (showMinimizedTimer) {
			// Keep timer running in minimized state
			return;
		}
		// If no minimized timer, clean up session
		await stopSession();
	};

	// ========== PROGRESS TAB BACKEND INTEGRATION ==========
	
	// Function to refetch progress data
	const refetchProgressData = async () => {
		if (!roomData?.id || !currentUserId) return;
		
		try {
			console.log('🔄 Refetching progress data for room:', roomData.id, 'user:', currentUser.id);
			setProgressLoading(true);
			
			// Fetch today's tasks
			const tasksResponse = await roomService.getTodaysTasks();
			console.log('📋 Today\'s tasks response:', tasksResponse);
			if (tasksResponse && tasksResponse.tasks) {
				const roomTasks = tasksResponse.tasks.filter(task => task.roomId === roomData.id);
				console.log('✅ Filtered tasks for this room:', roomTasks);
				setFetchedTodaysTasks(roomTasks);
			}
			
			// Fetch user progress
			const progressResponse = await roomService.getUserProgress(roomData.id, currentUserId);
			console.log('📊 User progress response:', progressResponse);
			if (progressResponse.progress) {
				setUserProgress(progressResponse.progress);
				
				// ✨ FRESH: Calculate additional topics = completed topics NOT in today's schedule
				if (roomData.roadmap && roomData.roadmap.phases) {
					// Normalize title by removing backticks and extra spaces
					const normalizeTitle = (title) => {
						if (!title) return '';
						return title.replace(/`/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
					};
					
					const todayTaskTitles = displayTodaysTasks.map(t => normalizeTitle(t.title));
					const additionalTopicsList = [];
					
					roomData.roadmap.phases.forEach(phase => {
						phase.milestones.forEach(milestone => {
							if (milestone.topics && Array.isArray(milestone.topics)) {
								milestone.topics.forEach(topic => {
									const topicTitle = typeof topic === 'string' ? topic : topic.title;
									const topicStatus = typeof topic === 'object' ? topic.status : 'pending';
									const isCompleted = topicStatus === 'completed' || topic.completed;
									const normalizedTopicTitle = normalizeTitle(topicTitle);
									const isScheduled = todayTaskTitles.includes(normalizedTopicTitle);
									
									if (isCompleted && !isScheduled) {
										additionalTopicsList.push({
											title: topicTitle,
											milestone: milestone.title,
											completedAt: topic.completedAt || new Date()
										});
									}
								});
							}
						});
					});
					
					console.log('📚 Additional topics calculated:', additionalTopicsList);
					setAdditionalTopics(additionalTopicsList);
				}
			}
		} catch (err) {
			console.error('❌ Failed to fetch progress data:', err);
		} finally {
			setProgressLoading(false);
		}
	};
	
	// Fetch today's tasks and user progress when Progress tab is active
	useEffect(() => {
		const fetchProgressData = async () => {
			if (!roomData?.id || !currentUser?.id || activeView !== 'progress') return;
			
			try {
				setProgressLoading(true);
				
				// Fetch today's tasks (gets all user's rooms tasks)
				const tasksResponse = await roomService.getTodaysTasks();
				console.log('Today tasks response:', tasksResponse);
				if (tasksResponse && tasksResponse.tasks) {
					// Filter tasks for this room only
					const roomTasks = tasksResponse.tasks.filter(task => task.roomId === roomData.id);
					setFetchedTodaysTasks(roomTasks);
					
					// ✨ FRESH: Calculate additional topics = completed topics NOT in today's schedule
					if (roomData.roadmap && roomData.roadmap.phases) {
						// Normalize title by removing backticks and extra spaces
						const normalizeTitle = (title) => {
							if (!title) return '';
							return title.replace(/`/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
						};
						
						const todayTaskTitles = roomTasks.map(t => normalizeTitle(t.title));
						const additionalTopicsList = [];
						
						roomData.roadmap.phases.forEach(phase => {
							phase.milestones.forEach(milestone => {
								if (milestone.topics && Array.isArray(milestone.topics)) {
									milestone.topics.forEach(topic => {
										const topicTitle = typeof topic === 'string' ? topic : topic.title;
										const topicStatus = typeof topic === 'object' ? topic.status : 'pending';
										const isCompleted = topicStatus === 'completed' || topic.completed;
										const normalizedTopicTitle = normalizeTitle(topicTitle);
										const isScheduled = todayTaskTitles.includes(normalizedTopicTitle);
										
										console.log(`  🔍 Topic: "${topicTitle}" | Normalized: "${normalizedTopicTitle}" | Completed: ${isCompleted} | Scheduled: ${isScheduled}`);
										
										if (isCompleted && !isScheduled) {
											additionalTopicsList.push({
												title: topicTitle,
												milestone: milestone.title,
												completedAt: topic.completedAt || new Date()
											});
										}
									});
								}
							});
						});
						
						console.log('📚 Additional topics calculated:', additionalTopicsList);
						console.log('📋 Today\'s task titles (normalized):', todayTaskTitles);
						setAdditionalTopics(additionalTopicsList);
					}
				}
				
				// Fetch user progress
				const progressResponse = await roomService.getUserProgress(roomData.id, currentUser.id);
				if (progressResponse.progress) {
					setUserProgress(progressResponse.progress);
				}
			} catch (err) {
				console.error('Failed to fetch progress data:', err);
			} finally {
				setProgressLoading(false);
			}
		};

		fetchProgressData();
	}, [roomData?.id, currentUserId, activeView]);

	// ========== TASK COMPLETION DETECTION ==========
	// Detect when all tasks are completed and show completion prompt
	useEffect(() => {
		if (activeView === 'progress' && displayTodaysTasks.length > 0) {
			const allCompleted = displayTodaysTasks.every(task => task.completed);
			setAllTasksCompleted(allCompleted);
			
			// Check if already dismissed today
			const today = new Date().toDateString();
			const lastDismissed = localStorage.getItem(`completionPrompt_dismissed_${roomData?.id}`);
			const alreadyDismissedToday = lastDismissed === today;
			
			// Show completion prompt when all tasks are completed (on progress tab)
			// Only show ONCE per completion - check both ref and localStorage
			if (allCompleted && !showCompletionPrompt && !completionPromptShownRef.current && !alreadyDismissedToday) {
				// Delay showing prompt slightly to ensure smooth UX
				const timer = setTimeout(() => {
					setShowCompletionPrompt(true);
					completionPromptShownRef.current = true; // Mark as shown
				}, 500);
				return () => clearTimeout(timer);
			}
			
			// Reset flag when tasks are no longer all completed (new day, new tasks)
			// But DON'T reset if already dismissed today
			if (!allCompleted && !alreadyDismissedToday) {
				completionPromptShownRef.current = false;
			}
		}
	}, [displayTodaysTasks, activeView, showCompletionPrompt, roomData?.id]);

	// ========== QUIZ BACKEND INTEGRATION ==========
	
	// Fetch available quizzes on mount and when activeView changes to 'quiz'
	useEffect(() => {
		const fetchQuizzes = async () => {
			if (!roomData?.id || activeView !== 'quiz') return;
			
			try {
				setQuizLoading(true);
				const response = await roomService.getQuizzes(roomData.id);
				setAvailableQuizzes(response.quizzes || []);
			} catch (err) {
				console.error('Failed to fetch quizzes:', err);
			} finally {
				setQuizLoading(false);
			}
		};

		fetchQuizzes();
	}, [roomData?.id, activeView]);

	// Calculate remaining quizzes for today
	useEffect(() => {
		if (!roomData?.id || !currentUserId) return;
		
		const today = new Date().toDateString();
		const quizCountKey = `quiz_count_${roomData.id}_${currentUserId}_${today}`;
		const quizCount = parseInt(localStorage.getItem(quizCountKey) || '0');
		const remaining = Math.max(0, 2 - quizCount);
		
		console.log('🔢 Quiz Counter Update:', {
			roomId: roomData.id,
			today,
			quizCountKey,
			quizCount,
			remaining
		});
		
		setQuizzesRemaining(remaining);
	}, [roomData?.id, currentUserId, activeView, availableQuizzes]);

	// Generate new quiz
	const handleGenerateQuiz = async () => {
		if (!roomData?.id) return;
		
		try {
			// Check quiz generation limit (2 per day)
			const today = new Date().toDateString();
			const quizCountKey = `quiz_count_${roomData.id}_${currentUserId}_${today}`;
			const quizCount = parseInt(localStorage.getItem(quizCountKey) || '0');
			
			if (quizCount >= 2) {
				// Redirect to pro page
				alert('🎯 Daily Quiz Limit Reached!\n\nYou\'ve generated 2 quizzes today. Upgrade to Learncurve Pro for unlimited quizzes!');
				// TODO: Navigate to pro page
				// window.location.href = '/pro';
				return;
			}
			
		setGeneratingQuiz(true);
		
		// Collect ALL completed topics from multiple sources
		const completedTopics = [];
		
		// 1. Get TODAY'S completed topics from displayTodaysTasks
		displayTodaysTasks
			.filter(task => task.completed)
			.forEach(task => {
				if (completedTopics.length < 5) {
					completedTopics.push(task.title);
				}
			});
		
		// 2. Add additional completed topics (not in today's schedule)
		if (completedTopics.length < 5 && additionalTopics && additionalTopics.length > 0) {
			additionalTopics.forEach(topic => {
				if (completedTopics.length < 5) {
					completedTopics.push(topic.title);
				}
			});
		}
		
		// 3. Fallback: Check roadmap for any other completed topics
		if (completedTopics.length < 5 && roadmapItems) {
			roadmapItems.forEach(milestone => {
				milestone.topics?.forEach(topic => {
					if (completedTopics.length < 5) {
						// Handle both object and string topics
						const topicTitle = typeof topic === 'string' ? topic : (topic.title || topic.name);
						const topicStatus = typeof topic === 'object' ? topic.status : null;
						const topicIsCompleted = typeof topic === 'object' && topic.isCompleted;
						
						// Check if topic is completed and not already in list
						if ((topicStatus === 'completed' || topicIsCompleted) && !completedTopics.includes(topicTitle)) {
							completedTopics.push(topicTitle);
						}
					}
				});
			});
		}
		
		console.log('📝 Generating quiz from completed topics:', completedTopics);

		// If still no topics, show message
		if (completedTopics.length === 0) {
			alert('📚 Complete some topics first!\n\nYou need to complete at least one topic before generating a quiz.');
			setGeneratingQuiz(false);
			return;
		}
		
		console.log('⏳ Starting quiz generation...');
		
		const response = await roomService.generateQuiz(
				roomData.id,
				new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
				completedTopics,
				'medium' // difficulty
			);

			console.log('📊 Quiz Generation Response:', response);

			// Backend returns quiz data inside response.data (via sendSuccess wrapper)
			const quiz = response.quiz || response.data;
			console.log('📋 Quiz object:', quiz);
			console.log('❓ Questions:', quiz?.questions);
			console.log('❓ Questions length:', quiz?.questions?.length);

			// Validate quiz has questions
			if (!quiz || !quiz.questions || quiz.questions.length === 0) {
				throw new Error('Quiz generated but contains no questions');
			}

			// Add the new quiz to available quizzes
			setAvailableQuizzes(prev => [...prev, quiz]);
			
			// Increment quiz count for today
			const newCount = quizCount + 1;
			localStorage.setItem(quizCountKey, newCount.toString());
			
			console.log('✅ Quiz generated! Updated counter:', {
				quizCountKey,
				oldCount: quizCount,
				newCount: newCount,
				remaining: 2 - newCount
			});
			
			// Update remaining quizzes count
			setQuizzesRemaining(Math.max(0, 2 - newCount));
			
			console.log('✅ Quiz generated successfully! Quizzes used today:', newCount, '/2');
			
			// Show success message
			alert('✅ Quiz Generated!\n\n' + quiz.questions.length + ' questions ready. Good luck!');
		} catch (err) {
			console.error('❌ Failed to generate quiz:', err);
			
			// Specific error messages
			if (err.message && err.message.includes('timeout')) {
				alert('⏱️ Quiz Generation Timeout\n\nThe AI is taking too long to generate questions. This usually happens when:\n\n• The AI service is slow\n• Network is unstable\n\nPlease try again in a moment.');
			} else if (err.message && err.message.includes('no questions')) {
				alert('⚠️ Empty Quiz Generated\n\nThe AI generated a quiz but it has no questions. Please try again.');
			} else {
				alert('❌ Quiz Generation Failed\n\n' + (err.message || 'Unknown error') + '\n\nPlease try again.');
			}
		} finally {
			setGeneratingQuiz(false);
		}
	};

	// Handle quiz answer selection
	const handleQuizAnswer = (questionId, answerIndex) => {
		setSelectedAnswers((prev) => ({
			...prev,
			[questionId]: answerIndex,
		}));
	};

	// Submit quiz to backend
	const submitQuiz = async () => {
		if (!roomData?.id || !currentQuiz?._id) return;
		
		try {
			setQuizLoading(true);

			// Convert selected answers object to array format expected by backend
			const answersArray = currentQuiz.questions.map((question, index) => {
				const selectedIndex = selectedAnswers[question._id || question.id || index];
				return selectedIndex !== undefined ? selectedIndex : -1;
			});

			const response = await roomService.submitQuiz(
				roomData.id,
				currentQuiz._id,
				answersArray
			);

			// Show results
			setQuizResults(response.results);

		} catch (err) {
			console.error('Failed to submit quiz:', err);
		} finally {
			setQuizLoading(false);
		}
	};

	// Reset quiz (go back to quiz list)
	const handleResetQuiz = () => {
		setCurrentQuiz(null);
		setSelectedAnswers({});
		setQuizResults(null);
	};

	// ========== END QUIZ BACKEND INTEGRATION ==========


	const handleContinueMilestone = async (milestoneId, specificTopic = null) => {
		console.log('🎯 handleContinueMilestone called:', { milestoneId, specificTopic });
		const milestone = roadmapItems.find(m => m.id === milestoneId);
		if (milestone) {
			console.log('📚 Found milestone:', milestone);
			// Create a task object from milestone for the study session
			const task = {
				id: milestone.id,
				title: milestone.title,
				description: milestone.description,
				milestoneId: milestone.id,
				phaseIndex: milestone.phaseIndex,
				milestoneIndex: milestone.milestoneIndex,
				specificTopic: specificTopic, // Pass the specific topic to study
			};
			
			console.log('📝 Created task with specificTopic:', task);
			setSelectedTask(task);
			setSelectedMilestone(milestone);
			
			// Auto-minimize timer and open study panel immediately
			setShowMinimizedTimer(true);
			setShowStudyPanel(true);
			
			// Start focus session with persistence
			console.log('⏱️ Starting focus session...');
			await startSession(task, milestone);
		} else {
			console.error('❌ Milestone not found for id:', milestoneId);
		}
	};

	const handleStartMilestoneTracking = (milestoneId) => {
		// Create a task from the milestone for tracking
		const milestone = roadmapItems.find(m => m.id === milestoneId);
		if (milestone) {
			setSelectedTask({
				id: milestone.id,
				title: milestone.title,
			});
			setSelectedMilestone(milestone);
			setShowTimerModal(true);
		}
	};

	const handleTaskComplete = (data) => {
		// Call parent handler if provided
		if (onTaskComplete) {
			onTaskComplete(data);
		}
	};

	// ========== ADDITIONAL TOPICS HANDLING ==========
	// Handle continuation with additional topics
	const handleContinueLearning = async () => {
		try {
			setShowCompletionPrompt(false);
			
			// Save dismissal to localStorage (per room, per day)
			const today = new Date().toDateString();
			localStorage.setItem(`completionPrompt_dismissed_${roomData?.id}`, today);
			
			// ✨ Additional topics are already tracked in the roadmap as completed
			// No need to persist separately - they're automatically included in progress
			
			const completedTopics = displayTodaysTasks.filter(t => t.completed);
			console.log('✅ Continuing with', completedTopics.length, 'completed topics');
			
			// Show next available topic or prompt for more topics
			// This can be extended to fetch the next topic from the roadmap
			// and auto-start the study session
		} catch (error) {
			console.error('❌ Failed to continue learning:', error);
		}
	};

	// Handle stopping for the day
	const handleStopForToday = () => {
		setShowCompletionPrompt(false);
		
		// Save dismissal to localStorage (per room, per day)
		const today = new Date().toDateString();
		localStorage.setItem(`completionPrompt_dismissed_${roomData?.id}`, today);
		
		// Optional: Call the onContinueToNextDay callback or reset state
		if (onContinueToNextDay) {
			onContinueToNextDay();
		}
	};

	const [kanbanColumns] = useState({
		todo: {
			id: "todo",
			title: "To Do",
			color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
			tasks: [
				{
					id: "1",
					title: "Learn React Hooks",
					description: "useState, useEffect, useContext",
					priority: "high",
				},
				{
					id: "2",
					title: "Build Todo App",
					description: "Practice CRUD operations",
					priority: "medium",
				},
				{
					id: "3",
					title: "CSS Grid Layout",
					description: "Master CSS Grid fundamentals",
					priority: "low",
				},
			],
		},
		inprogress: {
			id: "inprogress",
			title: "In Progress",
			color:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
			tasks: [
				{
					id: "4",
					title: "JavaScript ES6+",
					description: "Arrow functions, destructuring",
					priority: "high",
				},
				{
					id: "5",
					title: "API Integration",
					description: "Fetch data from REST APIs",
					priority: "medium",
				},
			],
		},
		review: {
			id: "review",
			title: "Review",
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
			tasks: [
				{
					id: "6",
					title: "Portfolio Website",
					description: "Get feedback on design",
					priority: "high",
				},
			],
		},
		done: {
			id: "done",
			title: "Done",
			color:
				"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
			tasks: [
				{
					id: "7",
					title: "HTML Fundamentals",
					description: "Semantic HTML, forms",
					priority: "completed",
				},
				{
					id: "8",
					title: "CSS Flexbox",
					description: "Layout and alignment",
					priority: "completed",
				},
			],
		},
	});

	const quizData = {
		title: "React Fundamentals Quiz",
		description: "Test your knowledge of React basics",
		timeLimit: 300, // 5 minutes
		questions: [
			{
				id: 1,
				question: "What is JSX in React?",
				options: [
					"JavaScript XML syntax extension",
					"Java Syntax Extension",
					"JavaScript Extension only",
					"JSON XML format",
				],
				correct: 0,
			},
			{
				id: 2,
				question: "Which hook is used for side effects in React?",
				options: ["useState", "useEffect", "useContext", "useReducer"],
				correct: 1,
			},
			{
				id: 3,
				question: "What does the 'key' prop help React with?",
				options: [
					"Styling components",
					"Handling events",
					"Identifying which items have changed",
					"State management",
				],
				correct: 2,
			},
		],
	};

	// Helper functions
	const getProgressStatusColor = (status) => {
		switch (status) {
			case "ahead":
				return "text-green-500";
			case "on-track":
				return "text-blue-500";
			case "behind":
				return "text-red-500";
			default:
				return "text-text/60";
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
			case "medium":
				return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
			case "low":
				return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
			case "completed":
				return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
			default:
				return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
		}
	};

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e) => {
			// ESC to close modals
			if (e.key === 'Escape') {
				if (showTimerModal) {
					setShowTimerModal(false);
				} else if (showMilestoneModal) {
					setShowMilestoneModal(false);
				} else if (currentQuiz) {
					handleResetQuiz();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [showTimerModal, showMilestoneModal, currentQuiz]);

	return (
		<>
			<div className="flex h-full">
			{/* Main Content Area */}
			<div
				className={`flex-1 overflow-hidden p-0 transition-all duration-300 ${
					showMembers ? "mr-0" : "mx-0"
				} ${showStudyPanel && selectedMilestone && activeView === "roadmap" ? "max-w-lg" : ""}`}
			>
				{/* Progress View */}
				{activeView === "progress" && (
					<div className="space-y-6 p-6 h-full overflow-y-auto">
						{progressLoading ? (
							<div className="space-y-6">
								{/* Stats Skeleton */}
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									{[1, 2, 3].map((i) => (
										<CardSkeleton key={i} />
									))}
								</div>
								{/* Tasks Skeleton */}
								<div className="space-y-3 p-6 rounded-xl bg-white dark:bg-gray-800">
									{[1, 2, 3].map((i) => (
										<TaskSkeleton key={i} />
									))}
								</div>
							</div>
						) : (
							<>
						{/* Stats Grid */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{[
								{
									title: "Overall Progress",
									value: `${roomData.averageProgress || userProgress?.progressPercentage || roomData.completionRate || 0}%`,
									icon: TrendingUp,
									color: "text-primary",
									bgColor: "bg-primary/10",
								},
								{
									title: "Days Remaining",
									value: roomData.daysRemaining || 'N/A',
									icon: Clock,
									color: "text-orange-500",
									bgColor: "bg-orange-500/10",
								},
								{
									title: "Daily Streak",
									value: userProgress?.dailyStreak || 0,
									icon: Target,
									color: "text-green-500",
									bgColor: "bg-green-500/10",
								},
							].map((stat, index) => (
								<motion.div
									key={stat.title}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card className="p-6 hover:shadow-lg transition-shadow">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-text/60 text-sm font-medium">
													{stat.title}
												</p>
												<p className={`text-3xl font-bold ${stat.color} mt-1`}>
													{stat.value}
												</p>
											</div>
											<div
												className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
											>
												<stat.icon className={`w-6 h-6 ${stat.color}`} />
											</div>
										</div>
									</Card>
								</motion.div>
							))}
						</div>

						{/* Today's Tasks */}
						<Card className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-semibold text-text flex items-center">
									<Calendar className="w-5 h-5 mr-2 text-primary" />
									Today's Tasks
								</h3>
								<Badge variant="primary" className="bg-primary/10 text-primary">
									{displayTodaysTasks.filter((task) => task.completed).length} /{" "}
									{displayTodaysTasks.length} completed
								</Badge>
							</div>
							
							{/* ✨ Show message when all tasks complete */}
							{displayTodaysTasks.length > 0 && displayTodaysTasks.every(task => task.completed) ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
										<Trophy className="w-10 h-10 text-green-500" />
									</div>
									<h3 className="text-2xl font-bold text-text mb-2">All Tasks Complete! 🎉</h3>
									<p className="text-text/60 max-w-md mb-6">
										Amazing work! You've completed all your tasks for today. Ready to move forward?
									</p>
									<Button
										variant="primary"
										onClick={onContinueToNextDay}
										className="flex items-center gap-2"
									>
										<ArrowRight className="w-5 h-5" />
										Continue to Next Tasks
									</Button>
								</div>
							) : displayTodaysTasks.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
										<Calendar className="w-10 h-10 text-primary/50" />
									</div>
									<h3 className="text-xl font-medium text-text mb-2">No Tasks for Today</h3>
									<p className="text-text/60 max-w-md">
										All milestones are complete or your timeline hasn't started yet.
									</p>
								</div>
							) : (
								<div className="space-y-3">
								{displayTodaysTasks.map((task, index) => (
									<motion.div
										key={task.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
										className={`flex items-center justify-between p-4 rounded-xl transition-all ${
											task.completed
												? "bg-green-50 dark:bg-green-900/20"
												: "bg-alt/10 hover:bg-alt/20"
										}`}
									>
										<div className="flex items-center space-x-3">
											{task.completed ? (
												<CheckCircle className="w-6 h-6 text-green-500" />
											) : (
												<button
													onClick={() => onTopicComplete && onTopicComplete(task)}
													className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-all hover:scale-110"
													aria-label="Mark topic as complete"
												>
													<Circle className="w-6 h-6 text-text/40 hover:text-primary cursor-pointer" />
												</button>
											)}
											<div>
												<p
													className={`font-medium ${
														task.completed
															? "text-text/60 line-through"
															: "text-text"
													}`}
												>
													{task.title}
												</p>
												{task.milestone && (
													<p className="text-sm text-text/60">
														<span className="text-primary/80">
															{task.milestone}
														</span>
													</p>
												)}
											</div>
										</div>
										{!task.completed && (
											<Button 
												variant="ghost" 
												size="sm"
												onClick={() => handleStartTask && handleStartTask(task.id)}
											>
												<PlayCircle className="w-4 h-4 mr-1" />
												Start
											</Button>
										)}
									</motion.div>
								))}
							</div>
							)}
						</Card>

						{/* Additional Topics Covered */}
						{additionalTopics && additionalTopics.length > 0 && (
							<Card className="p-6">
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-xl font-semibold text-text flex items-center">
										<BookOpen className="w-5 h-5 mr-2 text-purple-500" />
										Additional Topics Covered
									</h3>
									<Badge variant="primary" className="bg-purple-500/10 text-purple-500">
										{additionalTopics.length} topics
									</Badge>
								</div>
								<div className="space-y-2">
									{additionalTopics.map((topic, index) => (
										<motion.div
											key={topic.id || topic._id || `topic-${index}-${topic.title}`}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.05 }}
											className="flex items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"
										>
											<CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
											<div className="flex-1">
												<p className="font-medium text-text">{topic.title || topic.name}</p>
												{topic.completedAt && (
													<p className="text-xs text-text/60">
														Completed {new Date(topic.completedAt).toLocaleDateString()}
													</p>
												)}
											</div>
										</motion.div>
									))}
								</div>
							</Card>
						)}
						</>
						)}
					</div>
				)}

				{/* Roadmap View */}
				{activeView === "roadmap" && (
					<div className="space-y-6 p-4 h-full overflow-y-auto mb-32">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-text/60 mt-1 flex items-center">
									{" "}
									<BookOpen className="w-4 h-4 mr-3 text-primary" />
									{roomData.roadmap ? "Your learning roadmap" : "Roadmap will be generated"}
								</p>
							</div>
							{roomData.roadmap && roomData.daysRemaining !== undefined && (
								<Badge
									variant="primary"
									className="bg-primary/10 text-primary px-4 py-2"
								>
									Week {Math.max(1, Math.min(Math.ceil((30 - Math.max(0, roomData.daysRemaining)) / 7), 4))} of 4
								</Badge>
							)}
						</div>

						{roadmapItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 text-center">
								<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
									<BookOpen size={40} className="text-primary/50" />
								</div>
								<h3 className="text-xl font-medium text-text mb-2">No Roadmap Yet</h3>
								<p className="text-sm text-text/70 mb-6 max-w-md">
									The AI-powered roadmap for this room hasn't been generated yet. The host can generate it to start your learning journey.
								</p>
							</div>
						) : (
							<div className="relative">
								{/* Progress Line */}
								<div className="absolute left-8 top-8 bottom-8 w-0.5 bg-text/20"></div>

								<div className="space-y-6">
									{roadmapItems.map((item, index) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
										className="relative"
									>
										<Card
											className={`ml-16 p-6 transition-all hover:shadow-lg ${
												item.current ? "ring-2 ring-primary shadow-lg" : ""
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div
														className={`absolute -left-16 w-16 h-16 rounded-full flex items-center justify-center ${
															item.completed
																? "bg-green-500"
																: item.current
																? "bg-primary"
																: "bg-text/20"
														}`}
													>
														{item.completed ? (
															<CheckCircle className="w-8 h-8 text-white" />
														) : (
															<PlayCircle className="w-8 h-8 text-white" />
														)}
													</div>
													<div>
														<h3 className="text-xl font-semibold text-text">
															{item.title}
														</h3>
														<p className="text-text/60">Week {item.week}</p>
														{item.current && (
															<div className="flex items-center mt-2">
																<Badge
																	variant="primary"
																	className="bg-primary/10 text-primary mr-2"
																>
																	Current
																</Badge>
																<Zap className="w-4 h-4 text-primary" />
															</div>
														)}
													</div>
												</div>
												{item.current && (
													showStudyPanel && selectedMilestone?.id === item.id ? (
														<Button 
															variant="primary"
															onClick={() => setExpandedMilestoneId(expandedMilestoneId === item.id ? null : item.id)}
															className="flex items-center gap-2"
														>
															{expandedMilestoneId === item.id ? 'Hide Topics' : 'Topics'}
															<ArrowRight className={`w-4 h-4 transition-transform ${expandedMilestoneId === item.id ? 'rotate-90' : ''}`} />
														</Button>
													) : (
														<Button 
															variant="primary"
															onClick={() => handleContinueMilestone(item.id)}
															className="flex items-center gap-2"
														>
															Continue
															<ArrowRight className="w-4 h-4" />
														</Button>
													)
												)}
											</div>
											
											{/* Topics Dropdown - Only show when study panel is open */}
											{item.current && showStudyPanel && expandedMilestoneId === item.id && item.topics && (
												<motion.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: 'auto', opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													className="mt-4 pt-4 border-t border-slate-700"
												>
													<h4 className="text-sm font-semibold text-primary mb-3">Topics:</h4>
													<div className="space-y-2">
														{item.topics.map((topic, idx) => {
															const topicTitle = typeof topic === 'string' ? topic : topic.title;
															const topicStatus = typeof topic === 'object' ? topic.status : 'pending';
															const isCompleted = topicStatus === 'completed' || (typeof topic === 'object' && topic.isCompleted);
															
															// Check if previous topic is completed (for locking)
															const previousTopic = idx > 0 ? item.topics[idx - 1] : null;
															const previousTopicStatus = previousTopic 
																? (typeof previousTopic === 'object' ? (previousTopic.isCompleted ? 'completed' : (previousTopic.status || 'pending')) : 'pending')
																: 'completed'; // First topic is always unlocked
															const isPreviousCompleted = previousTopicStatus === 'completed';
															const isLocked = !isPreviousCompleted && !isCompleted;
															
															return (
																<button
																	key={idx}
																	onClick={() => !isLocked && handleContinueMilestone(item.id, topic)}
																	disabled={isLocked}
																	className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-colors group ${
																		isLocked 
																			? 'bg-slate-900/50 border-slate-800/50 cursor-not-allowed opacity-50'
																			: 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50'
																	}`}
																>
																	{isCompleted ? (
																		<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
																	) : isLocked ? (
																		<Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
																	) : (
																		<Circle className="w-4 h-4 text-slate-500 group-hover:text-primary flex-shrink-0" />
																	)}
																	<span className={`text-sm flex-1 ${
																		isCompleted 
																			? 'text-slate-500 line-through' 
																			: isLocked
																			? 'text-slate-600'
																			: 'text-slate-300 group-hover:text-white'
																	}`}>
																		{topicTitle}
																	</span>
																	{!isLocked && <PlayCircle className="w-4 h-4 text-slate-500 group-hover:text-primary" />}
																	{isLocked && <span className="text-xs text-slate-600">Complete previous topic</span>}
																</button>
															);
														})}
													</div>
												</motion.div>
											)}
										</Card>
									</motion.div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Quiz View */}
				{activeView === "quiz" && (
					<div className="p-4 space-y-6 h-full overflow-y-auto">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-text/60 mt-1 flex items-center">
									<Brain className="w-4 h-4 mr-3 text-primary" />
									Test your knowledge and track your progress
								</p>
							</div>
							<div className="flex items-center gap-3">
								{/* Quiz Counter Badge */}
								<div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
									quizzesRemaining > 0 
										? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
										: 'bg-red-500/10 border border-red-500/30'
								}`}>
									<Brain className={`w-4 h-4 ${quizzesRemaining > 0 ? 'text-cyan-400' : 'text-red-400'}`} />
									<span className={`text-sm font-medium ${quizzesRemaining > 0 ? 'text-cyan-300' : 'text-red-300'}`}>
										{quizzesRemaining} / 2 Left Today
									</span>
								</div>
								
								<Button
									variant="primary"
									onClick={handleGenerateQuiz}
									disabled={generatingQuiz || quizLoading || quizzesRemaining === 0}
									className="flex items-center"
								>
									{generatingQuiz ? (
										<>
											<Loader className="w-4 h-4 mr-2 animate-spin" />
											Generating...
										</>
									) : quizzesRemaining === 0 ? (
										<>
											<Lock className="w-4 h-4 mr-2" />
											Limit Reached
										</>
									) : (
										<>
											<Plus className="w-4 h-4 mr-2" />
											Generate Quiz
										</>
									)}
								</Button>
							</div>
						</div>						{quizLoading ? (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{[1, 2].map((i) => (
									<div key={i} className="p-6 rounded-xl bg-white dark:bg-gray-800">
										<QuizSkeleton />
									</div>
								))}
							</div>
						) : !currentQuiz ? (
							availableQuizzes.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-20 text-center">
									<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
										<Brain size={40} className="text-primary/50" />
									</div>
									<h3 className="text-xl font-medium text-text mb-2">No Quizzes Available</h3>
									<p className="text-sm text-text/70 mb-6 max-w-md">
										Click "Generate Quiz" to create an AI-powered quiz based on completed topics!
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{availableQuizzes.map((quiz, index) => (
										<Card key={quiz._id || index} className="p-6 hover:shadow-lg transition-shadow">
											<div className="flex items-center space-x-4 mb-6">
												<div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
													<Brain className="w-8 h-8 text-primary" />
												</div>
												<div>
													<h3 className="text-xl font-semibold text-text">
														Quiz {index + 1}
													</h3>
													<p className="text-text/60">
														{quiz.questions?.length || 0} questions
													</p>
													{quiz.topics && quiz.topics.length > 0 && (
														<p className="text-sm text-text/50 mt-1">
															Topics: {quiz.topics.slice(0, 2).join(', ')}
															{quiz.topics.length > 2 && ` +${quiz.topics.length - 2} more`}
														</p>
													)}
												</div>
											</div>
											<Button
												variant="primary"
												className="w-full"
												onClick={() => setCurrentQuiz(quiz)}
											>
												Start Quiz
												<PlayCircle className="w-4 h-4 ml-2" />
											</Button>
										</Card>
									))}
								</div>
							)
						) : quizResults ? (
							<Card className="p-8">
								<div className="text-center space-y-6">
									<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
										{quizResults.percentage >= 70 ? (
											<Trophy className="w-12 h-12 text-primary" />
										) : (
											<Brain className="w-12 h-12 text-primary/70" />
										)}
									</div>
									<h3 className="text-3xl font-bold text-text">
										{quizResults.percentage}%
									</h3>
									<p className="text-text/60">
										You scored {quizResults.score} out of {quizResults.totalQuestions} questions correctly
									</p>

									{/* Statistics Grid */}
									{quizResults.statistics && (
										<div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-text/10">
											<div className="text-center">
												<div className="text-2xl font-bold text-cyan-400">
													{quizResults.statistics.averageScore}%
												</div>
												<div className="text-sm text-text/60 mt-1">
													Average Score
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-green-400">
													{quizResults.statistics.totalQuizzesCompleted}
												</div>
												<div className="text-sm text-text/60 mt-1">
													Quizzes Completed
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-yellow-400">
													{quizResults.statistics.bestScore}%
												</div>
												<div className="text-sm text-text/60 mt-1">
													Best Score
												</div>
											</div>
										</div>
									)}

									{/* Overall Progress Bar */}
									{quizResults.statistics && (
										<div className="mt-6">
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm text-text/60">Overall Progress</span>
												<span className="text-sm font-medium text-text">
													{quizResults.statistics.averageScore}%
												</span>
											</div>
											<div className="w-full bg-text/10 rounded-full h-3 overflow-hidden">
												<div 
													className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
													style={{ width: `${quizResults.statistics.averageScore}%` }}
												/>
											</div>
										</div>
									)}

									{quizResults.details && quizResults.details.length > 0 && (
										<div className="text-left space-y-4 mt-8">
											<h4 className="font-semibold text-text mb-4">Question Review:</h4>
											{quizResults.details.map((detail, index) => (
												<div key={index} className="p-4 border border-text/10 rounded-xl">
													<div className="flex items-start gap-3">
														{detail.correct ? (
															<CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
														) : (
															<XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
														)}
														<div className="flex-1">
															<p className="font-medium text-text mb-2">
																Question {index + 1}
															</p>
															{!detail.correct && detail.explanation && (
																<p className="text-sm text-text/70">
																	{detail.explanation}
																</p>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									)}

									<div className="flex gap-3 justify-center mt-8">
										<Button
											variant="ghost"
											onClick={handleResetQuiz}
										>
											Back to Quizzes
										</Button>
										<Button
											variant="primary"
											onClick={handleGenerateQuiz}
											disabled={generatingQuiz}
										>
											{generatingQuiz ? (
												<>
													<Loader className="w-4 h-4 mr-2 animate-spin" />
													Generating...
												</>
											) : (
												<>
													<Plus className="w-4 h-4 mr-2" />
													Generate New Quiz
												</>
											)}
										</Button>
									</div>
								</div>
							</Card>
						) : (
							<Card className="p-8">
								<div className="flex items-center justify-between mb-8">
									<h3 className="text-2xl font-semibold text-text">
										Quiz in Progress
									</h3>
									<div className="flex items-center space-x-4">
										<Badge
											variant="primary"
											className="bg-primary/10 text-primary"
										>
											{Object.keys(selectedAnswers).length} /{" "}
											{currentQuiz.questions?.length || 0} answered
										</Badge>
									</div>
								</div>

								<div className="space-y-8">
									{currentQuiz.questions?.map((question, index) => {
										const questionId = question._id || question.id || index;
										return (
											<motion.div
												key={questionId}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												className="space-y-4"
											>
												<h4 className="text-lg font-medium text-text">
													{index + 1}. {question.question || question.text}
												</h4>
												<div className="grid grid-cols-1 gap-3">
													{question.options?.map((option, optionIndex) => (
														<motion.button
															key={optionIndex}
															whileHover={{ scale: 1.01 }}
															whileTap={{ scale: 0.99 }}
															onClick={() =>
																handleQuizAnswer(questionId, optionIndex)
															}
															className={`p-4 text-left border rounded-xl transition-all ${
																selectedAnswers[questionId] === optionIndex
																	? "border-primary bg-primary/10 text-primary"
																	: "border-text/20 hover:bg-alt/20 text-text"
															}`}
														>
															<span className="font-medium mr-3">
																{String.fromCharCode(65 + optionIndex)}.
															</span>
															{option}
														</motion.button>
													))}
												</div>
											</motion.div>
										);
									})}
								</div>

								<div className="flex justify-between mt-10">
									<Button
										variant="ghost"
										onClick={handleResetQuiz}
										disabled={quizLoading}
									>
										Cancel Quiz
									</Button>
									<Button
										variant="primary"
										onClick={submitQuiz}
										disabled={
											quizLoading ||
											Object.keys(selectedAnswers).length <
											(currentQuiz.questions?.length || 0)
										}
									>
										{quizLoading ? (
											<>
												<Loader className="w-4 h-4 mr-2 animate-spin" />
												Submitting...
											</>
										) : (
											<>
												Submit Quiz
												<Award className="w-4 h-4 ml-2" />
											</>
										)}
									</Button>
								</div>
							</Card>
						)}
					</div>
				)}

				{/* Kanban View */}
				{activeView === "kanban" && (
					<div className=" py-6 h-full flex flex-col mx-6">
						<KanbanView roomData={roomData} userId={currentUserId} />
					</div>
				)}
			</div>

			{/* Study Panel - Show alongside roadmap when active */}
			<AnimatePresence>
				{showStudyPanel && selectedMilestone && (
					<motion.div
						initial={{ opacity: 0, x: 300 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 300 }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="flex-1 h-full"
					>
						<StudyLayout
							milestone={selectedMilestone}
							roomData={roomData}
							userId={currentUserId}
							onClose={handleCloseStudyPanel}
							onSubtopicComplete={handleSubtopicComplete}
							onTopicComplete={handleTopicCompleteWrapper}
							timerState={timerState}
							onPauseResume={handleStopMinimizedTimer}
							onCompleteSession={handleCompleteMinimizedTimer}
							onResetTimer={async () => {
								await stopSession();
								setShowMinimizedTimer(false);
								setShowStudyPanel(false);
							}}
							userProgress={userProgress}
							streak={0}
							onlineMembers={onlineMembers}
							specificTopic={selectedTask?.specificTopic}
							todaysTasks={displayTodaysTasks}
							onMilestoneChange={(newMilestone) => {
								console.log('🔄 Changing milestone to:', newMilestone.title);
								const syntheticItem = roadmapItems.find(item => 
									item._id === newMilestone._id || 
									item.milestoneId === newMilestone.milestoneId ||
									item.title === newMilestone.title
								);
								if (syntheticItem) {
									handleContinueMilestone(syntheticItem.id);
								} else {
									setSelectedMilestone(newMilestone);
								}
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Right Members Panel - Toggleable */}
			<AnimatePresence>
				{showMembers && (
					<motion.div
						initial={{ x: 320, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 320, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="w-80 bg-background/60 backdrop-blur-sm border-l border-text/10 p-6 overflow-y-auto md:mr-5"
					>
						<div className="flex items-center space-x-2 mb-6">
							<Users className="w-5 h-5 text-text/60" />
							<h3 className="font-semibold text-text">Members</h3>
							<Badge variant="primary" className="bg-primary/10 text-primary">
								{members.length}
							</Badge>
						</div>

						<div className="space-y-3">
							{members.map((member, index) => (
								<motion.div
									key={member.id}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card
										className={`p-4 transition-all hover:shadow-md ${
											member.isCurrentUser ? "ring-2 ring-primary/30" : ""
										}`}
									>
										<div className="flex items-center space-x-3">
											<div className="relative">
												<div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
													<span className="text-primary font-medium text-lg">
														{member?.name?.charAt(0) || "?"}
													</span>
												</div>
												{member.isCurrentUser && (
													<Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
												)}
												{/* Discord-style presence indicator */}
												{(() => {
													const presence = getUserPresence ? getUserPresence(member.id) : null;
													const isOnline = presence?.status === 'online' || presence?.status === 'idle' || (Array.isArray(onlineMembers) && onlineMembers.some(o => o.id === member.id));
													return (
														<PresenceIndicator
															status={presence?.status || (isOnline ? 'online' : 'offline')}
															size="sm"
															className="absolute -bottom-0.5 -right-0.5"
														/>
													);
												})()}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2">
													<p className="font-medium text-text truncate">
														{member?.name || "Unknown User"}
													</p>
													{member.isCurrentUser && (
														<span className="text-xs text-primary font-medium">
															(You)
														</span>
													)}
												</div>
											<div className="flex items-center justify-between mt-1">
												<span
													className={`text-sm font-medium capitalize ${getProgressStatusColor(
														member.status
													)}`}
												>
													{member.status ? member.status.replace("-", " ") : "Not ready"}
												</span>
												<span className="text-sm font-semibold text-text">
													{member.progress?.progressPercentage || 0}%
												</span>
											</div>
											<div className="w-full h-2 bg-text/20 rounded-full mt-3">
												<motion.div
													initial={{ width: 0 }}
													animate={{ width: `${member.progress?.progressPercentage || 0}%` }}
													transition={{ duration: 0.8, delay: index * 0.1 }}
													className="h-full bg-primary rounded-full"
												/>
											</div>
											</div>
										</div>
									</Card>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Modals */}
			{/* Completion Prompt Modal */}
			<CompletionPromptModal
				isOpen={showCompletionPrompt}
				onContinueLearning={handleContinueLearning}
				onStopForToday={handleStopForToday}
				tasksCompleted={displayTodaysTasks.filter(t => t.completed).length}
				totalTasks={displayTodaysTasks.length}
				timeSpent={timerState.totalSessionTime || 0}
			/>

			{showMilestoneModal && selectedMilestone && (
				<MilestoneDetailModal
					milestone={selectedMilestone}
					onClose={() => {
						setShowMilestoneModal(false);
						setSelectedMilestone(null);
					}}
					onStartTracking={handleStartMilestoneTracking}
				/>
			)}

			{showTimerModal && selectedTask && (
				<TaskTimerModal
					task={selectedTask}
					milestone={selectedMilestone}
					onClose={() => {
						setShowTimerModal(false);
						setSelectedTask(null);
						setSelectedMilestone(null);
					}}
					onComplete={handleTaskComplete}
					onMinimize={handleMinimizeTimer}
					onTimerUpdate={setTimerState}
				/>
			)}

			{/* Study Session Components */}
			<AnimatePresence>
				{/* Show minimized timer only when NOT in study panel */}
				{showMinimizedTimer && timerState.task && !showStudyPanel && (
					<MinimizedTimer
						task={timerState.task}
						elapsedSeconds={timerState.elapsedSeconds}
						isRunning={timerState.isRunning}
						progress={timerState.progress}
						onExpand={handleExpandTimer}
						onStop={handleStopMinimizedTimer}
						onComplete={handleCompleteMinimizedTimer}
					/>
				)}
			</AnimatePresence>
			</div>
		</>
	);
};

export default RoomContent;
