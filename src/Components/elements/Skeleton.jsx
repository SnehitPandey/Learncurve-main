// Components/elements/Skeleton.jsx
import React from 'react';

export const Skeleton = ({ className = '', width, height, circle = false }) => {
	const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
	const shapeClasses = circle ? 'rounded-full' : 'rounded-lg';
	
	const style = {};
	if (width) style.width = width;
	if (height) style.height = height;

	return (
		<div
			className={`${baseClasses} ${shapeClasses} ${className}`}
			style={style}
		/>
	);
};

export const TaskSkeleton = () => (
	<div className="flex items-center justify-between p-4 rounded-xl bg-alt/10">
		<div className="flex items-center space-x-3">
			<Skeleton circle width="24px" height="24px" />
			<div className="space-y-2">
				<Skeleton width="200px" height="16px" />
				<Skeleton width="150px" height="12px" />
			</div>
		</div>
		<Skeleton width="80px" height="32px" />
	</div>
);

export const CardSkeleton = () => (
	<div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
		<div className="flex items-center justify-between mb-4">
			<div className="space-y-2 flex-1">
				<Skeleton width="40%" height="20px" />
				<Skeleton width="60%" height="14px" />
			</div>
			<Skeleton circle width="48px" height="48px" />
		</div>
	</div>
);

export const MilestoneSkeleton = () => (
	<div className="relative p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
		<div className="flex items-center justify-between mb-4">
			<div className="space-y-2 flex-1">
				<Skeleton width="70%" height="20px" />
				<Skeleton width="50%" height="14px" />
			</div>
			<Skeleton width="60px" height="24px" />
		</div>
		<div className="space-y-2 mt-4">
			<Skeleton width="100%" height="8px" />
		</div>
	</div>
);

export const QuizSkeleton = () => (
	<div className="space-y-6">
		<div className="space-y-2">
			<Skeleton width="80%" height="20px" />
			<Skeleton width="60%" height="14px" />
		</div>
		<div className="space-y-3">
			{[1, 2, 3, 4].map((i) => (
				<Skeleton key={i} width="100%" height="48px" />
			))}
		</div>
	</div>
);

export default Skeleton;
