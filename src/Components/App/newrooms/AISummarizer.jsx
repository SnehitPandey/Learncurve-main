// Components/room/AISummarizer.jsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Clock, Users, Target, CheckCircle } from "lucide-react";
import { Badge } from "../../elements/elements";

const AISummarizer = ({ formData, currentStep, totalSteps = 5, aiSummary }) => {
    const insights = useMemo(() => {
        const items = [];
        
        if (formData.goal?.trim()) {
            items.push({ 
                id: 'goal',
                icon: Target, 
                text: `Goal: ${formData.goal.slice(0, 30)}...`,
                value: formData.goal
            });
        }
        
        if (formData.dailyTime) {
            items.push({ 
                id: 'dailyTime',
                icon: Clock, 
                text: `${formData.dailyTime} daily`,
                value: formData.dailyTime
            });
        }
        
        if (formData.learningStyle) {
            items.push({ 
                id: 'learningStyle',
                icon: Users, 
                text: `${formData.learningStyle} learning`,
                value: formData.learningStyle
            });
        }
        
        return items;
    }, [formData.goal, formData.dailyTime, formData.learningStyle]);

    // Calculate completion percentage
    const completionScore = useMemo(() => {
        const requiredFields = ['goal', 'selectedTags', 'proficiency', 'dailyTime', 'timeframe', 'learningStyle', 'availability'];
        const completedFields = requiredFields.filter(field => {
            const value = formData[field];
            return Array.isArray(value) ? value.length > 0 : Boolean(value?.toString().trim());
        });
        return Math.round((completedFields.length / requiredFields.length) * 100);
    }, [formData]);

    // Progress calculation
    //
    // Uses the SAME formula as the wizard's own step bar —
    // `((currentStep - 1) / (totalSteps - 1)) * 100` — so the two can never
    // disagree. This panel used to compute `(currentStep / 5) * 100`, which read
    // 20% on step 1 and 100% on step 5 while the wizard above said 0% and 100%
    // for the same steps: two bars, two different numbers, no explanation.
    //
    // The bar is clamped to 0-100 because `totalSteps` of 1 would divide by zero.
    const stepProgress = totalSteps > 1
        ? ((currentStep - 1) / (totalSteps - 1)) * 100
        : 100;
    const progressPercentage = Math.max(0, Math.min(100, stepProgress));

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
                    <span className="text-text/60">Step</span>
                    <span className="text-text">{currentStep} of {totalSteps}</span>
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
                    {completionScore}% of the form filled in
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

                {/* AI Summary Display */}
                {aiSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-medium text-primary">AI Analysis Ready</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-text/80 text-sm mb-2">{aiSummary.estimatedGain}</p>
                        {aiSummary.budget && (
                            <div className="mb-2 text-xs font-medium text-primary">
                                ≈ {aiSummary.budget.studyDayDates?.length || 0} study days, ~{Math.round((aiSummary.budget.totalMinutes || 0) / 60)} h, {aiSummary.budget.moduleCount || 0} modules
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-text/60">
                            <span>Room: {aiSummary.suggestedRoomSize}</span>
                            <span>{aiSummary.studyIntensity}</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AISummarizer;
