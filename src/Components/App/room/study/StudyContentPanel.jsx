import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
	FileText, 
	Lightbulb, 
	Code, 
	ChevronDown, 
	ChevronUp, 
	BookOpen, 
	CheckCircle,
	ArrowRight,
	ExternalLink,
	Youtube,
	Video,
	Loader
} from 'lucide-react';

const StudyContentPanel = ({ 
	studyContent, 
	activeSubtopic, 
	isCompleted,
	isCompleting,
	onMarkComplete,
	onNext
}) => {
	const [showExample, setShowExample] = useState(false);

	if (!studyContent) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
					<p className="text-gray-400">Select a topic to start studying</p>
				</div>
			</div>
		);
	}

	const activeTopicTitle = typeof activeSubtopic === 'string' 
		? activeSubtopic 
		: activeSubtopic?.title;

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
			default:
				return <ExternalLink className="w-4 h-4 text-cyan-400" />;
		}
	};

	return (
		<div className="space-y-6 pb-24">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-white mb-2">
					{activeTopicTitle}
				</h1>
				<p className="text-gray-400">
					Master this concept before moving to the next topic
				</p>
			</div>

			{/* Overview Section */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
			>
				<div className="flex items-center gap-2 mb-4">
					<FileText className="w-5 h-5 text-cyan-400" />
					<h3 className="text-lg font-semibold text-white">Overview</h3>
				</div>
				<p className="text-gray-300 leading-relaxed">
					{studyContent.overview}
				</p>
			</motion.section>

			{/* Key Points Section */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
			>
				<div className="flex items-center gap-2 mb-4">
					<Lightbulb className="w-5 h-5 text-yellow-500" />
					<h3 className="text-lg font-semibold text-cyan-400">Key Points</h3>
				</div>
				<ul className="list-decimal list-inside text-gray-300 space-y-2">
					{studyContent.keyPoints?.map((point, idx) => (
						<li key={idx} className="leading-relaxed">
							{point}
						</li>
					))}
				</ul>
			</motion.section>

			{/* Subtopics Grid (if available) */}
			{activeSubtopic && typeof activeSubtopic === 'object' && activeSubtopic.subtopics && activeSubtopic.subtopics.length > 0 && (
				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
					className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
				>
					<div className="flex items-center gap-2 mb-4">
						<BookOpen className="w-5 h-5 text-purple-500" />
						<h3 className="text-lg font-semibold text-cyan-400">Subtopics Breakdown</h3>
					</div>
					<div className="grid md:grid-cols-2 gap-3">
						{activeSubtopic.subtopics.map((subtopic, idx) => (
							<div key={idx} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
								<div className="flex items-start gap-2">
									<span className="text-cyan-400 font-bold text-sm">{idx + 1}.</span>
									<p className="text-sm text-white font-medium">{subtopic}</p>
								</div>
							</div>
						))}
					</div>
				</motion.section>
			)}

			{/* Detailed Explanation */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
			>
				<h3 className="text-lg font-semibold text-cyan-400 mb-3">Detailed Explanation</h3>
				<p className="text-gray-300 leading-relaxed">
					{studyContent.conceptExplanation}
				</p>
			</motion.section>

			{/* Code Example */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
			>
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<Code className="w-5 h-5 text-blue-500" />
						<h3 className="text-lg font-semibold text-cyan-400">Code Example</h3>
					</div>
					<button
						onClick={() => setShowExample(!showExample)}
						className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
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
							className="overflow-hidden"
						>
							<pre className="bg-slate-950 p-4 rounded-lg text-sm text-cyan-300 overflow-x-auto border border-slate-700">
								<code className="font-mono">
									{studyContent.practicalExample}
								</code>
							</pre>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.section>

			{/* Tips & Common Mistakes */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
			>
				<h3 className="text-lg font-semibold text-cyan-400 mb-4">💡 Tips & Best Practices</h3>
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<h4 className="text-sm font-semibold text-green-400 mb-2">✓ Do This:</h4>
						<ul className="space-y-2">
							{studyContent.tips?.map((tip, idx) => (
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
							{studyContent.commonMistakes?.map((mistake, idx) => (
								<li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
									<span className="text-red-400 mt-0.5">•</span>
									<span>{mistake}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</motion.section>

			{/* Learning Resources */}
			{studyContent.resources && studyContent.resources.length > 0 && (
				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md"
				>
					<h3 className="text-lg font-semibold text-cyan-400 mb-4">📚 Learning Resources</h3>
					<div className="grid md:grid-cols-2 gap-3">
						{studyContent.resources.map((resource, idx) => (
							<a
								key={idx}
								href={resource.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group border border-slate-600"
							>
								{getResourceIcon(resource.type)}
								<div className="flex-1">
									<p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
										{resource.title}
									</p>
									<p className="text-xs text-gray-400 capitalize">{resource.type}</p>
								</div>
								<ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
							</a>
						))}
					</div>
				</motion.section>
			)}

			{/* Action Buttons - Fixed at Bottom */}
			<div className="fixed bottom-0 left-[424px] right-[340px] bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-6 pb-4 px-6">
				<div className="max-w-5xl mx-auto flex justify-end gap-3">
					<button
						onClick={onMarkComplete}
						disabled={isCompleting || isCompleted}
						className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg ${
							isCompleted
								? 'bg-green-500 text-white cursor-not-allowed opacity-75'
								: isCompleting
								? 'bg-cyan-400 text-white cursor-wait opacity-75'
								: 'bg-cyan-500 hover:bg-cyan-600 text-white'
						}`}
					>
						{isCompleting ? (
							<>
								<Loader className="w-5 h-5 animate-spin" />
								Saving...
							</>
						) : isCompleted ? (
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
						onClick={onNext}
						className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white transition-colors shadow-lg"
					>
						Next Topic
						<ArrowRight className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default StudyContentPanel;
