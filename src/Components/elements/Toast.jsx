// Components/elements/Toast.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				onClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [duration, onClose]);

	const icons = {
		success: <CheckCircle className="w-5 h-5" />,
		error: <XCircle className="w-5 h-5" />,
		warning: <AlertCircle className="w-5 h-5" />,
		info: <Info className="w-5 h-5" />,
	};

	const colors = {
		success: 'bg-green-500 text-white',
		error: 'bg-red-500 text-white',
		warning: 'bg-yellow-500 text-white',
		info: 'bg-blue-500 text-white',
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20, x: 0 }}
			animate={{ opacity: 1, y: 0, x: 0 }}
			exit={{ opacity: 0, y: -20, x: 0 }}
			className={`
				flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
				${colors[type]}
				min-w-[300px] max-w-md
			`}
		>
			<div className="flex-shrink-0">{icons[type]}</div>
			<p className="flex-1 text-sm font-medium">{message}</p>
			<button
				onClick={onClose}
				className="flex-shrink-0 hover:opacity-70 transition-opacity"
				aria-label="Close notification"
			>
				<X className="w-4 h-4" />
			</button>
		</motion.div>
	);
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
			<AnimatePresence>
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						message={toast.message}
						type={toast.type}
						duration={toast.duration}
						onClose={() => removeToast(toast.id)}
					/>
				))}
			</AnimatePresence>
		</div>
	);
};

export default Toast;
