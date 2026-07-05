// Components/room/roomHeader.jsx
import React from "react";
import { motion } from "framer-motion";
import { 
    Calendar, 
    Users, 
    Settings, 
    BarChart3, 
    Map, 
    Brain, 
    Columns,
    MessageCircle,
} from "lucide-react";
import { Badge } from "../../elements/elements";

const RoomHeader = ({ 
    roomData, 
    activeView, 
    onViewChange, 
    onSettingsToggle,
    onChatToggle,
    onMembersToggle,
    showChat = false,
    showMembers = false, // Changed default to false (closed by default)
    unreadCount = 0
}) => {
    const views = [
        { id: "progress", label: "Progress", icon: BarChart3 },
        { id: "roadmap", label: "Roadmap", icon: Map },
        { id: "quiz", label: "Quiz", icon: Brain },
        { id: "kanban", label: "Kanban", icon: Columns }
    ];

    return (
        <div className="bg-background/60 backdrop-blur-sm border-b border-text/10 rounded-xl mx-4 mt-4">
            <div className="px-6 py-4 border-b border-text/5">
                <div className="flex items-center justify-between">
                    {/* Room Info */}
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text">{roomData.name}</h1>
                            <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-text/60">
                                    <Calendar size={14} />
                                    <span className="text-sm">{roomData.daysRemaining} days left</span>
                                </div>
                                <div className="flex items-center space-x-1 text-text/60">
                                    <Users size={14} />
                                    <span className="text-sm">{roomData.activeUsers} active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Members Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onMembersToggle}
                            className={`relative p-2 rounded-lg transition-colors ${
                                showMembers 
                                    ? 'bg-primary text-white shadow-lg' 
                                    : 'bg-alt/20 hover:bg-alt/40 text-text/60 hover:text-text'
                            }`}
                            title="Toggle Members Panel"
                        >
                            <Users size={20} />
                        </motion.button>

                        {/* Chat Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onChatToggle}
                            className={`relative p-2 rounded-lg transition-colors ${
                                showChat 
                                    ? 'bg-primary text-white shadow-lg' 
                                    : 'bg-alt/20 hover:bg-alt/40 text-text/60 hover:text-text'
                            }`}
                            title="Toggle Chat"
                        >
                            <MessageCircle size={20} />
                            
                            {/* Unread Message Badge */}
                            {unreadCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </motion.div>
                            )}
                        </motion.button>

                        {/* Settings Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSettingsToggle}
                            className="p-2 rounded-lg bg-alt/20 hover:bg-alt/40 text-text/60 hover:text-text transition-colors"
                            title="Room Settings"
                        >
                            <Settings size={20} />
                        </motion.button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center space-x-1 min-w-max">
                            {views.map((view) => (
                                <motion.button
                                    key={view.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onViewChange(view.id)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                        activeView === view.id
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-text/60 hover:text-text hover:bg-alt/20"
                                    }`}
                                >
                                    <view.icon size={16} />
                                    <span>{view.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RoomHeader;
