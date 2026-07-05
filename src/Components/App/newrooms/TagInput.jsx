import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TagInput Component
 * Allows users to add/remove tags for topics they want to learn
 */
const TagInput = ({ tags = [], onChange, maxTags = 10, placeholder = "Add topics (e.g., React, Python)" }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      return;
    }

    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    if (tags.some(tag => tag.toLowerCase() === trimmedValue.toLowerCase())) {
      setError('Tag already added');
      return;
    }

    if (trimmedValue.length > 30) {
      setError('Tag is too long (max 30 characters)');
      return;
    }

    onChange([...tags, trimmedValue]);
    setInputValue('');
    setError('');
  };

  const handleRemoveTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const suggestedTags = [
    'React', 'JavaScript', 'Python', 'TypeScript', 'Node.js',
    'Machine Learning', 'Data Science', 'Web Development', 'Mobile Development',
    'DevOps', 'UI/UX Design', 'Algorithms', 'System Design'
  ];

  const availableSuggestions = suggestedTags.filter(
    suggested => !tags.some(tag => tag.toLowerCase() === suggested.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Input Area */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={30}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900
                     transition-all duration-200 outline-none"
          />
          {inputValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {inputValue.length}/30
            </div>
          )}
        </div>
        <button
          onClick={handleAddTag}
          disabled={!inputValue.trim() || tags.length >= maxTags}
          className="px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 
                   text-white font-medium transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-sm flex items-center gap-2"
          >
            <span>⚠️</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {tags.map((tag, index) => (
              <motion.div
                key={`${tag}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group flex items-center gap-2 px-3 py-2 rounded-full 
                         bg-gradient-to-r from-purple-500 to-pink-500
                         text-white text-sm font-medium shadow-md
                         hover:shadow-lg transition-all duration-200"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tag Counter */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {tags.length}/{maxTags} tags added
        {tags.length === 0 && ' (Add at least 1 tag to generate roadmap)'}
      </div>

      {/* Suggested Tags */}
      {tags.length < maxTags && availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Suggested topics:
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  if (tags.length < maxTags) {
                    onChange([...tags, suggestion]);
                  }
                }}
                className="px-3 py-1.5 rounded-full border-2 border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         text-sm font-medium hover:border-purple-500 hover:text-purple-600
                         dark:hover:border-purple-400 dark:hover:text-purple-400
                         transition-all duration-200"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagInput;
