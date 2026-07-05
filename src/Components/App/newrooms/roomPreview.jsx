// Components/room/RoomPreview.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Users, 
    Calendar, 
    Clock, 
    MapPin,
    Target,
    Award,
    UserPlus
} from "lucide-react";

import { Card, Button, Badge, Avatar, ProgressBar } from "../../elements/elements";

const RoomPreview = ({ 
    isOpen, 
    room, 
    onClose, 
    onJoin, 
    mode = "view" // "view" for existing rooms, "create" for new room preview
}) => {
    if (!room || !isOpen) return null;

    const modalVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const modalContentVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: { 
            scale: 1, 
            opacity: 1,
            transition: { type: "spring", duration: 0.3 }
        },
        exit: { scale: 0.8, opacity: 0 }
    };

    const getPaceColor = (pace) => {
        switch (pace?.toLowerCase()) {
            case "fast": return "danger";
            case "moderate": return "warning";
            case "slow": return "success";
            default: return "default";
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case "beginner": return "success";
            case "intermediate": return "warning";
            case "advanced": return "danger";
            default: return "default";
        }
    };

    const spotsLeft = room.maxMembers - room.members;

    return (
        <AnimatePresence>
            <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-text/10">
                        <div className="flex items-center gap-4">
                            <Avatar name={room.avatar} size="lg" />
                            <div>
                                <h2 className="text-2xl font-bold text-text">{room.name}</h2>
                                <p className="text-text/70">Created by {room.creator}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="p-2"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Modal Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="p-6 space-y-6">
                            {/* Room Overview */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-text mb-3">Room Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-text/70">
                                            <Users size={16} />
                                            <span>{room.members}/{room.maxMembers} members</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text/70">
                                            <Calendar size={16} />
                                            <span>Starts {room.startDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text/70">
                                            <Clock size={16} />
                                            <span>{room.timeframe}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text/70">
                                            <MapPin size={16} />
                                            <span>{room.schedule}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Tags */}
                                    <div className="mt-4">
                                        <div className="flex flex-wrap gap-2">
                                            {room.tags?.map((tag) => (
                                                <Badge key={tag} variant="default" size="sm">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            <Badge variant={getPaceColor(room.pace)} size="sm">
                                                {room.pace} pace
                                            </Badge>
                                            <Badge variant={getDifficultyColor(room.difficulty)} size="sm">
                                                {room.difficulty}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-text mb-3">Progress</h3>
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-text/70">Course Progress</span>
                                            <span className="text-sm font-medium text-text">{room.progress}%</span>
                                        </div>
                                        <ProgressBar value={room.progress} variant="primary" />
                                    </div>
                                    
                                    <div className="bg-text/5 rounded-lg p-4">
                                        <p className="text-text/80 text-sm leading-relaxed">
                                            {room.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Goals */}
                            {room.learningGoals && (
                                <div>
                                    <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                                        <Target size={18} />
                                        Learning Goals
                                    </h3>
                                    <ul className="space-y-2">
                                        {room.learningGoals.map((goal, index) => (
                                            <li key={index} className="flex items-start gap-2 text-text/80">
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                                <span>{goal}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Prerequisites */}
                            {room.prerequisites && (
                                <div>
                                    <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                                        <Award size={18} />
                                        Prerequisites
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {room.prerequisites.map((prereq, index) => (
                                            <Badge key={index} variant="outline" size="sm">
                                                {prereq}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Current Members */}
                            {room.memberProfiles && (
                                <div>
                                    <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                                        <Users size={18} />
                                        Current Members ({room.members})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {room.memberProfiles.map((member, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-text/5 rounded-lg">
                                                <Avatar name={member.avatar} size="sm" />
                                                <div>
                                                    <p className="font-medium text-text">{member.name}</p>
                                                    <p className="text-sm text-text/70">{member.skill}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="border-t border-text/10 p-6 bg-text/5">
                        <div className="flex flex-col sm:flex-row gap-3 justify-between">
                            <div className="text-sm text-text/70">
                                <span className="font-medium text-primary">
                                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                                </span>
                                {room.createdDate && (
                                    <>
                                        <span className="mx-2">•</span>
                                        <span>Created on {room.createdDate}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                                {mode === "view" && (
                                    <Button
                                        onClick={() => onJoin(room)}
                                        className="flex items-center gap-2"
                                        disabled={spotsLeft <= 0}
                                    >
                                        <UserPlus size={16} />
                                        {spotsLeft <= 0 ? 'Room Full' : 'Join Room'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RoomPreview;
