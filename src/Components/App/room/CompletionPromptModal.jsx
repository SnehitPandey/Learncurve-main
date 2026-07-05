import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, X, Zap } from 'lucide-react';
import { Button } from '../../elements/elements';

const CompletionPromptModal = ({ 
	isOpen = false,
	onContinueLearning,
	onStopForToday,
	tasksCompleted = 0,
	totalTasks = 0,
	timeSpent = 0
}) => {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			setIsClosing(false);
			onStopForToday?.();
		}, 300);
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 z-40"
						onClick={handleClose}
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="fixed inset-0 flex items-center justify-center z-50 p-4"
					>
						<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
							{/* Header with close button */}
							<div className="relative p-6 pb-0">
								<button
									onClick={handleClose}
									className="absolute top-4 right-4 text-text/60 hover:text-text transition-colors"
									aria-label="Close"
								>
									<X className="w-5 h-5" />
								</button>

								{/* Trophy Icon */}
								<div className="flex justify-center mb-4">
									<div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
										<Trophy className="w-8 h-8 text-white" />
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="p-6 pt-4 text-center">
								<h2 className="text-2xl font-bold text-text mb-2">Outstanding Work! 🎉</h2>
								<p className="text-text/70 mb-6">
									You've completed all {totalTasks} tasks for today!
								</p>

								{/* Stats */}
								<div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 mb-6">
									<div className="flex justify-between items-center text-sm">
										<span className="text-text/70">Tasks Completed:</span>
										<span className="font-bold text-primary">{tasksCompleted}/{totalTasks}</span>
									</div>
									{timeSpent > 0 && (
										<div className="flex justify-between items-center text-sm mt-2">
											<span className="text-text/70">Time Invested:</span>
											<span className="font-bold text-primary">{timeSpent} min</span>
										</div>
									)}
								</div>

								<p className="text-text/60 text-sm mb-6">
									Want to keep the momentum going? Continue learning with additional topics or take a break.
								</p>
							</div>

							{/* Actions */}
							<div className="p-6 pt-4 space-y-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
								<Button
									variant="primary"
									className="w-full flex items-center justify-center gap-2"
									onClick={onContinueLearning}
								>
									<Zap className="w-4 h-4" />
									Continue Learning
								</Button>
								<Button
									variant="ghost"
									className="w-full"
									onClick={handleClose}
								>
									Done for Today
								</Button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default CompletionPromptModal;
