import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw, Minimize2, Maximize2, CheckCircle } from 'lucide-react';

const FocusTimerWidget = ({ 
	elapsedSeconds = 0,
	isRunning = false,
	progress = 0,
	task,
	onPauseResume,
	onComplete,
	onReset,
	isMinimized = false,
	onToggleMinimize,
	autoStart = false,
	onSessionPersist,
	onSessionResume
}) => {
	useEffect(() => {
		if (autoStart && !isRunning && elapsedSeconds === 0) {
			onPauseResume(); // Auto-start the timer
		}
	}, [autoStart, isRunning, elapsedSeconds, onPauseResume]);

	useEffect(() => {
		if (isRunning && onSessionPersist) {
			onSessionPersist({ startedAt: new Date(), topicId: task?.id });
		}
	}, [isRunning, task, onSessionPersist]);

	useEffect(() => {
		if (!isRunning && elapsedSeconds > 0 && onSessionResume) {
			onSessionResume();
		}
	}, [isRunning, elapsedSeconds, onSessionResume]);

	const formatTime = (seconds) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Minimized floating button
	if (isMinimized) {
		return (
			<motion.button
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				exit={{ scale: 0 }}
				onClick={onToggleMinimize}
				className="fixed top-5 right-5 z-[100] bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transition-all"
				title="Expand Timer"
			>
				<div className="text-center">
					<Clock className="w-6 h-6 mx-auto" />
					<span className="text-xs font-mono font-bold">{formatTime(elapsedSeconds)}</span>
				</div>
			</motion.button>
		);
	}

	// Full timer widget
	return (
		<div className="w-full h-full flex flex-col justify-center items-center p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full shadow-xl border border-slate-700"
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
						<h3 className="text-sm text-gray-400 font-semibold">Focus Session</h3>
					</div>
					<button
						onClick={onToggleMinimize}
						className="text-gray-400 hover:text-white transition-colors"
						title="Minimize"
					>
						<Minimize2 className="w-4 h-4" />
					</button>
				</div>

				{/* Task Title */}
				{task && (
					<h4 className="text-white text-sm font-semibold mb-4 truncate" title={task.title}>
						{task.title || "Study Session"}
					</h4>
				)}

				{/* Timer Display */}
				<div className="text-center mb-4">
					<div className="text-5xl font-mono font-bold text-cyan-400 mb-2">
						{formatTime(elapsedSeconds)}
					</div>
					<div className="flex items-center justify-center gap-2">
						<span className="text-xs text-gray-400">Progress</span>
						<span className="text-lg font-bold text-cyan-400">{Math.round(progress)}%</span>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="w-full bg-slate-700 rounded-full h-3 mb-6 overflow-hidden">
					<motion.div
						className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
						initial={{ width: 0 }}
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.5 }}
					/>
				</div>

				{/* Control Buttons */}
				<div className="flex flex-col gap-2">
					{/* Play/Pause */}
					<button
						onClick={onPauseResume}
						className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
							isRunning 
								? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30' 
								: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
						}`}
					>
						{isRunning ? (
							<>
								<Pause className="w-5 h-5" />
								Pause
							</>
						) : (
							<>
								<Play className="w-5 h-5" />
								{elapsedSeconds > 0 ? 'Resume' : 'Start'}
							</>
						)}
					</button>

					{/* Complete */}
					<button
						onClick={onComplete}
						disabled={elapsedSeconds === 0}
						className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg font-medium transition-all border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<CheckCircle className="w-5 h-5" />
						Complete
					</button>

					{/* Reset */}
					<button
						onClick={onReset}
						disabled={elapsedSeconds === 0}
						className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-gray-300 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<RotateCcw className="w-4 h-4" />
						Reset
					</button>
				</div>

				{/* Session Info */}
				{elapsedSeconds > 0 && (
					<div className="mt-4 pt-4 border-t border-slate-700">
						<div className="flex justify-between text-xs text-gray-400">
							<span>Time Studied</span>
							<span className="font-semibold text-gray-300">
								{Math.floor(elapsedSeconds / 60)} min
							</span>
						</div>
					</div>
				)}
			</motion.div>
		</div>
	);
};

export default FocusTimerWidget;
