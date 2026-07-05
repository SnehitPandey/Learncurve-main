// Components/room/taskTimerModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	PlayCircle,
	PauseCircle,
	StopCircle,
	Clock,
	Target,
	Coffee,
	CheckCircle,
	Zap,
} from "lucide-react";
import { Card, Button, Badge } from "../../elements/elements";

const TaskTimerModal = ({ task, milestone, onClose, onComplete, onMinimize, onTimerUpdate }) => {
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [sessionCount, setSessionCount] = useState(0);
	const intervalRef = useRef(null);
	const startTimeRef = useRef(null);

	// Pomodoro settings (25 min work, 5 min break)
	const WORK_DURATION = 25 * 60; // 25 minutes in seconds
	const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

	useEffect(() => {
		if (isRunning && !isPaused) {
			startTimeRef.current = Date.now() - elapsedSeconds * 1000;
			intervalRef.current = setInterval(() => {
				const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
				setElapsedSeconds(elapsed);
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isRunning, isPaused]);

	// Sync timer state to parent component for minimized view
	useEffect(() => {
		if (onTimerUpdate) {
			const progress = Math.min((elapsedSeconds / WORK_DURATION) * 100, 100);
			onTimerUpdate({
				isRunning,
				elapsedSeconds,
				progress,
				task,
				milestone,
			});
		}
	}, [isRunning, elapsedSeconds, task, milestone, onTimerUpdate]);

	const formatTime = (seconds) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleStart = () => {
		setIsRunning(true);
		setIsPaused(false);
	};

	const handlePause = () => {
		setIsPaused(true);
	};

	const handleResume = () => {
		setIsPaused(false);
	};

	const handleStop = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
		setIsRunning(false);
		setIsPaused(false);
	};

	const handleComplete = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
		const timeSpent = formatTime(elapsedSeconds);
		onComplete?.({ taskId: task.id, timeSpent, elapsedSeconds });
		onClose();
	};

	const handleBreak = () => {
		setSessionCount((prev) => prev + 1);
		// You can add break timer logic here if needed
		alert(`Great work! Take a ${BREAK_DURATION / 60} minute break. 🎉`);
	};

	const progressPercent = Math.min(
		(elapsedSeconds / WORK_DURATION) * 100,
		100
	);

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden"
				>
					{/* Header */}
					<div className="bg-gradient-to-br from-primary/20 to-alt/20 p-6 border-b border-text/10">
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
										<Clock className="w-5 h-5 text-white" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-text">Focus Timer</h2>
										<p className="text-sm text-text/60">Stay focused, stay productive</p>
									</div>
								</div>
							</div>
							<div className="flex gap-2">
								{onMinimize && isRunning && (
									<button
										onClick={onMinimize}
										className="p-2 hover:bg-text/10 rounded-lg transition-colors"
										title="Minimize and open study panel"
									>
										<Target className="w-5 h-5 text-primary" />
									</button>
								)}
								<button
									onClick={onClose}
									className="p-2 hover:bg-text/10 rounded-lg transition-colors"
								>
									<X className="w-5 h-5 text-text" />
								</button>
							</div>
						</div>

						{/* Task Info */}
						<Card className="p-4 bg-background/50 backdrop-blur-sm">
							<p className="font-semibold text-text mb-1">{task?.title}</p>
							{milestone?.title && (
								<p className="text-sm text-text/60 flex items-center gap-2">
									<Target className="w-3 h-3" />
									{milestone.title}
								</p>
							)}
						</Card>
					</div>

					{/* Timer Display */}
					<div className="p-8 text-center">
						{/* Main Timer */}
						<motion.div
							className="mb-6"
							animate={{
								scale: isRunning && !isPaused ? [1, 1.02, 1] : 1,
							}}
							transition={{
								duration: 1,
								repeat: isRunning && !isPaused ? Infinity : 0,
							}}
						>
							<div className="text-6xl md:text-7xl font-bold text-primary mb-2 font-mono">
								{formatTime(elapsedSeconds)}
							</div>
							<p className="text-text/60 text-sm">
								{isRunning
									? isPaused
										? "Paused"
										: "Timer Running"
									: "Ready to start"}
							</p>
						</motion.div>

						{/* Progress Circle */}
						<div className="mb-6">
							<div className="relative w-48 h-48 mx-auto">
								<svg
									className="transform -rotate-90"
									width="192"
									height="192"
								>
									<circle
										cx="96"
										cy="96"
										r="88"
										stroke="currentColor"
										strokeWidth="8"
										fill="none"
										className="text-text/10"
									/>
									<motion.circle
										cx="96"
										cy="96"
										r="88"
										stroke="currentColor"
										strokeWidth="8"
										fill="none"
										strokeLinecap="round"
										className="text-primary"
										initial={{ pathLength: 0 }}
										animate={{ pathLength: progressPercent / 100 }}
										style={{
											strokeDasharray: 552,
											strokeDashoffset: 552 * (1 - progressPercent / 100),
										}}
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<Zap className="w-8 h-8 text-primary mx-auto mb-1" />
										<p className="text-sm font-semibold text-text">
											{Math.round(progressPercent)}%
										</p>
										<p className="text-xs text-text/60">
											of 25 min
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-2 gap-4 mb-6">
							<Card className="p-4">
								<p className="text-xs text-text/60 mb-1">Sessions</p>
								<p className="text-2xl font-bold text-text">{sessionCount}</p>
							</Card>
							<Card className="p-4">
								<p className="text-xs text-text/60 mb-1">Target</p>
								<p className="text-2xl font-bold text-text">25m</p>
							</Card>
						</div>

						{/* Controls */}
						<div className="flex gap-3 justify-center">
							{!isRunning ? (
								<Button
									variant="primary"
									size="lg"
									onClick={handleStart}
									className="flex-1 max-w-xs"
								>
									<PlayCircle className="w-5 h-5 mr-2" />
									Start Focus
								</Button>
							) : (
								<>
									{!isPaused ? (
										<Button
											variant="outline"
											size="lg"
											onClick={handlePause}
											className="flex-1"
										>
											<PauseCircle className="w-5 h-5 mr-2" />
											Pause
										</Button>
									) : (
										<Button
											variant="primary"
											size="lg"
											onClick={handleResume}
											className="flex-1"
										>
											<PlayCircle className="w-5 h-5 mr-2" />
											Resume
										</Button>
									)}
									<Button
										variant="outline"
										size="lg"
										onClick={handleStop}
										className="flex-1"
									>
										<StopCircle className="w-5 h-5 mr-2" />
										Stop
									</Button>
								</>
							)}
						</div>

						{/* Additional Actions */}
						{isRunning && elapsedSeconds >= WORK_DURATION && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-4"
							>
								<Button
									variant="success"
									size="lg"
									onClick={handleBreak}
									className="w-full"
								>
									<Coffee className="w-5 h-5 mr-2" />
									Take a Break (5 min)
								</Button>
							</motion.div>
						)}
					</div>

					{/* Footer */}
					<div className="border-t border-text/10 p-4 bg-background/50">
						<div className="flex gap-3">
							<Button variant="outline" onClick={onClose} className="flex-1">
								Cancel
							</Button>
							{elapsedSeconds > 0 && (
								<Button
									variant="primary"
									onClick={handleComplete}
									className="flex-1"
								>
									<CheckCircle className="w-4 h-4 mr-2" />
									Mark Complete
								</Button>
							)}
						</div>
						<p className="text-xs text-center text-text/50 mt-3">
							💡 Tip: Take short breaks every 25 minutes for better focus
						</p>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default TaskTimerModal;
