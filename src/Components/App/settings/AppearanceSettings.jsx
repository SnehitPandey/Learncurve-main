import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAccentColorKey } from '../../../utils/themeUtils';

const AppearanceSettings = () => {
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const themes = [
    { id: 'light', name: 'Light', value: 'light' },
    { id: 'dark', name: 'Dark', value: 'dark' }
  ];

  const accentColors = [
    { id: 'teal', color: 'rgb(29, 211, 193)', rgb: '29, 211, 193', class: 'bg-teal-500' },
    { id: 'sky', color: 'rgb(14, 165, 233)', rgb: '14, 165, 233', class: 'bg-sky-500' },
    { id: 'indigo', color: 'rgb(99, 102, 241)', rgb: '99, 102, 241', class: 'bg-indigo-500' },
    { id: 'rose', color: 'rgb(244, 63, 94)', rgb: '244, 63, 94', class: 'bg-rose-500' }
  ];

  const [selectedColor, setSelectedColor] = useState(() => {
    const colorKey = getAccentColorKey();
    const saved = localStorage.getItem(colorKey);
    return saved || accentColors[0].id;
  });

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('theme', activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    // Apply accent color with user-specific key
    const color = accentColors.find(c => c.id === selectedColor);
    if (color) {
      document.documentElement.style.setProperty('--color-primary', color.color);
      document.documentElement.style.setProperty('--color-primary-rgb', color.rgb);
      const colorKey = getAccentColorKey();
      localStorage.setItem(colorKey, selectedColor);
    }
  }, [selectedColor]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Theme Section */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-2">Theme</h4>
        <p className="text-sm text-[var(--color-text)]/70 mb-6">
          Customize the look and feel of the application.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.value)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                activeTheme === theme.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <span className={`text-base font-medium ${
                activeTheme === theme.value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              }`}>
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Section */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-2">Accent Color</h4>
        <p className="text-sm text-[var(--color-text)]/70 mb-6">
          Choose a primary color for the interface.
        </p>
        <div className="flex space-x-3">
          {accentColors.map((color) => (
            <div
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={`w-10 h-10 rounded-full cursor-pointer ${color.class} ${
                selectedColor === color.id ? 'ring-2 ring-white' : ''
              }`}
              title={color.id}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AppearanceSettings;