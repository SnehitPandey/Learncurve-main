// Components/room/AISummarizer.jsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Clock, Users, Target, CheckCircle } from "lucide-react";
import { Badge } from "../../elements/elements";

const AISummarizer = ({ formData, currentStep, aiSummary }) => {
    const insights = useMemo(() => {
        const items = [];
        
        // Only show if actually filled (not empty string or default value)
        if (formData.goal?.trim()) {
            items.push({ 
                id: 'goal',
                icon: Target, 
                text: `Goal: ${formData.goal.length > 30 ? formData.goal.slice(0, 30) + '...' : formData.goal}`,
                value: formData.goal
            });
        }
        
        // Only show if user has selected a proficiency (not empty)
        if (formData.proficiency && formData.proficiency !== '') {
            items.push({
                id: 'proficiency',
                icon: Brain,
                text: `${formData.proficiency} level`,
                value: formData.proficiency
            });
        }
        
        // Only show if user has selected daily time (not empty)
        if (formData.dailyTime && formData.dailyTime !== '') {
            items.push({ 
                id: 'dailyTime',
                icon: Clock, 
                text: `${formData.dailyTime} daily`,
                value: formData.dailyTime
            });
        }
        
        // Only show if user has selected timeframe (not empty)
        if (formData.timeframe && formData.timeframe !== '') {
            const timeframeLabel = formData.timeframeLabel || formData.timeframe;
            items.push({
                id: 'timeframe',
                icon: Clock,
                text: `Timeline: ${timeframeLabel}`,
                value: formData.timeframe
            });
        }
        
        // Only show if user has selected learning style (not empty)
        if (formData.learningStyle && formData.learningStyle !== '') {
            items.push({ 
                id: 'learningStyle',
                icon: Users, 
                text: `${formData.learningStyle} learning`,
                value: formData.learningStyle
            });
        }
        
        // Only show if user has selected availability (not empty)
        if (formData.availability && formData.availability !== '') {
            items.push({
                id: 'availability',
                icon: Clock,
                text: `Available: ${formData.availability}`,
                value: formData.availability
            });
        }
        
        return items;
    }, [formData.goal, formData.proficiency, formData.dailyTime, formData.timeframe, formData.timeframeLabel, formData.learningStyle, formData.availability]);

    // Calculate completion percentage - OVERALL progress through ALL steps
    const completionScore = useMemo(() => {
        // Define ALL required fields across all steps
        const allRequiredFields = [
            'goal',           // Step 1
            'selectedTags',   // Step 1
            'proficiency',    // Step 2
            'dailyTime',      // Step 3
            'timeframe',      // Step 3
            'learningStyle',  // Step 4
            'availability'    // Step 4
        ];
        
        // Count how many are actually filled
        const completedFields = allRequiredFields.filter(field => {
            const value = formData[field];
            if (field === 'selectedTags') {
                return Array.isArray(value) && value.length > 0;
            }
            return value && value.toString().trim() !== '';
        });
        
        // Calculate percentage based on ALL fields, not just current step
        return Math.round((completedFields.length / allRequiredFields.length) * 100);
    }, [formData.goal, formData.selectedTags, formData.proficiency, formData.dailyTime, 
        formData.timeframe, formData.learningStyle, formData.availability]);

    // Progress calculation
    const progressPercentage = (currentStep / 5) * 100;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text">AI Summarizer</h3>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-text/60">Progress</span>
                    <span className="text-text">{currentStep}/5</span>
                </div>
                <div className="w-full bg-text/10 rounded-full h-2">
                    <motion.div 
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
                <span className="text-xs text-text/50 mt-1 block">
                    {completionScore}% complete
                </span>
            </div>

            {/* Insights Section */}
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-text">Live Insights</h4>
                </div>

                <AnimatePresence mode="wait">
                    {insights.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                        >
                            <Brain className="w-12 h-12 text-text/20 mx-auto mb-3" />
                            <p className="text-text/50 text-sm">
                                Start filling out the form to see AI insights
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-2">
                            {insights.map((insight, index) => (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-text/5 rounded-lg"
                                >
                                    <insight.icon className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="text-text text-sm">{insight.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* Skills Tags */}
                {formData.selectedTags?.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-text/10 pt-4"
                    >
                        <p className="text-sm font-medium text-text mb-2">Selected Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                            {formData.selectedTags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                            {formData.selectedTags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                    +{formData.selectedTags.length - 4} more
                                </Badge>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* AI Analysis Ready Indicator */}
                {aiSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-medium text-primary">AI Analysis Complete</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-text/70 text-sm">
                            Your learning plan has been analyzed. Review the detailed feedback in the main section.
                        </p>
                        {/* Room Details */}
                        <div className="flex items-center gap-4 text-xs text-text/60 mt-3 pt-3 border-t border-text/10">
                            <span>Room: {aiSummary.suggestedRoomSize}</span>
                            <span>•</span>
                            <span>{aiSummary.studyIntensity}</span>
                        </div>
                    </motion.div>
                )}


            </div>
        </div>
    );
};

export default AISummarizer;
