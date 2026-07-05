// Components/App/room/minimizedTimer.jsx
import React from "react";
import { motion } from "framer-motion";
import { Maximize2, PauseCircle, PlayCircle, CheckCircle } from "lucide-react";

const MinimizedTimer = ({ 
	task, 
	elapsedSeconds, 
	isRunning, 
	progress, 
	onExpand, 
	onStop, 
	onComplete 
}) => {
	const formatTime = (seconds) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className="fixed top-20 right-6 z-50 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-cyan-500/20 p-4 w-80"
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
					<span className="text-xs text-gray-400 font-medium">Focus Session</span>
				</div>
				<button
					onClick={onExpand}
					className="text-gray-400 hover:text-white transition-colors"
					title="Expand timer"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>

			{/* Task Title */}
			<h4 className="text-white text-sm font-semibold mb-2 truncate" title={task?.title}>
				{task?.title || "Study Session"}
			</h4>

			{/* Time Display */}
			<div className="flex items-center justify-between mb-3">
				<div className="text-3xl font-mono text-cyan-400">
					{formatTime(elapsedSeconds)}
				</div>
				<div className="text-right">
					<div className="text-xs text-gray-400">Progress</div>
					<div className="text-lg font-bold text-cyan-400">{Math.round(progress)}%</div>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
				<motion.div
					className="h-full bg-gradient-to-r from-cyan-400 to-teal-400"
					initial={{ width: 0 }}
					animate={{ width: `${progress}%` }}
					transition={{ duration: 0.5 }}
				/>
			</div>

			{/* Quick Actions */}
			<div className="flex gap-2">
				<button
					onClick={onStop}
					className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium ${
						isRunning 
							? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' 
							: 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
					}`}
				>
					{isRunning ? (
						<>
							<PauseCircle className="w-4 h-4" />
							Pause
						</>
					) : (
						<>
							<PlayCircle className="w-4 h-4" />
							Resume
						</>
					)}
				</button>
				<button
					onClick={onComplete}
					className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-xs font-medium"
				>
					<CheckCircle className="w-4 h-4" />
					Done
				</button>
			</div>
		</motion.div>
	);
};

export default MinimizedTimer;
