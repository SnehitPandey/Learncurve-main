import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Users, Sparkles, ChevronDown } from "lucide-react";
import { Button, Badge } from "../../elements/elements";

const PRESET_OPTIONS = [
    { value: "2weeks", label: "2 Weeks", days: 14 },
    { value: "3weeks", label: "3 Weeks", days: 21 },
    { value: "1month", label: "1 Month", days: 30 },
    { value: "6weeks", label: "6 Weeks", days: 42 },
    { value: "2months", label: "2 Months", days: 60 },
    { value: "3months", label: "3 Months", days: 90 },
    { value: "4months", label: "4 Months", days: 120 },
    { value: "5months", label: "5 Months", days: 150 },
    { value: "6months", label: "6 Months", days: 180 }
];

const DEFAULT_TIMEFRAME = "1month";

// Custom Timeline Modal Component
const CustomTimelineModal = ({ isOpen, onClose, onSelect, currentValue }) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState(currentValue || DEFAULT_TIMEFRAME);
    const [customDays, setCustomDays] = useState(30);
    const [customMonths, setCustomMonths] = useState(1);
    const [useCustom, setUseCustom] = useState(false);

    const presetOptions = PRESET_OPTIONS;

    // Re-sync from the parent each time the modal opens. Without this the state
    // kept whatever was chosen the first time, and a stored "custom-<days>"
    // value made `presetOptions.find(...)` return undefined below.
    useEffect(() => {
        if (!isOpen) return;
        const value = currentValue || DEFAULT_TIMEFRAME;
        const preset = PRESET_OPTIONS.find(opt => opt.value === value);
        if (preset) {
            setSelectedTimeframe(preset.value);
            setUseCustom(false);
        } else if (value.startsWith("custom-")) {
            const totalDays = parseInt(value.slice("custom-".length), 10);
            setSelectedTimeframe(value);
            setUseCustom(true);
            if (Number.isFinite(totalDays) && totalDays > 0) {
                setCustomMonths(Math.floor(totalDays / 30));
                setCustomDays(totalDays % 30);
            }
        } else {
            setSelectedTimeframe(DEFAULT_TIMEFRAME);
            setUseCustom(false);
        }
    }, [isOpen, currentValue]);

    const handleSelect = () => {
        if (useCustom) {
            const totalDays = customMonths * 30 + customDays;
            const customLabel = customMonths > 0 
                ? `${customMonths}mo ${customDays > 0 ? `${customDays}d` : ''}`.trim()
                : `${customDays} days`;
            onSelect(`custom-${totalDays}`, customLabel);
        } else {
            const selected = presetOptions.find(opt => opt.value === selectedTimeframe);
            if (!selected) {
                // Unknown value (e.g. a hand-edited "custom-…") — fall back to the
                // default preset rather than throwing on `selected.value`.
                const fallback = presetOptions.find(opt => opt.value === DEFAULT_TIMEFRAME) || presetOptions[0];
                onSelect(fallback.value, fallback.label);
            } else {
                onSelect(selected.value, selected.label);
            }
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-background rounded-2xl max-w-md w-full p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-text">Select Timeline</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-text/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-text/60" />
                        </button>
                    </div>

                    {/* Toggle between preset and custom */}
                    <div className="flex mb-4">
                        <button
                            onClick={() => setUseCustom(false)}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
                                !useCustom 
                                    ? 'bg-primary text-white' 
                                    : 'bg-text/10 text-text hover:bg-text/20'
                            }`}
                        >
                            Preset Options
                        </button>
                        <button
                            onClick={() => setUseCustom(true)}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
                                useCustom 
                                    ? 'bg-primary text-white' 
                                    : 'bg-text/10 text-text hover:bg-text/20'
                            }`}
                        >
                            Custom
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        {!useCustom ? (
                            /* Preset Options */
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                {presetOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedTimeframe(option.value)}
                                        className={`p-3 text-left rounded-lg border transition-all ${
                                            selectedTimeframe === option.value
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                                        }`}
                                    >
                                        <div className="font-medium text-sm">{option.label}</div>
                                        <div className="text-xs text-text/60">{option.days} days</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            /* Custom Timeline Input */
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Custom Timeline (15 days - 6 months)
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-text/60 mb-1">Months</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="6"
                                                value={customMonths}
                                                onChange={(e) => {
                                                    const months = Math.max(0, Math.min(6, parseInt(e.target.value) || 0));
                                                    setCustomMonths(months);
                                                }}
                                                className="w-full px-3 py-2 bg-background border border-text/20 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text/60 mb-1">Days</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="30"
                                                value={customDays}
                                                onChange={(e) => {
                                                    const days = Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                                                    setCustomDays(days);
                                                }}
                                                className="w-full px-3 py-2 bg-background border border-text/20 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-text/60">
                                        Total: {customMonths * 30 + customDays} days
                                        {(customMonths * 30 + customDays < 15) && (
                                            <span className="text-red-500 ml-2">Minimum 15 days required</span>
                                        )}
                                        {(customMonths * 30 + customDays > 180) && (
                                            <span className="text-red-500 ml-2">Maximum 6 months allowed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 px-4 text-sm font-medium text-text bg-text/10 hover:bg-text/20 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSelect}
                            disabled={useCustom && (customMonths * 30 + customDays < 15 || customMonths * 30 + customDays > 180)}
                            className="flex-1 py-2 px-4 text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:bg-text/20 disabled:text-text/50 rounded-lg transition-colors"
                        >
                            Select
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const RoomSteps = ({ currentStep, formData, updateFormData, aiSummary, onProceedToPreview, aiError, onRetryAi, onUseTemplate }) => {
    const [newTag, setNewTag] = useState("");
    const [showCustomTimelineModal, setShowCustomTimelineModal] = useState(false);

    const suggestedTags = [
        "React", "JavaScript", "Python", "UX Design", "Data Science", 
        "Machine Learning", "Web Development", "Mobile Development", 
        "DevOps", "Cybersecurity", "Digital Marketing", "Product Management"
    ];

    const addTag = (tag) => {
        if (!formData.selectedTags.includes(tag) && formData.selectedTags.length < 10) {
            updateFormData("selectedTags", [...formData.selectedTags, tag]);
        }
    };

    const removeTag = (tag) => {
        updateFormData("selectedTags", formData.selectedTags.filter(t => t !== tag));
    };

    const addCustomTag = () => {
        if (newTag.trim() && 
            !formData.selectedTags.includes(newTag.trim()) && 
            formData.selectedTags.length < 10 &&
            newTag.trim().length <= 50) {
            updateFormData("selectedTags", [...formData.selectedTags, newTag.trim()]);
            setNewTag("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomTag();
        }
    };

    // Step 1: Set a Goal
    if (currentStep === 1) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text mb-2">What do you want to learn?</h2>
                    <p className="text-text/60 text-sm md:text-base">Tell us your learning goal and select relevant tags</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">
                            Learning Goal <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.goal}
                            onChange={(e) => updateFormData("goal", e.target.value)}
                            placeholder="e.g., Master React and build modern web applications"
                            className="w-full px-4 py-3 bg-background border border-text/20 rounded-xl text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none"
                            rows={3}
                            maxLength={200}
                        />
                        <div className="text-xs text-text/50 mt-1">
                            {formData.goal.length}/200 characters
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">
                            Selected Tags ({formData.selectedTags.length}/10)
                        </label>
                        
                        {formData.selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-text/5 rounded-lg">
                                {formData.selectedTags.map(tag => (
                                    <Badge 
                                        key={tag}
                                        variant="secondary" 
                                        className="bg-primary/10 text-primary flex items-center gap-1 px-3 py-1"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 hover:text-primary/70 transition-colors"
                                            type="button"
                                            aria-label={`Remove ${tag} tag`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        
                        {formData.selectedTags.length < 10 && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add custom tag..."
                                    className="flex-1 px-3 py-2 bg-background border border-text/20 rounded-lg text-sm text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    onKeyPress={handleKeyPress}
                                    maxLength={50}
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={addCustomTag}
                                    disabled={!newTag.trim()}
                                    type="button"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <div>
                            <p className="text-sm text-text/60 mb-2">Suggested tags:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedTags
                                    .filter(tag => !formData.selectedTags.includes(tag))
                                    .map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => addTag(tag)}
                                        disabled={formData.selectedTags.length >= 10}
                                        className="px-3 py-1 text-sm bg-alt/20 hover:bg-primary/10 text-text hover:text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="button"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-text/10 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    What should you be able to do at the end? <span className="text-text/40 text-xs font-normal">(Optional)</span>
                                </label>
                                <select
                                    value={formData.goalType || ""}
                                    onChange={(e) => updateFormData("goalType", e.target.value)}
                                    className="w-full px-4 py-2.5 bg-background border border-text/20 rounded-xl text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Select target goal type...</option>
                                    <option value="job_interview">Job Interview Preparation</option>
                                    <option value="project">Build a Real Project</option>
                                    <option value="exam_cert">Exam or Certification</option>
                                    <option value="career_switch">Career Switch</option>
                                    <option value="hobby">Hobby / Personal Interest</option>
                                </select>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={formData.outcome || ""}
                                    onChange={(e) => updateFormData("outcome", e.target.value)}
                                    placeholder="Target outcome (e.g., Build and ship a full-stack SaaS app)"
                                    className="w-full px-4 py-2.5 bg-background border border-text/20 rounded-xl text-sm text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    maxLength={200}
                                />
                                <div className="text-xs text-text/50 mt-1">
                                    {(formData.outcome || "").length}/200 characters
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Select Proficiency
    if (currentStep === 2) {
        const proficiencyOptions = [
            { 
                value: "beginner", 
                label: "Beginner", 
                description: "New to this topic",
                icon: "🌱"
            },
            { 
                value: "intermediate", 
                label: "Intermediate", 
                description: "Some experience, want to level up",
                icon: "🌿"
            },
            { 
                value: "advanced", 
                label: "Advanced", 
                description: "Looking to master advanced concepts",
                icon: "🌳"
            }
        ];

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text mb-2">Select Your Proficiency Level</h2>
                    <p className="text-text/60 text-sm md:text-base">This helps us tailor the learning experience</p>
                </div>

                <div className="space-y-3">
                    {proficiencyOptions.map(option => (
                        <motion.div
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateFormData("proficiency", option.value)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                formData.proficiency === option.value
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    formData.proficiency === option.value
                                        ? 'border-primary bg-primary'
                                        : 'border-text/40'
                                }`}>
                                    {formData.proficiency === option.value && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                </div>
                                <span className="text-xl">{option.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-text">{option.label}</h3>
                                    <p className="text-sm text-text/60">{option.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="pt-4 border-t border-text/10">
                    <label className="block text-sm font-medium text-text mb-2">
                        What do you already know about this? <span className="text-text/40 text-xs font-normal">(Optional)</span>
                    </label>
                    <textarea
                        value={formData.priorKnowledge || ""}
                        onChange={(e) => updateFormData("priorKnowledge", e.target.value)}
                        placeholder="Tell us any prior experience or prerequisites you already have (e.g., I know basic JavaScript and Git, but no React)."
                        className="w-full px-4 py-3 bg-background border border-text/20 rounded-xl text-text placeholder-text/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        rows={3}
                        maxLength={400}
                    />
                    <div className="text-xs text-text/50 mt-1">
                        {(formData.priorKnowledge || "").length}/400 characters
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Time Commitment - Updated with Custom Timeline
    if (currentStep === 3) {
        const dailyTimeOptions = [
            { value: "30min", label: "30 minutes", description: "Quick daily sessions" },
            { value: "1hr", label: "1 hour", description: "Standard commitment" },
            { value: "2hrs", label: "2 hours", description: "Intensive learning" },
            { value: "3hrs+", label: "3+ hours", description: "Maximum dedication" }
        ];

        const timeframeOptions = [
            { value: "2weeks", label: "2 Weeks", description: "Quick sprint" },
            { value: "1month", label: "1 Month", description: "Balanced pace" },
            { value: "2months", label: "2 Months", description: "Thorough approach" },
            { value: "3months", label: "3 Months", description: "Deep mastery" }
        ];

        const handleCustomTimelineSelect = (value, label) => {
            updateFormData("timeframe", value);
            updateFormData("timeframeLabel", label); // Store display label separately
        };

        const getTimeframeDisplayLabel = () => {
            if (formData.timeframe?.startsWith('custom-')) {
                return formData.timeframeLabel || 'Custom Timeline';
            }
            const option = timeframeOptions.find(opt => opt.value === formData.timeframe);
            return option?.label || formData.timeframe;
        };

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text mb-2">Set Your Time Commitment</h2>
                    <p className="text-text/60 text-sm md:text-base">How much time can you dedicate?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text mb-3">
                            Daily Time <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {dailyTimeOptions.map(time => (
                                <div
                                    key={time.value}
                                    onClick={() => updateFormData("dailyTime", time.value)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        formData.dailyTime === time.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <div>
                                                <span className="text-text font-medium">{time.label}</span>
                                                <p className="text-xs text-text/60">{time.description}</p>
                                            </div>
                                        </div>
                                        {formData.dailyTime === time.value && (
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-3">
                            Timeline <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {timeframeOptions.map(option => (
                                <div
                                    key={option.value}
                                    onClick={() => updateFormData("timeframe", option.value)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        formData.timeframe === option.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-text font-medium">{option.label}</span>
                                            <p className="text-xs text-text/60">{option.description}</p>
                                        </div>
                                        {formData.timeframe === option.value && (
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Custom Timeline Button */}
                            <button
                                onClick={() => setShowCustomTimelineModal(true)}
                                className={`w-full p-3 border rounded-lg cursor-pointer transition-all text-left ${
                                    formData.timeframe?.startsWith('custom-')
                                        ? 'border-primary bg-primary/5'
                                        : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-text font-medium">
                                            {formData.timeframe?.startsWith('custom-') 
                                                ? getTimeframeDisplayLabel()
                                                : 'Custom Timeline'
                                            }
                                        </span>
                                        <p className="text-xs text-text/60">15 days - 6 months</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {formData.timeframe?.startsWith('custom-') && (
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                        )}
                                        <ChevronDown className="w-4 h-4 text-text/60" />
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Custom Timeline Modal */}
                <CustomTimelineModal
                    isOpen={showCustomTimelineModal}
                    onClose={() => setShowCustomTimelineModal(false)}
                    onSelect={handleCustomTimelineSelect}
                    currentValue={formData.timeframe}
                />
            </div>
        );
    }

    // Step 4: Preferences
    if (currentStep === 4) {
        const learningStyles = [
            { value: "solo", label: "Solo Learning", icon: "🧑‍💻", description: "Study independently (1 member)" },
            { value: "pair", label: "Pair Learning", icon: "👥", description: "Work with a partner (2 members)" },
            { value: "group", label: "Group Learning", icon: "👨‍👩‍👧‍👦", description: "Learn in a team (5 members)" }
        ];

        const availabilityOptions = [
            { value: "weekdays", label: "Weekdays", description: "Mon-Fri" },
            { value: "weekends", label: "Weekends", description: "Sat-Sun" },
            { value: "anytime", label: "Anytime", description: "Flexible schedule" }
        ];

        const timezones = [
            { value: "IST", label: "IST (India Standard Time)" },
            { value: "EST", label: "EST (Eastern Standard Time)" },
            { value: "PST", label: "PST (Pacific Standard Time)" },
            { value: "GMT", label: "GMT (Greenwich Mean Time)" },
            { value: "CET", label: "CET (Central European Time)" },
            { value: "JST", label: "JST (Japan Standard Time)" },
            { value: "AEST", label: "AEST (Australian Eastern Time)" }
        ];

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text mb-2">Learning Preferences</h2>
                    <p className="text-text/60 text-sm md:text-base">How do you prefer to learn?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text mb-3">
                            Learning Style <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {learningStyles.map(style => (
                                <div
                                    key={style.value}
                                    onClick={() => updateFormData("learningStyle", style.value)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        formData.learningStyle === style.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-lg">{style.icon}</span>
                                            <div>
                                                <span className="text-text font-medium">{style.label}</span>
                                                <p className="text-xs text-text/60">{style.description}</p>
                                            </div>
                                        </div>
                                        {formData.learningStyle === style.value && (
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-3">
                                Availability <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                {availabilityOptions.map(availability => (
                                    <div
                                        key={availability.value}
                                        onClick={() => updateFormData("availability", availability.value)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                            formData.availability === availability.value
                                                ? 'border-primary bg-primary/5'
                                                : 'border-text/20 hover:border-text/40 hover:bg-text/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-text font-medium">{availability.label}</span>
                                                <p className="text-xs text-text/60">{availability.description}</p>
                                            </div>
                                            {formData.availability === availability.value && (
                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Timezone <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.timezone}
                                onChange={(e) => updateFormData("timezone", e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-text/20 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
                            >
                                {timezones.map(tz => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 5: AI Summary
    if (currentStep === 5 && aiSummary) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        AI-Generated Summary
                    </h2>
                    <p className="text-text/60 text-sm md:text-base">Based on your answers, here's what you could achieve</p>
                </div>

                {aiError && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
                        <span>{aiError}</span>
                        {onRetryAi && (
                            <button onClick={onRetryAi} className="font-semibold underline ml-2 hover:opacity-80">
                                Retry AI
                            </button>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    {aiSummary.estimatedGain ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                        >
                            <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                                <span className="text-primary">🎯</span>
                                Estimated Proficiency Gain
                            </h3>
                            <p className="text-text/80">{aiSummary.estimatedGain}</p>
                        </motion.div>
                    ) : null}

                    {Array.isArray(aiSummary.roadmapPreview) && aiSummary.roadmapPreview.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-alt/10 border border-text/10 rounded-xl p-4"
                        >
                            <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                                <span className="text-primary">🗺️</span>
                                Sample Roadmap Preview
                            </h3>
                            <div className="space-y-2">
                                {aiSummary.roadmapPreview.map((item, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-text/80 text-sm">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {(aiSummary.suggestedRoomSize || aiSummary.studyIntensity) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {aiSummary.suggestedRoomSize && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
                                >
                                    <h4 className="font-medium text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Room Size
                                    </h4>
                                    <p className="text-green-700 dark:text-green-400 text-sm">{aiSummary.suggestedRoomSize}</p>
                                </motion.div>
                            )}
                            
                            {aiSummary.studyIntensity && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
                                >
                                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Study Intensity
                                    </h4>
                                    <p className="text-blue-700 dark:text-blue-400 text-sm">{aiSummary.studyIntensity}</p>
                                </motion.div>
                            )}
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Button 
                            variant="primary" 
                            onClick={onProceedToPreview}
                            className="w-full mt-6 py-3 text-base font-medium"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Create "{aiSummary.roomName}" Room
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (currentStep === 5 && !aiSummary) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-text mb-2">Generating AI Summary...</h2>
                    <p className="text-text/60 mb-6">Analyzing your preferences and tailoring your curriculum</p>
                    {onUseTemplate && (
                        <div className="mt-4 pt-4 border-t border-text/10 max-w-sm mx-auto">
                            <p className="text-xs text-text/50 mb-3">Taking longer than usual?</p>
                            <Button
                                variant="outline"
                                onClick={onUseTemplate}
                                className="text-xs px-4 py-2"
                            >
                                Continue with Standard Curriculum
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default RoomSteps;
