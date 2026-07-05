import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
    const [dark, setDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const currentTheme = document.documentElement.getAttribute("data-theme");
        
        if (!currentTheme) {
            const theme = prefersDark ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", theme);
            setDark(theme === "dark");
        } else {
            setDark(currentTheme === "dark");
        }
        
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        setDark(newTheme === "dark");
    };

    if (!mounted) {
        return (
            <button className="rounded-full p-1 transition-all duration-300">
                <div className="size-5 md:size-6 xl:size-7 p-1" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-pressed={dark}
            aria-label="Toggle Dark/Light Mode"
            className="rounded-full p-2 transition-all duration-300 text-text hover:text-primary"
            style={{
                boxShadow: hovered
                    ? '0 0 8px rgba(var(--color-primary-rgb), 0.6)'
                    : 'none',
            }}
        >
            {dark ? (
                <Moon 
                    size={20} 
                    className="transition-all duration-300" 
                />
            ) : (
                <Sun 
                    size={20} 
                    className="transition-all duration-300" 
                />
            )}
        </button>
    );
};

export default ThemeToggle;
