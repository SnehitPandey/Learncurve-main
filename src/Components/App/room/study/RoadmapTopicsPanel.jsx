import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Book } from 'lucide-react';

const RoadmapTopicsPanel = ({ 
	milestone, 
	activeSubtopic, 
	completedSubtopics = [],
	onTopicSelect 
}) => {
	const [openTopicIndex, setOpenTopicIndex] = useState(null);

	if (!milestone || !milestone.topics) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-sm text-gray-500">No topics available</p>
			</div>
		);
	}

	const handleTopicClick = (topic, index) => {
		// Toggle dropdown
		setOpenTopicIndex(openTopicIndex === index ? null : index);
		// Select the topic
		onTopicSelect(topic);
	};

	const activeTopicTitle = typeof activeSubtopic === 'string' 
		? activeSubtopic 
		: activeSubtopic?.title;

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="mb-4">
				<h2 className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-2 flex items-center gap-2">
					<Book className="w-4 h-4" />
					Roadmap
				</h2>
				<p className="text-sm text-gray-500">
					{milestone.title || "Current Milestone"}
				</p>
			</div>

			{/* Topics List */}
			<ul className="space-y-2 overflow-y-auto flex-1">
				{milestone.topics.map((topic, index) => {
					const topicTitle = typeof topic === 'string' ? topic : topic.title;
					const topicStatus = typeof topic === 'object' ? topic.status : 'pending';
					const hasSubtopics = typeof topic === 'object' && topic.subtopics && topic.subtopics.length > 0;
					const isCompleted = topicStatus === 'completed' || (typeof topic === 'object' && topic.isCompleted) || completedSubtopics.includes(topicTitle);
					const isActive = topicTitle === activeTopicTitle;
					const isOpen = openTopicIndex === index;

					return (
						<li key={index}>
							{/* Main Topic Button */}
							<button
								onClick={() => handleTopicClick(topic, index)}
								className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all ${
									isActive
										? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
										: isCompleted
										? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
										: 'bg-slate-800 hover:bg-slate-700 text-white'
								}`}
							>
								<div className="flex items-center gap-2 flex-1">
									{isCompleted ? (
										<CheckCircle className="w-4 h-4 flex-shrink-0" />
									) : (
										<span className="text-xs font-bold w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
											{index + 1}
										</span>
									)}
									<span className="text-sm font-medium truncate">{topicTitle}</span>
								</div>
								
								{hasSubtopics && (
									<div className="flex-shrink-0 ml-2">
										{isOpen ? (
											<ChevronUp className="w-4 h-4" />
										) : (
											<ChevronDown className="w-4 h-4" />
										)}
									</div>
								)}
							</button>

							{/* Subtopics Dropdown */}
							<AnimatePresence>
								{isOpen && hasSubtopics && (
									<motion.ul
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: 'auto', opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="mt-2 ml-4 border-l-2 border-cyan-700/30 pl-3 space-y-1 overflow-hidden"
									>
										{topic.subtopics.map((subtopic, subIdx) => (
											<li
												key={subIdx}
												className="text-sm text-gray-300 hover:text-cyan-400 cursor-pointer flex items-center gap-2 py-1 transition-colors"
											>
												<Circle className="w-2 h-2 fill-current" />
												<span>{subtopic}</span>
											</li>
										))}
									</motion.ul>
								)}
							</AnimatePresence>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default RoadmapTopicsPanel;
