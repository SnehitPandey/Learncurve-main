// Components/room/milestoneDetailModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	CheckCircle,
	Circle,
	Clock,
	BookOpen,
	Target,
	ChevronRight,
	PlayCircle,
	Award,
	Calendar,
} from "lucide-react";
import { Card, Button, Badge, ProgressBar } from "../../elements/elements";

const MilestoneDetailModal = ({ milestone, onClose, onStartTracking }) => {
	const [expandedTopics, setExpandedTopics] = useState(new Set());

	if (!milestone) return null;

	const toggleTopic = (index) => {
		const newExpanded = new Set(expandedTopics);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedTopics(newExpanded);
	};

	const topics = milestone.topics || [];
	const estimatedHours = milestone.estimatedHours || 0;
	const completedTopics = topics.filter((t) => t.completed).length;
	const progressPercent = topics.length > 0 ? (completedTopics / topics.length) * 100 : 0;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-background rounded-2xl shadow-2xl"
				>
					{/* Header */}
					<div className="sticky top-0 z-10 bg-gradient-to-br from-primary/20 to-alt/20 border-b border-text/10 p-6">
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
										{milestone.completed ? (
											<CheckCircle className="w-6 h-6 text-white" />
										) : (
											<PlayCircle className="w-6 h-6 text-white" />
										)}
									</div>
									<div>
										<h2 className="text-2xl font-bold text-text">
											{milestone.title}
										</h2>
										{milestone.phase && (
											<p className="text-sm text-text/60">{milestone.phase}</p>
										)}
									</div>
								</div>
								{milestone.description && (
									<p className="text-text/70 mt-2">{milestone.description}</p>
								)}
							</div>
							<button
								onClick={onClose}
								className="p-2 hover:bg-text/10 rounded-lg transition-colors"
							>
								<X className="w-5 h-5 text-text" />
							</button>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div className="bg-background/50 rounded-xl p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-text/60 text-xs mb-1">
									<Clock className="w-3 h-3" />
									<span>Estimated</span>
								</div>
								<p className="text-lg font-bold text-text">{estimatedHours}h</p>
							</div>
							<div className="bg-background/50 rounded-xl p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-text/60 text-xs mb-1">
									<Target className="w-3 h-3" />
									<span>Progress</span>
								</div>
								<p className="text-lg font-bold text-text">
									{Math.round(progressPercent)}%
								</p>
							</div>
							<div className="bg-background/50 rounded-xl p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-text/60 text-xs mb-1">
									<BookOpen className="w-3 h-3" />
									<span>Topics</span>
								</div>
								<p className="text-lg font-bold text-text">{topics.length}</p>
							</div>
							<div className="bg-background/50 rounded-xl p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-text/60 text-xs mb-1">
									<Award className="w-3 h-3" />
									<span>Week</span>
								</div>
								<p className="text-lg font-bold text-text">{milestone.week || 1}</p>
							</div>
						</div>

						{/* Progress Bar */}
						{topics.length > 0 && (
							<div className="mt-4">
								<div className="flex items-center justify-between text-sm mb-2">
									<span className="text-text/70">
										{completedTopics} of {topics.length} topics completed
									</span>
									<span className="font-semibold text-primary">
										{Math.round(progressPercent)}%
									</span>
								</div>
								<ProgressBar value={progressPercent} className="h-2" />
							</div>
						)}
					</div>

					{/* Content */}
					<div className="overflow-y-auto max-h-[calc(90vh-320px)] p-6">
						{topics.length === 0 ? (
							<div className="text-center py-12">
								<BookOpen className="w-16 h-16 text-text/30 mx-auto mb-4" />
								<p className="text-text/60">
									No topics available for this milestone yet.
								</p>
							</div>
						) : (
							<div className="space-y-3">
								<h3 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
									<BookOpen className="w-5 h-5 text-primary" />
									Learning Topics
								</h3>
								{topics.map((topic, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<Card
											className={`p-4 cursor-pointer transition-all hover:shadow-md ${
												topic.completed ? "bg-green-50 dark:bg-green-900/20" : ""
											}`}
											onClick={() => toggleTopic(index)}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3 flex-1">
													{topic.completed ? (
														<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
													) : (
														<Circle className="w-5 h-5 text-text/40 flex-shrink-0" />
													)}
													<div className="flex-1">
														<p
															className={`font-medium ${
																topic.completed
																	? "text-text/70 line-through"
																	: "text-text"
															}`}
														>
															{typeof topic === "string" ? topic : topic.title || topic.name}
														</p>
														{expandedTopics.has(index) &&
															topic.description && (
																<p className="text-sm text-text/60 mt-2">
																	{topic.description}
																</p>
															)}
													</div>
												</div>
												<ChevronRight
													className={`w-4 h-4 text-text/40 transition-transform ${
														expandedTopics.has(index) ? "rotate-90" : ""
													}`}
												/>
											</div>
											{expandedTopics.has(index) && topic.resources && (
												<div className="mt-3 pl-8 space-y-1">
													<p className="text-xs text-text/60 font-semibold mb-2">
														Resources:
													</p>
													{topic.resources.map((resource, rIdx) => (
														<a
															key={rIdx}
															href={resource.url}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sm text-primary hover:underline block"
															onClick={(e) => e.stopPropagation()}
														>
															{resource.title || resource.url}
														</a>
													))}
												</div>
											)}
										</Card>
									</motion.div>
								))}
							</div>
						)}
					</div>

					{/* Footer Actions */}
					<div className="sticky bottom-0 bg-background border-t border-text/10 p-4 flex gap-3">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Close
						</Button>
						{!milestone.completed && onStartTracking && (
							<Button
								variant="primary"
								onClick={() => {
									onStartTracking(milestone.id);
									onClose();
								}}
								className="flex-1"
							>
								<PlayCircle className="w-4 h-4 mr-2" />
								Start Learning
							</Button>
						)}
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default MilestoneDetailModal;
