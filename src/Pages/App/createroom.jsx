// Components/room/CreateRoom.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ArrowLeft,
    Target,
    Clock,
    Users,
    CheckCircle,
    Brain,
    Calendar,
    Sparkles,
    Eye,
    UserPlus,
    Search,
    Star
} from "lucide-react";

import RoomSteps from "../../Components/App/newrooms/roomSteps";
import AISummarizer from "../../Components/App/newrooms/AISummarizer";
import CreatedRoom from "../../Components/App/newrooms/createdRoom";
import RoomPreview from "../../Components/App/newrooms/roomPreview";
import TagInput from "../../Components/App/newrooms/TagInput";
import RoadmapViewer from "../../Components/App/newrooms/RoadmapViewer";
import { Card, Button, Badge, Avatar, ProgressBar } from "../../Components/elements/elements";
import { roomService } from "../../services/roomService";
import { aiService } from "../../services/aiService";

const CreateRoom = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    // Room limit state
    const [roomLimit, setRoomLimit] = useState(null);
    const [isCheckingLimit, setIsCheckingLimit] = useState(true);

    // Form data state - Start with empty values, fill as user progresses
    const [formData, setFormData] = useState({
        goal: "",
        description: "",
        selectedTags: [],
        proficiency: "",           // Empty - user must select
        dailyTime: "",             // Empty - user must select
        timeframe: "",             // Empty - user must select
        learningStyle: "",         // Empty - user must select
        availability: "",          // Empty - user must select
        timezone: "IST",           // Keep default timezone
        generateRoadmap: true      // Keep default
    });

    const [aiSummary, setAiSummary] = useState(null);
    const [similarRooms, setSimilarRooms] = useState([]);

    const steps = [
        { id: 1, title: "Set a Goal", icon: Target },
        { id: 2, title: "Select Proficiency", icon: Brain },
        { id: 3, title: "Time Commitment", icon: Clock },
        { id: 4, title: "Preferences", icon: Users },
        { id: 5, title: "AI Summary", icon: Sparkles }
    ];

    // Check room limit on mount
    useEffect(() => {
        const checkLimit = async () => {
            try {
                setIsCheckingLimit(true);
                const response = await roomService.checkRoomLimit();

                console.log('🔍 Room limit check response:', response);

                if (response.success) {
                    setRoomLimit(response.data);
                    console.log('📊 Room limit data:', response.data);
                    console.log('🚫 Can create?', response.data.canCreate);
                }
            } catch (err) {
                console.error('❌ Failed to check room limit:', err);
            } finally {
                setIsCheckingLimit(false);
            }
        };

        checkLimit();
    }, []);

    const generateSimilarRooms = () => {
        // No similar rooms feature yet - would require backend endpoint
        const mockSimilarRooms = [];

        const filtered = mockSimilarRooms.filter(room => {
            const hasMatchingTags = room.tags.some(tag =>
                formData.selectedTags.some(userTag =>
                    userTag.toLowerCase().includes(tag.toLowerCase()) ||
                    tag.toLowerCase().includes(userTag.toLowerCase())
                )
            );
            const matchesDifficulty = room.difficulty.toLowerCase() === formData.proficiency.toLowerCase();
            return hasMatchingTags || matchesDifficulty;
        });

        setSimilarRooms(filtered.slice(0, 3));
    };

    const updateFormData = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const generateAISummary = async () => {
        try {
            setError(""); // Clear any previous errors

            // Calculate duration in days
            const getDurationInDays = () => {
                if (formData.timeframe?.startsWith('custom-')) {
                    return parseInt(formData.timeframe.split('-')[1]);
                }
                const timeframeMap = {
                    '2weeks': 14,
                    '3weeks': 21,
                    '1month': 30,
                    '6weeks': 42,
                    '2months': 60,
                    '3months': 90,
                    '4months': 120,
                    '5months': 150,
                    '6months': 180
                };
                return timeframeMap[formData.timeframe] || 30;
            };

            const durationDays = getDurationInDays();

            // Call real AI API
            const response = await aiService.generateRoomSummary({
                roomTitle: formData.goal,
                description: formData.description,
                topics: formData.selectedTags,
                durationDays: durationDays,
                skillLevel: formData.proficiency,
                dailyTime: formData.dailyTime,
                goal: formData.goal
            });

            if (response.success && response.summary) {
                // Transform AI response to match expected format
                const aiData = response.summary;
                const summary = {
                    // AI-generated content
                    aiSummary: aiData.summary,
                    aiFeedback: aiData.feedback,
                    estimatedCompletion: aiData.estimatedCompletion,
                    intensityLevel: aiData.intensityLevel,
                    recommendations: aiData.recommendations || [],

                    // Keep some calculated values for display
                    estimatedGain: `${aiData.estimatedCompletion} achievable`,
                    roadmapPreview: [
                        `${formData.selectedTags.slice(0, 3).join(', ')} learning path`,
                        `${Math.ceil(durationDays / 7)} weeks structured journey`,
                        `${formData.dailyTime} daily commitment`,
                        `${formData.learningStyle} learning approach`
                    ],
                    suggestedRoomSize: formData.learningStyle === 'solo' ? '1-2 members' :
                        formData.learningStyle === 'pair' ? '2-3 members' : '4-6 members',
                    studyIntensity: `${aiData.intensityLevel} (${formData.dailyTime} daily)`,
                    roomName: formData.goal,
                    schedule: formData.availability === "weekdays" ? "Weekdays" :
                        formData.availability === "weekends" ? "Weekends" : "Flexible schedule"
                };

                setAiSummary(summary);
                generateSimilarRooms();
            } else {
                throw new Error("Failed to generate AI summary");
            }
        } catch (err) {
            console.error("AI Summary generation error:", err);

            // Fallback to basic summary if AI fails
            const durationDays = getDurationInDays();
            const weeks = Math.ceil(durationDays / 7);
            const summary = {
                aiSummary: `You're planning to learn ${formData.selectedTags.join(', ')} over ${weeks} weeks as a ${formData.proficiency} learner.`,
                aiFeedback: "AI summarizer is temporarily unavailable. Your learning plan looks good!",
                estimatedCompletion: "Unable to estimate",
                intensityLevel: "Moderate",
                recommendations: ["Focus on consistent daily practice", "Break topics into smaller milestones"],
                estimatedGain: `Progress from ${formData.proficiency} level in ${weeks} weeks`,
                roadmapPreview: [
                    `${formData.selectedTags.slice(0, 3).join(', ')} learning path`,
                    `${weeks} weeks structured journey`,
                    `${formData.dailyTime} daily commitment`,
                    `${formData.learningStyle} learning approach`
                ],
                suggestedRoomSize: '4-6 members',
                studyIntensity: `Moderate (${formData.dailyTime} daily)`,
                roomName: formData.goal,
                schedule: "Flexible schedule"
            };
            setAiSummary(summary);
            generateSimilarRooms();
        }

        function getDurationInDays() {
            if (formData.timeframe?.startsWith('custom-')) {
                return parseInt(formData.timeframe.split('-')[1]);
            }
            const timeframeMap = {
                '2weeks': 14, '3weeks': 21, '1month': 30, '6weeks': 42,
                '2months': 60, '3months': 90, '4months': 120, '5months': 150, '6months': 180
            };
            return timeframeMap[formData.timeframe] || 30;
        }
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
        setIsCreating(true);
        setError("");

        try {
            // Validate tags
            if (formData.selectedTags.length === 0) {
                throw new Error("Please add at least one learning topic tag");
            }

            // Calculate duration in days from timeframe
            const timeframeMap = {
                '2weeks': 14,
                '3weeks': 21,
                '1month': 30,
                '6weeks': 42,
                '2months': 60,
                '3months': 90,
                '4months': 120,
                '5months': 150,
                '6months': 180
            };

            let durationDays = 30; // default
            if (formData.timeframe?.startsWith('custom-')) {
                durationDays = parseInt(formData.timeframe.split('-')[1]);
            } else {
                durationDays = timeframeMap[formData.timeframe] || 30;
            }

            // Create room using real API with new parameters
            const response = await roomService.createRoom(
                formData.goal, // title
                formData.description, // description
                formData.selectedTags, // tags
                formData.proficiency, // skillLevel (Beginner/Intermediate/Advanced)
                6, // maxSeats - default
                formData.generateRoadmap, // generateRoadmap
                durationDays // durationDays
            );

            const roomData = response.room || response.data;
            if (response.success && roomData) {
                console.log("Room created:", roomData);
                console.log("Roadmap:", roomData.roadmap);

                // Trigger room list refresh
                window.dispatchEvent(new CustomEvent('roomListChanged'));

                // Navigate to the newly created room
                navigate(`/room/${roomData.id || roomData._id}`);
            } else {
                throw new Error("Failed to create room");
            }
        } catch (err) {
            console.error("Create room error:", err);

            // Check if it's a room limit error
            if (err.response?.status === 403 || err.message?.includes('limit reached')) {
                setError("Free plan limit reached. You can join or create a maximum of 5 rooms. Upgrade to join more rooms.");
            } else {
                setError(err.message || "Failed to create room. Please try again.");
            }
        } finally {
            setIsCreating(false);
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
                return formData.goal.trim().length > 0 && formData.selectedTags.length > 0;
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
            />
        );
    }

    // Show loading state while checking limit
    if (isCheckingLimit) {
        return (
            <div className="min-h-screen bg-gradient transition-colors duration-300 md:ml-20 mb-20 md:mb-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text/60">Loading...</p>
                </div>
            </div>
        );
    }

    // Show limit reached UI if user has reached max rooms
    console.log('🎯 Rendering - roomLimit:', roomLimit);
    console.log('🎯 Rendering - canCreate:', roomLimit?.canCreate);

    if (roomLimit && !roomLimit.canCreate) {
        console.log('🚫 BLOCKING UI - User has reached room limit!');
        return (
            <div className="min-h-screen bg-gradient transition-colors duration-300 md:ml-20 mb-20 md:mb-0">
                <div className="max-w-2xl mx-auto px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-background rounded-2xl shadow-2xl p-8 text-center border border-text/10"
                    >
                        {/* Icon */}
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                                <Star className="w-10 h-10 text-primary" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-text mb-4">Room Limit Reached</h1>

                        {/* Message */}
                        <p className="text-text/70 text-lg mb-2">
                            You've reached the maximum of <span className="font-bold text-primary">{roomLimit.maxRooms} rooms</span> on the free plan.
                        </p>
                        <p className="text-text/60 mb-8">
                            Currently in {roomLimit.currentRooms} active room{roomLimit.currentRooms !== 1 ? 's' : ''}.
                        </p>

                        {/* Coming Soon Badge */}
                        <div className="inline-block mb-8">
                            <Badge variant="warning" className="text-lg px-6 py-2">
                                <Sparkles className="w-5 h-5 mr-2 inline" />
                                Learncurve Pro - Coming Soon
                            </Badge>
                        </div>

                        {/* Features Preview */}
                        <div className="bg-background/50 rounded-xl p-6 mb-8 border border-text/5">
                            <h3 className="font-semibold text-text mb-4">Learncurve Pro will include:</h3>
                            <ul className="text-left space-y-3 text-text/70">
                                <li className="flex items-start">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Unlimited room creation</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Advanced AI-powered learning insights</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Priority support and exclusive features</span>
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/home')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient transition-colors duration-300 md:ml-20 mb-20 md:mb-0">
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
                                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer ${step.id <= currentStep
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
                                    className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${step.id <= currentStep ? 'bg-white' : 'bg-text/30'
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
