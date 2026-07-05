// Components/ui/index.jsx
import React from "react";
import { motion } from "framer-motion";

// Card Component
export const Card = ({ children, className = "", variant = "default", ...props }) => {
    const variants = {
        default: "bg-background/60 border-text/20 backdrop-blur-sm",
        elevated: "bg-background shadow-lg border-text/20",
        interactive: "bg-alt/50 hover:bg-alt/80 transition-colors border-text/20"
    };

    return (
        <div 
            className={`border rounded-2xl p-6 ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Button Component
export const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
    const variants = {
        primary: "bg-primary hover:bg-primary/90 text-alt shadow-lg shadow-primary/25",
        secondary: "bg-secondary hover:bg-secondary/90 text-text",
        outline: "border-2 border-text/20 hover:bg-alt text-text",
        ghost: "hover:bg-alt/50 text-text"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
};

// Badge Component
export const Badge = ({ children, variant = "default", size = "sm" }) => {
    const variants = {
        default: "bg-alt text-text/80",
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        primary: "bg-primary/20 text-primary"
    };

    const sizes = {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-1.5 text-sm"
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
            {children}
        </span>
    );
};

// ProgressBar Component
export const ProgressBar = ({ value, max = 100, variant = "primary", className = "" }) => {
    const variants = {
        primary: "bg-primary",
        success: "bg-green-500",
        warning: "bg-amber-500",
        danger: "bg-red-500"
    };

    return (
        <div className={`w-full bg-text/10 rounded-full h-2 ${className}`}>
            <div
                className={`h-2 rounded-full transition-all duration-300 ${variants[variant]}`}
                style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            />
        </div>
    );
};

// Avatar Component
export const Avatar = ({ name, size = "md", status = null }) => {
    const sizes = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-base"
    };

    const statusColors = {
        ahead: "ring-green-500",
        behind: "ring-red-500",
        "on-track": "ring-primary"
    };

    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();

    return (
        <div className="relative flex-shrink-0">
            <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center font-bold text-alt ${status ? `ring-2 ${statusColors[status]}` : ''}`}>
                {initials}
            </div>
        </div>
    );
};
