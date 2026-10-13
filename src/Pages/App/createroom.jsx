// Components/room/CreateRoom.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
    ArrowRight, ArrowLeft, Target, Clock, Users, CheckCircle, Brain, Sparkles, Eye, Search } from "lucide-react";

import RoomSteps from "../../Components/App/newrooms/roomSteps";
import AISummarizer from "../../Components/App/newrooms/AISummarizer";
import CreatedRoom from "../../Components/App/newrooms/createdRoom";
import RoomPreview from "../../Components/App/newrooms/roomPreview";
import { Card, Button, Badge, Avatar, ProgressBar } from "../../Components/elements/elements";
import { fetchRoomSummary } from "../../api/ai";
import { createRoom as createRoomApi, listRooms } from "../../api/rooms";

const CreateRoom = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState({
        goal: "",
        selectedTags: [],
        proficiency: "beginner",
        dailyTime: "1hr",
        timeframe: "1month",
        learningStyle: "solo",
        availability: "weekdays",
        timezone: "IST",
        goalType: "",
        priorKnowledge: "",
        outcome: ""
    });

    const [aiSummary, setAiSummary] = useState(null);
    const [aiError, setAiError] = useState("");
    const [similarRooms, setSimilarRooms] = useState([]);
    const [creatingRoom, setCreatingRoom] = useState(false);
    const [createError, setCreateError] = useState("");
    const cancelledRef = useRef(false);

    // Mounted guard: this page unmounts whenever the user navigates away, and
    // several async helpers used to setState afterwards.
    useEffect(() => {
        cancelledRef.current = false;
        return () => { cancelledRef.current = true; };
    }, []);

    const steps = [
        { id: 1, title: "Set a Goal", icon: Target },
        { id: 2, title: "Select Proficiency", icon: Brain },
        { id: 3, title: "Time Commitment", icon: Clock },
        { id: 4, title: "Preferences", icon: Users },
        { id: 5, title: "AI Summary", icon: Sparkles }
    ];

    const generateSimilarRooms = async () => {
        if (cancelledRef.current) return;
        try {
            const query = formData.selectedTags?.[0] || formData.goal;
            const res = await listRooms({ query, limit: 3 });
            if (cancelledRef.current) return;
            if (res && Array.isArray(res.rooms) && res.rooms.length > 0) {
                const formatted = res.rooms.map(r => ({
                    id: r.id,
                    name: r.name || "Untitled Room",
                    skill: r.skill || "General",
                    pace: r.pace || "Moderate",
                    members: r.memberCount ?? 0,
                    maxMembers: r.maxMembers ?? 0,
                    startDate: null,
                    timeframe: r.timeframe || "Not set",
                    description: r.description || "",
                    tags: Array.isArray(r.tags) ? r.tags : [r.skill].filter(Boolean),
                    schedule: r.schedule || "",
                    progress: 0,
                    difficulty: r.difficulty || "Not set",
                    avatar: ((r.skill || r.name || "RM")).slice(0, 2).toUpperCase(),
                    creator: null,
                    isActive: true,
                    learningGoals: [],
                    prerequisites: [],
                    memberProfiles: []
                }));
                setSimilarRooms(formatted);
                return;
            }
            // No backend matches — show empty rather than fake rooms
            setSimilarRooms([]);
        } catch (err) {
            console.warn("Could not load backend rooms for similarity check:", err);
            setSimilarRooms([]);
        }
    };

    const updateFormData = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const buildFallbackSummary = (data) => {
        const goal = (data?.goal || "Web Development").trim();
        const style = data?.learningStyle || "group";
        const roomSize = style === "solo" ? "Solo (1 learner)" : style === "pair" ? "Duo (2 learners)" : "Small Group (3-5 learners)";
        const intensity = data?.dailyTime ? `${data.dailyTime}/day` : "Moderate (6 hrs/week)";
        const schedule = data?.availability === "weekdays" 
            ? "Weekdays (Mon-Fri) at 8 PM"
            : data?.availability === "weekends"
            ? "Weekends (Sat-Sun) at 10 AM"
            : "Daily sessions at 8 PM";

        const roadmapPreview = [
            `Foundations & Core Principles of ${goal}`,
            `Practical Applications & Core Techniques in ${goal}`,
            `Advanced Concepts, Tooling & Architecture`,
            `Applied Capstone Project & Portfolio Synthesis`
        ];

        const subtopics = [
            [`Introduction & Mental Models for ${goal}`, `Core Fundamentals and Environment Setup`, `Hands-on Beginner Exercises`],
            [`Component Architecture and Patterns`, `Practical Workflow and Essential Libraries`, `Intermediate Mini-Project Sprint`],
            [`Advanced Techniques and Edge Cases`, `Performance Optimization & Debugging`, `Real-World Application Design`],
            [`Capstone Project Architecture`, `Implementation and Testing Verification`, `Project Polish, Presentation & Wrap-up`]
        ];

        return {
            roomName: `${goal} Mastery Group`,
            estimatedGain: "+35% Skill Boost",
            suggestedRoomSize: roomSize,
            studyIntensity: intensity,
            schedule,
            roadmapPreview,
            subtopics,
            modules: [],
            budget: null,
            generatedBy: "template"
        };
    };

    const skipOrUseTemplate = () => {
        const fallback = buildFallbackSummary(formData);
        setAiSummary(fallback);
        setAiError("");
        generateSimilarRooms();
    };

    const generateAISummary = async () => {
        if (cancelledRef.current) return;
        setAiError("");
        try {
            const payload = {
                goal: formData.goal || "Web Development",
                tags: formData.selectedTags?.length ? formData.selectedTags : [formData.goal || "Web Development"],
                proficiency: formData.proficiency,
                dailyTime: formData.dailyTime,
                timeframe: formData.timeframe,
                learningStyle: formData.learningStyle,
                availability: formData.availability,
                timezone: formData.timezone,
                goalType: formData.goalType || undefined,
                priorKnowledge: formData.priorKnowledge || undefined,
                outcome: formData.outcome || undefined
            };

            // Bounded 10s timeout so user is never stuck in constant loading
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("AI generation timed out")), 10000)
            );

            const res = await Promise.race([
                fetchRoomSummary(payload),
                timeoutPromise
            ]);

            if (cancelledRef.current) return;
            const data = res?.data || res;
            if (data && (data.estimatedGain || data.roomName || Array.isArray(data.roadmapPreview))) {
                const fallback = buildFallbackSummary(formData);
                setAiSummary({
                    estimatedGain: data.estimatedGain || fallback.estimatedGain,
                    roadmapPreview: Array.isArray(data.roadmapPreview) && data.roadmapPreview.length > 0
                        ? data.roadmapPreview
                        : fallback.roadmapPreview,
                    suggestedRoomSize: data.suggestedRoomSize || fallback.suggestedRoomSize,
                    studyIntensity: data.studyIntensity || fallback.studyIntensity,
                    roomName: data.roomName || fallback.roomName,
                    schedule: data.schedule || fallback.schedule,
                    budget: data.budget || null,
                    subtopics: Array.isArray(data.subtopics) && data.subtopics.length > 0
                        ? data.subtopics
                        : fallback.subtopics,
                    modules: Array.isArray(data.modules) ? data.modules : [],
                    generatedBy: data.generatedBy || "ai"
                });
                generateSimilarRooms();
                return;
            }
        } catch (err) {
            console.warn("AI summary API unavailable or timed out:", err);
        }

        if (cancelledRef.current) return;
        // Fall back to structured topic-aware curriculum based on user's goal
        const fallback = buildFallbackSummary(formData);
        setAiSummary(fallback);
        setAiError("AI took longer than expected — loaded standard curriculum for your goal.");
        generateSimilarRooms();
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
            if (currentStep === 4) {
                generateAISummary();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const proceedToPreview = () => {
        setShowPreview(true);
    };

    const createRoom = async () => {
        setCreatingRoom(true);
        setCreateError("");
        try {
            const maxMembers = (() => {
                switch (formData.learningStyle) {
                    case "solo": return 1;
                    case "pair": return 2;
                    case "group": return 5;
                    default: return 8;
                }
            })();

            const payload = {
                name: aiSummary?.roomName || `${formData.goal || "New"} Mastery Group`,
                skill: formData.selectedTags?.[0] || formData.goal || "Web Development",
                category: formData.selectedTags?.[0] || formData.goal || "Web Development",
                description: aiSummary?.estimatedGain || formData.goal || "Collaborative study room",
                tags: formData.selectedTags?.length ? formData.selectedTags : [formData.goal || "Study"],
                pace: aiSummary?.studyIntensity || "Moderate",
                difficulty: formData.proficiency ? (formData.proficiency.charAt(0).toUpperCase() + formData.proficiency.slice(1)) : "Beginner",
                timeframe: formData.timeframe || "1month",
                dailyTime: formData.dailyTime || "",
                learningStyle: formData.learningStyle || "solo",
                maxMembers,
                availability: formData.availability || "anytime",
                schedule: aiSummary?.schedule || "",
                goalType: formData.goalType || undefined,
                priorKnowledge: formData.priorKnowledge || undefined,
                outcome: formData.outcome || undefined,
                modules: Array.isArray(aiSummary?.modules) && aiSummary.modules.length > 0 ? aiSummary.modules : undefined
            };
            const res = await createRoomApi(payload);
            const createdId = res?.room?.id || res?.data?.id || res?.id;
            if (!createdId) {
                // Never navigate to a fabricated id — it would 404 while the
                // failure looked like success.
                setCreateError("The room was created but the server returned no id. Check the rooms list.");
                setCreatingRoom(false);
                return;
            }
            navigate(`/room/${createdId}`);
        } catch (err) {
            console.error("Failed to create room via backend:", err);
            setCreateError(err?.message || "Could not create the room. Please try again.");
        } finally {
            setCreatingRoom(false);
        }
    };

    const handlePreviewSimilarRoom = (room) => {
        setSelectedRoom(room);
        setPreviewOpen(true);
    };

    const handleJoinSimilarRoom = (room) => {
        console.log("Joining similar room:", room.id);
        navigate(`/room/${room.id}`);
        setPreviewOpen(false);
    };

    const closeSimilarRoomPreview = () => {
        setSelectedRoom(null);
        setPreviewOpen(false);
    };

    // Validation function to check if current step can proceed
    const canProceedToNext = () => {
        switch (currentStep) {
            case 1:
                return formData.goal.trim().length > 0;
            case 2:
                return formData.proficiency !== "";
            case 3:
                return formData.dailyTime !== "" && formData.timeframe !== "";
            case 4:
                return formData.learningStyle !== "" && formData.availability !== "";
            case 5:
                return aiSummary !== null;
            default:
                return true;
        }
    };

    // Calculate position percentage for each step
    const getStepPosition = (stepId) => {
        return ((stepId - 1) / (steps.length - 1)) * 100;
    };

    if (showPreview) {
        return (
            <CreatedRoom
                formData={formData}
                aiSummary={aiSummary}
                onBack={() => setShowPreview(false)}
                onCreateRoom={createRoom}
                creating={creatingRoom}
                createError={createError}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient transition-colors duration-300 md:ml-20 mb-20 md:mb-0">
            {aiError && (
                <div className="mx-4 mt-4 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm text-orange-500">
                    {aiError}
                </div>
            )}
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/90 mt-4 mx-4 rounded-t-xl backdrop-blur-sm border-b border-text/10 p-4 md:p-6"
            >
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">Create New Room</h1>
                    <p className="text-text/60">Set up your personalized learning journey</p>
                </div>
            </motion.div>

            {/* Enhanced Progress Bar with Positioned Icons */}
            <div className="bg-background/50 border-b border-text/5 p-4 mx-4 rounded-b-xl">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        {/* Step Icons positioned above progress bar */}
                        <div className="relative mb-3">
                            <div className="relative h-8">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={step.id}
                                        className="absolute transform -translate-x-1/2"
                                        style={{ left: `${getStepPosition(step.id)}%` }}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1, duration: 0.3 }}
                                    >
                                        <motion.div
                                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                                                step.id <= currentStep
                                                    ? 'bg-primary border-primary text-white shadow-lg'
                                                    : 'border-text/30 text-text/50 bg-background'
                                            }`}
                                            animate={{
                                                scale: step.id === currentStep ? 1.15 : 1,
                                                y: step.id === currentStep ? -2 : 0,
                                            }}
                                            whileHover={{
                                                scale: step.id <= currentStep ? 1.1 : 1.05,
                                            }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => {
                                                if (step.id <= currentStep) {
                                                    setCurrentStep(step.id);
                                                }
                                            }}
                                        >
                                            <AnimatePresence mode="wait">
                                                {step.id < currentStep ? (
                                                    <motion.div
                                                        key="check"
                                                        initial={{ scale: 0, rotate: -90 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        exit={{ scale: 0, rotate: 90 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="icon"
                                                        initial={{ scale: 0, rotate: 90 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        exit={{ scale: 0, rotate: -90 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <step.icon className="w-5 h-5" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Active pulse effect */}
                                            {step.id === currentStep && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                        opacity: [0.7, 0, 0.7],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                />
                                            )}
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative">
                            <div className="w-full bg-text/10 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full relative"
                                    initial={{ width: "0%" }}
                                    animate={{ 
                                        width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` 
                                    }}
                                    transition={{ 
                                        duration: 0.6, 
                                        ease: "easeOut",
                                        delay: 0.1
                                    }}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        animate={{
                                            x: ["-100%", "100%"],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Step position markers */}
                            {steps.map((step, index) => (
                                <motion.div
                                    key={`marker-${step.id}`}
                                    className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${
                                        step.id <= currentStep ? 'bg-white' : 'bg-text/30'
                                    }`}
                                    style={{ left: `${getStepPosition(step.id)}%` }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.05 + 0.3 }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons - Only show when not on step 5 */}
                    {currentStep < steps.length && (
                        <div className="flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <Button 
                                variant="primary" 
                                onClick={nextStep}
                                disabled={!canProceedToNext()}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    
                    {/* Only show Previous button on step 5 */}
                    {currentStep === steps.length && (
                        <div className="flex items-center justify-start">
                            <Button 
                                variant="ghost" 
                                onClick={prevStep}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Steps Section */}
                    <div className="flex-1">
                        <Card className="p-4 md:p-6 min-h-[400px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`step-${currentStep}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <RoomSteps 
                                        currentStep={currentStep}
                                        formData={formData}
                                        updateFormData={updateFormData}
                                        aiSummary={aiSummary}
                                        aiError={aiError}
                                        onRetryAi={generateAISummary}
                                        onUseTemplate={skipOrUseTemplate}
                                        onProceedToPreview={proceedToPreview}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </Card>
                    </div>

                    {/* AI Summarizer */}
                    <div className="w-full lg:w-80">
                        <Card className="p-4 md:p-6 min-h-[400px]">
                            <AISummarizer 
                                formData={formData}
                                currentStep={currentStep}
                                aiSummary={aiSummary}
                            />
                        </Card>
                    </div>
                </div>

                {/* Similar Rooms Cards - Show only at step 5 */}
                {currentStep === 5 && similarRooms.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8"
                    >
                        <div className="mb-6 text-center">
                            <h3 className="text-xl font-semibold text-text flex items-center justify-center gap-2 mb-2">
                                <Search className="w-5 h-5 text-primary" />
                                {similarRooms.length} Similar Room{similarRooms.length !== 1 ? 's' : ''} Found
                            </h3>
                            <p className="text-text/60">
                                Consider joining an existing room instead of creating a new one
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {similarRooms.map((room, index) => (
                                <motion.div
                                    key={room.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <Avatar name={room.avatar} size="md" />
                                                <div>
                                                    <h4 className="font-semibold text-text">{room.name}</h4>
                                                    <p className="text-sm text-text/70">{room.creator}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-text/80 text-sm mb-3 line-clamp-2">
                                            {room.description}
                                        </p>

                                        {/* Room Stats */}
                                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                                            <div className="text-center p-2 bg-text/5 rounded">
                                                <p className="text-text/60">Members</p>
                                                <p className="font-bold text-text">{room.members}/{room.maxMembers}</p>
                                            </div>
                                            <div className="text-center p-2 bg-text/5 rounded">
                                                <p className="text-text/60">Progress</p>
                                                <p className="font-bold text-text">{room.progress}%</p>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {room.tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="default" size="xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {room.tags.length > 3 && (
                                                <Badge variant="outline" size="xs">
                                                    +{room.tags.length - 3}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-text/60">Course Progress</span>
                                                <span className="text-xs font-medium text-text">{room.progress}%</span>
                                            </div>
                                            <ProgressBar value={room.progress} variant="primary" />
                                        </div>

                                        {/* Action Button - Only Preview */}
                                        <Button
                                            variant="outline"
                                            onClick={() => handlePreviewSimilarRoom(room)}
                                            className="w-full flex items-center gap-2"
                                        >
                                            <Eye size={14} />
                                            Preview Room
                                        </Button>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Similar Room Preview Modal using RoomPreview component */}
            {previewOpen && selectedRoom && (
                <RoomPreview
                    isOpen={previewOpen}
                    room={selectedRoom}
                    onClose={closeSimilarRoomPreview}
                    onJoin={handleJoinSimilarRoom}
                    mode="view"
                />
            )}
        </div>
    );
};

export default CreateRoom;
