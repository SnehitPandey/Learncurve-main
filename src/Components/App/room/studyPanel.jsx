import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight, Book, ChevronDown, ChevronUp, Sparkles, Clock, FileText, Lightbulb, Code, ExternalLink, Youtube, FileCode, BookOpen, Video, Loader } from 'lucide-react';
import { roomService } from '../../../services/roomService';

// AI-generated study content for topics (simulated - replace with real API call later)
const generateStudyContent = (topicTitle) => {
	return {
		overview: `Understanding ${topicTitle} is essential for modern web development. This topic covers fundamental concepts that you'll use throughout your coding journey.`,
		keyPoints: [
			`${topicTitle} provides the foundation for building robust applications`,
			`Learn best practices and common patterns used by professionals`,
			`Understand how to apply ${topicTitle} in real-world scenarios`,
			`Master the debugging and optimization techniques`
		],
		conceptExplanation: `${topicTitle} works by organizing code in a structured way. Think of it as a blueprint that helps you build scalable and maintainable software. The core principle is to break down complex problems into manageable pieces.`,
		practicalExample: `// Practical Example: ${topicTitle}\n\nfunction demonstrate() {\n  // Step 1: Setup\n  const data = getData();\n  \n  // Step 2: Process\n  const result = processData(data);\n  \n  // Step 3: Output\n  return result;\n}\n\n// This pattern is commonly used in production code`,
		commonMistakes: [
			'Not validating input data',
			'Forgetting error handling',
			'Ignoring performance implications'
		],
		tips: [
			'Start with simple examples',
			'Practice regularly',
			'Review code from open-source projects',
			'Ask questions when stuck'
		],
		resources: [
			{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'documentation' },
			{ title: 'Interactive Tutorial', url: '#', type: 'tutorial' },
			{ title: 'Video Course', url: '#', type: 'video' },
			{ title: 'Practice Exercises', url: '#', type: 'exercise' }
		]
	};
};

// Helper function to get resource icon
const getResourceIcon = (type) => {
	switch (type) {
		case 'youtube':
			return <Youtube className="w-4 h-4 text-red-500" />;
		case 'video':
			return <Video className="w-4 h-4 text-purple-500" />;
		case 'article':
			return <FileText className="w-4 h-4 text-blue-500" />;
		case 'documentation':
			return <BookOpen className="w-4 h-4 text-green-500" />;
		case 'interactive':
			return <Code className="w-4 h-4 text-orange-500" />;
		case 'book':
			return <Book className="w-4 h-4 text-indigo-500" />;
		default:
			return <ExternalLink className="w-4 h-4 text-teal-400" />;
	}
};

const StudyPanel = ({ milestone, roomData, userId, onSubtopicComplete, onClose }) => {
	const [activeSubtopic, setActiveSubtopic] = useState(null);
	const [completedSubtopics, setCompletedSubtopics] = useState([]);
	const [studyContent, setStudyContent] = useState(null);
	const [showExample, setShowExample] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [expandedSubtopics, setExpandedSubtopics] = useState({});

	useEffect(() => {
		if (milestone && milestone.topics && milestone.topics.length > 0) {
			// Find first uncompleted topic
			// Backend uses `isCompleted` boolean, NOT `status === 'completed'`
			const firstUncompleted = milestone.topics.find(
				topic => {
					const title = typeof topic === 'string' ? topic : topic.title;
					if (typeof topic !== 'object') return true; // string topics are pending
					return !topic.isCompleted && topic.status !== 'completed';
				}
			);
			const selected = firstUncompleted || milestone.topics[0];
			setActiveSubtopic(selected);
			
			// Generate AI content for the topic
			const topicTitle = typeof selected === 'string' ? selected : selected.title;
			setStudyContent(generateStudyContent(topicTitle));
		}
	}, [milestone]);

	const handleSubtopicSelect = (topic) => {
		setActiveSubtopic(topic);
		// Generate new content for selected topic
		const topicTitle = typeof topic === 'string' ? topic : topic.title;
		setStudyContent(generateStudyContent(topicTitle));
		setShowExample(false);
	};

	const handleMarkComplete = async () => {
		const topicTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic.title;
		const milestoneId = milestone?.id || milestone?._id || milestone?.milestoneId;
		const topicIndex = milestone?.topics?.findIndex(t => {
			const title = typeof t === 'string' ? t : t?.title;
			return title === topicTitle;
		}) ?? -1;
		
		if (!completedSubtopics.includes(topicTitle)) {
			setCompletedSubtopics([...completedSubtopics, topicTitle]);
			
			// Call backend API to mark topic complete
			if (roomData?.id && userId && milestoneId && topicIndex >= 0) {
				try {
					setCompleting(true);
					await roomService.completeTopicAndUpdateProgress(
						roomData.id,
						milestoneId,
						topicIndex
					);
					
					// Notify parent
					if (onSubtopicComplete) {
						onSubtopicComplete({
							topic: activeSubtopic,
							milestone: milestone,
							topicId: topicTitle,
							topicTitle
						});
					}
				} catch (error) {
					console.error('Failed to mark topic complete:', error);
					// Remove from completed list on error
					setCompletedSubtopics(prev => prev.filter(t => t !== topicTitle));
					alert('Failed to mark topic as complete. Please try again.');
				} finally {
					setCompleting(false);
				}
			} else {
				// Fallback if no backend integration
				if (onSubtopicComplete) {
					onSubtopicComplete({
						topic: activeSubtopic,
						milestone: milestone
					});
				}
			}
		}
		
		// Move to next uncompleted topic
		const nextTopic = milestone.topics.find(
			topic => {
				const title = typeof topic === 'string' ? topic : topic.title;
				const isDone = (typeof topic === 'object' && (topic.isCompleted || topic.status === 'completed'));
				return !isDone && !completedSubtopics.includes(title) && title !== topicTitle;
			}
		);
		
		if (nextTopic) {
			handleSubtopicSelect(nextTopic);
		}
	};

	const handleNext = () => {
		const currentIndex = milestone.topics.findIndex(t => {
			const tTitle = typeof t === 'string' ? t : t.title;
			const aTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic.title;
			return tTitle === aTitle;
		});
		
		if (currentIndex < milestone.topics.length - 1) {
			handleSubtopicSelect(milestone.topics[currentIndex + 1]);
		}
	};

	if (!milestone || !activeSubtopic) return null;

	const totalTopics = milestone.topics.length;
	const completedCount = completedSubtopics.length;
	const progressPercent = Math.round((completedCount / totalTopics) * 100);
	const activeTopicTitle = typeof activeSubtopic === 'string' ? activeSubtopic : activeSubtopic.title;
	const activeTopicStatus = typeof activeSubtopic === 'object' ? (activeSubtopic.isCompleted ? 'completed' : (activeSubtopic.status || 'pending')) : 'pending';

	return (
		<motion.div
			initial={{ opacity: 0, x: -50 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -50 }}
			className="fixed inset-0 flex h-screen overflow-hidden bg-gray-950/95 backdrop-blur-sm z-40"
			style={{ left: '64px', top: '64px' }} // Account for sidebar and top nav
		>
			{/* Left Sidebar - Topic List with Dropdown for Subtopics */}
			<div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
					{/* Sidebar Header */}
					<div className="p-4 border-b border-gray-800">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<Book className="w-5 h-5 text-teal-400" />
							{milestone.title || "Topics"}
						</h3>
						<div className="mt-3">
							<div className="flex items-center justify-between text-sm text-gray-400 mb-2">
								<span>Progress</span>
								<span className="text-teal-400 font-medium">{progressPercent}%</span>
							</div>
							<div className="w-full bg-gray-800 rounded-full h-2">
								<motion.div
									className="bg-teal-500 h-2 rounded-full"
									initial={{ width: 0 }}
									animate={{ width: `${progressPercent}%` }}
									transition={{ duration: 0.5 }}
								/>
							</div>
						</div>
					</div>

					{/* Topic List - Scrollable with Dropdown Subtopics */}
					<div className="flex-1 overflow-y-auto py-4 px-3">
						{milestone.topics.map((topic, index) => {
							const topicTitle = typeof topic === 'string' ? topic : topic.title;
							const topicStatus = typeof topic === 'object' ? topic.status : 'pending';
							const hasSubtopics = typeof topic === 'object' && topic.subtopics && topic.subtopics.length > 0;
							const isCompleted = topicStatus === 'completed' || (typeof topic === 'object' && topic.isCompleted) || completedSubtopics.includes(topicTitle);
							const isActive = topicTitle === activeTopicTitle;
							const isExpanded = expandedSubtopics[index];

							return (
								<div key={index} className="mb-2">
									{/* Main Topic Button */}
									<button
										onClick={() => {
											handleSubtopicSelect(topic);
											if (hasSubtopics) {
												setExpandedSubtopics(prev => ({
													...prev,
													[index]: !prev[index]
												}));
											}
										}}
										className={`block w-full text-left px-3 py-2.5 rounded-lg transition-all ${
											isActive
												? 'bg-teal-500 text-white shadow-lg'
												: isCompleted
												? 'bg-green-500/20 text-green-400'
												: 'text-gray-300 hover:bg-gray-800'
										}`}
									>
										<div className="flex items-start gap-2">
											<div className="flex-shrink-0 mt-0.5">
												{isCompleted ? (
													<CheckCircle className="w-4 h-4" />
												) : (
													<span className="text-xs font-bold">{index + 1}</span>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className={`text-sm font-medium ${isCompleted ? 'line-through opacity-60' : ''}`}>
													{topicTitle}
												</p>
											</div>
											{hasSubtopics && (
												<div className="flex-shrink-0">
													{isExpanded ? (
														<ChevronUp className="w-4 h-4" />
													) : (
														<ChevronDown className="w-4 h-4" />
													)}
												</div>
											)}
										</div>
									</button>

									{/* Subtopics Dropdown */}
									<AnimatePresence>
										{isExpanded && hasSubtopics && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: 'auto', opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												className="overflow-hidden ml-4 mt-1"
											>
												{topic.subtopics.map((subtopic, subIdx) => (
													<div
														key={subIdx}
														className="px-3 py-2 text-xs text-gray-400 hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-2"
													>
														<Circle className="w-2 h-2 fill-current" />
														<span>{subtopic}</span>
													</div>
												))}
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							);
						})}
					</div>
				</div>

				{/* Main Content Area - Study Panel */}
				<div className="flex-1 flex flex-col relative">
					{/* Content Header */}
					<div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h2 className="text-2xl font-bold text-white flex items-center gap-2">
									<Sparkles className="w-6 h-6 text-teal-400" />
									{activeTopicTitle}
								</h2>
								<p className="text-gray-400 mt-1 flex items-center gap-2 text-sm">
									<Clock className="w-4 h-4" />
									Study Time: {milestone.estimatedHours || 2}h estimated
								</p>
							</div>
							<button
								onClick={onClose}
								className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
							>
								<X className="w-6 h-6 text-gray-400 hover:text-white" />
							</button>
						</div>
					</div>

					{/* Study Content - Scrollable with Padding for Fixed Buttons */}
					<div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
						{studyContent && (
							<div className="max-w-5xl mx-auto space-y-6">
								{/* Overview Card */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="bg-gray-900 rounded-xl p-4 border border-gray-800"
								>
									<div className="flex items-center gap-2 mb-4">
										<FileText className="w-5 h-5 text-teal-400" />
										<h3 className="text-lg font-semibold text-white">Overview</h3>
									</div>
									<p className="text-gray-300 leading-relaxed">
										{studyContent.overview}
									</p>
								</motion.div>

								{/* Key Points */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="bg-gray-900 rounded-xl p-4 border border-gray-800"
								>
									<div className="flex items-center gap-2 mb-4">
										<Lightbulb className="w-5 h-5 text-yellow-500" />
										<h3 className="text-lg font-semibold text-teal-400">Key Points</h3>
									</div>
									<ul className="list-decimal list-inside text-gray-300 space-y-1">
										{studyContent.keyPoints.map((point, idx) => (
											<li key={idx} className="leading-relaxed">
												{point}
											</li>
										))}
									</ul>
								</motion.div>

								{/* Subtopics Accordion - Show if available from backend */}
								{activeSubtopic && typeof activeSubtopic === 'object' && activeSubtopic.subtopics && activeSubtopic.subtopics.length > 0 && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.15 }}
										className="bg-gray-900 rounded-xl p-4 border border-gray-800"
									>
										<div className="flex items-center gap-2 mb-4">
											<BookOpen className="w-5 h-5 text-purple-500" />
											<h3 className="text-lg font-semibold text-teal-400">Subtopics Breakdown</h3>
										</div>
										<div className="grid md:grid-cols-2 gap-3">
											{activeSubtopic.subtopics.map((subtopic, idx) => (
												<div key={idx} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
													<div className="flex items-start gap-2">
														<span className="text-teal-400 font-bold text-sm">{idx + 1}.</span>
														<p className="text-sm text-white font-medium">{subtopic}</p>
													</div>
												</div>
											))}
										</div>
									</motion.div>
								)}

								{/* Concept Explanation */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
									className="bg-gray-900 rounded-xl p-4 border border-gray-800"
								>
									<h3 className="text-lg font-semibold text-teal-400 mb-2">Detailed Explanation</h3>
									<p className="text-gray-300 leading-relaxed">
										{studyContent.conceptExplanation}
									</p>
								</motion.div>

								{/* Code Example */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
									className="bg-gray-900 rounded-xl p-4 border border-gray-800"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Code className="w-5 h-5 text-blue-500" />
											<h3 className="text-lg font-semibold text-teal-400">Code Example</h3>
										</div>
										<button
											onClick={() => setShowExample(!showExample)}
											className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
										>
											{showExample ? (
												<>Hide <ChevronUp className="w-4 h-4" /></>
											) : (
												<>Show <ChevronDown className="w-4 h-4" /></>
											)}
										</button>
									</div>
									<AnimatePresence>
										{showExample && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: 'auto', opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												className="overflow-hidden mt-3"
											>
												<pre className="bg-gray-800 p-3 rounded-lg text-sm text-teal-300 overflow-x-auto">
													<code className="font-mono">
														{studyContent.practicalExample}
													</code>
												</pre>
											</motion.div>
										)}
									</AnimatePresence>
								</motion.div>

								{/* Tips & Best Practices */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
									className="bg-gray-900 rounded-xl p-4 border border-gray-800"
								>
									<h3 className="text-lg font-semibold text-teal-400 mb-4">💡 Tips & Best Practices</h3>
									<div className="grid md:grid-cols-2 gap-4">
										<div>
											<h4 className="text-sm font-semibold text-teal-400 mb-2">✓ Do This:</h4>
											<ul className="space-y-2">
												{studyContent.tips.map((tip, idx) => (
													<li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
														<span className="text-green-500 mt-0.5">•</span>
														<span>{tip}</span>
													</li>
												))}
											</ul>
										</div>
										<div>
											<h4 className="text-sm font-semibold text-red-400 mb-2">✗ Common Mistakes:</h4>
											<ul className="space-y-2">
												{studyContent.commonMistakes.map((mistake, idx) => (
													<li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
														<span className="text-red-400 mt-0.5">•</span>
														<span>{mistake}</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								</motion.div>

								{/* Resources */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.5 }}
									className="bg-gray-900 rounded-xl p-4 border border-gray-800"
								>
									<h3 className="text-lg font-semibold text-teal-400 mb-4">📚 Learning Resources</h3>
									
									{/* Show real resources from backend if available */}
									{activeSubtopic && typeof activeSubtopic === 'object' && activeSubtopic.resources && activeSubtopic.resources.length > 0 ? (
										<div className="grid md:grid-cols-2 gap-3">
											{activeSubtopic.resources.map((resource, idx) => (
												<a
													key={idx}
													href={resource.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
												>
													{getResourceIcon(resource.type)}
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-white truncate">{resource.title}</p>
														<div className="flex items-center gap-2 text-xs text-gray-400">
															<span className="capitalize">{resource.type}</span>
															{resource.duration && (
																<>
																	<span>•</span>
																	<span>{resource.duration}</span>
																</>
															)}
															{resource.author && (
																<>
																	<span>•</span>
																	<span className="truncate">{resource.author}</span>
																</>
															)}
														</div>
													</div>
												</a>
											))}
										</div>
									) : studyContent?.resources ? (
										<div className="grid md:grid-cols-2 gap-3">
											{studyContent.resources.map((resource, idx) => (
												<a
													key={idx}
													href={resource.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
												>
													{getResourceIcon(resource.type)}
													<div className="flex-1">
														<p className="text-sm font-medium text-white">{resource.title}</p>
														<p className="text-xs text-gray-400 capitalize">{resource.type}</p>
													</div>
												</a>
											))}
										</div>
									) : (
										<div className="text-center py-8 text-gray-400">
											<FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
											<p className="text-sm">No resources available yet</p>
											<p className="text-xs mt-1">Resources will be added as AI generates them</p>
										</div>
									)}
								</motion.div>
							</div>
						)}
					</div>

					{/* Fixed Bottom Action Buttons */}
					<div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-4">
						<div className="max-w-5xl mx-auto flex justify-end gap-3">
							<button
								onClick={handleMarkComplete}
								disabled={completing || activeTopicStatus === 'completed' || completedSubtopics.includes(activeTopicTitle)}
								className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg ${
									activeTopicStatus === 'completed' || completedSubtopics.includes(activeTopicTitle)
										? 'bg-green-500 text-white cursor-not-allowed opacity-75'
										: completing
										? 'bg-teal-400 text-white cursor-wait opacity-75'
										: 'bg-teal-500 hover:bg-teal-600 text-white'
								}`}
							>
								{completing ? (
									<>
										<Loader className="w-5 h-5 animate-spin" />
										Saving...
									</>
								) : activeTopicStatus === 'completed' || completedSubtopics.includes(activeTopicTitle) ? (
									<>
										<CheckCircle className="w-5 h-5" />
										Completed
									</>
								) : (
									<>
										<CheckCircle className="w-5 h-5" />
										Mark Complete
									</>
								)}
							</button>
							
							<button
								onClick={handleNext}
								disabled={milestone.topics.indexOf(activeSubtopic) === milestone.topics.length - 1}
								className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
							>
								Next Topic
								<ArrowRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</motion.div>
	);
};

export default StudyPanel;
