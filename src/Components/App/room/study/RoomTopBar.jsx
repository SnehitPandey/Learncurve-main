import React from 'react';
import { motion } from 'framer-motion';
import { Users, Flame, Wifi, Settings, X } from 'lucide-react';
import { ProgressBar } from '../../../elements/elements';

const RoomTopBar = ({ roomData, onClose, userProgress, streak, onlineMembers = [] }) => {
	const progressPercentage = userProgress?.progressPercentage || 0;
	const currentWeek = roomData?.daysRemaining 
		? Math.ceil((30 - roomData.daysRemaining) / 7) 
		: 1;

	return (
		<div className="flex justify-between items-center w-full">
			{/* Left Section - Room Info */}
			<div className="flex items-center gap-4">
				<h1 className="text-lg font-semibold text-white">
					{roomData?.title || "Study Room"}
				</h1>
				<span className="text-sm text-cyan-400">
					Week {currentWeek} • {roomData?.currentMilestone || "Getting Started"}
				</span>
			</div>

			{/* Right Section - Stats & Actions */}
			<div className="flex items-center gap-4">
				{/* Progress */}
				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-400">Progress</span>
					<div className="w-32">
						<ProgressBar percentage={progressPercentage} className="h-2" />
					</div>
					<span className="text-sm font-semibold text-cyan-400">
						{Math.round(progressPercentage)}%
					</span>
				</div>

				{/* Streak Badge */}
				{streak > 0 && (
					<motion.div
						initial={{ scale: 0.9 }}
						animate={{ scale: 1 }}
						className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full"
					>
						<Flame className="w-4 h-4" />
						<span className="text-sm font-bold">{streak} day{streak !== 1 ? 's' : ''}</span>
					</motion.div>
				)}

				{/* Presence Indicator */}
				<div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
					<Wifi className="w-4 h-4" />
					<Users className="w-4 h-4" />
					<span className="text-sm font-medium">{onlineMembers.length}</span>
				</div>

				{/* Settings */}
				<button
					className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
					title="Settings"
				>
					<Settings className="w-5 h-5 text-gray-400 hover:text-white" />
				</button>

				{/* Close */}
				<button
					onClick={onClose}
					className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
					title="Close Study Panel"
				>
					<X className="w-5 h-5 text-gray-400 hover:text-white" />
				</button>
			</div>
		</div>
	);
};

export default RoomTopBar;
