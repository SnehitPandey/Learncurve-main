import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "theme";

const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    // localStorage is the single persisted source of truth — the Settings page
    // (Pages/App/settings.jsx) reads and writes the same key. Writing the
    // attribute without persisting it made the two sources desync, so the theme
    // reset or flipped unpredictably.
    localStorage.setItem(THEME_KEY, theme);
};

const ThemeToggle = () => {
    const [dark, setDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(THEME_KEY);
        const attr = document.documentElement.getAttribute("data-theme");

        if (stored === "dark" || stored === "light") {
            document.documentElement.setAttribute("data-theme", stored);
            setDark(stored === "dark");
        } else if (attr === "dark" || attr === "light") {
            localStorage.setItem(THEME_KEY, attr);
            setDark(attr === "dark");
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const theme = prefersDark ? "dark" : "light";
            applyTheme(theme);
            setDark(theme === "dark");
        }

        setMounted(true);
    }, []);

    // Pick up theme changes made elsewhere (e.g. the Settings page).
    useEffect(() => {
        const sync = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, []);

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(newTheme);
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
            id="theme-toggle-btn"
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
