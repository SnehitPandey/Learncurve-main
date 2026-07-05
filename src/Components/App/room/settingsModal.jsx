// Components/room/SettingsModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    Settings,
    LogOut,
    X,
    Users,
    Copy,
    Check,
    AlertTriangle,
    Shield,
    Clock,
    Zap,
    Eye,
    EyeOff,
} from "lucide-react";
import { Card, Button, Badge } from "../../elements/elements";

const SettingsModal = ({
    showSettings,
    onClose,
    onLeaveRoom,
    roomData,
    isRoomAdmin = false,
}) => {
    const [activeTab, setActiveTab] = useState("notifications");
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [roomCodeCopied, setRoomCodeCopied] = useState(false);

    // Updated notification settings (removed soundEnabled)
    const [notificationSettings, setNotificationSettings] = useState({
        messageNotifications: true,
        quizNotifications: true,
        scheduleNotifications: false,
        pushNotifications: true,
    });

    // Updated room preferences (removed darkMode, autoScroll, showTypingIndicators)
    const [roomPreferences, setRoomPreferences] = useState({
        quizFrequency: "daily",
        quizDifficulty: "medium",
        showOthersTasks: true,
        focusMode: false,
    });

    const handleNotificationChange = (setting, value) => {
        setNotificationSettings((prev) => ({
            ...prev,
            [setting]: value,
        }));
    };

    const handlePreferenceChange = (setting, value) => {
        setRoomPreferences((prev) => ({
            ...prev,
            [setting]: value,
        }));
    };

    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(roomData?.code || roomData?.id || "");
            setRoomCodeCopied(true);
            setTimeout(() => setRoomCodeCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy room code:", err);
        }
    };

    const handleLeaveRoom = () => {
        setShowLeaveConfirm(false);
        onLeaveRoom();
    };

    const tabVariants = {
        inactive: {
            opacity: 0.8,
            y: 2,
        },
        active: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut",
            },
        },
    };

    const contentVariants = {
        hidden: {
            opacity: 0,
            x: 10,
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    const ToggleSwitch = ({
        checked,
        onChange,
        label,
        description,
        icon: Icon,
    }) => (
        <motion.div
            variants={itemVariants}
            className="flex items-center justify-between py-4 border-b border-text/10 last:border-b-0"
        >
            <div className="flex items-start space-x-3">
                {Icon && <Icon className="w-5 h-5 text-text/60 mt-0.5" />}
                <div>
                    <div className="text-sm font-medium text-text">{label}</div>
                    {description && (
                        <div className="text-xs text-text/60 mt-1 max-w-sm">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    checked ? "bg-primary" : "bg-text/20"
                }`}
            >
                <motion.div
                    animate={{
                        x: checked ? 20 : 2,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                />
            </motion.button>
        </motion.div>
    );

    const SelectField = ({
        value,
        onChange,
        options,
        label,
        description,
        icon: Icon,
    }) => (
        <motion.div
            variants={itemVariants}
            className="py-4 border-b border-text/10 last:border-b-0"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    {Icon && <Icon className="w-5 h-5 text-text/60 mt-0.5" />}
                    <div className="flex-1">
                        <div className="text-sm font-medium text-text">{label}</div>
                        {description && (
                            <div className="text-xs text-text/60 mt-1">{description}</div>
                        )}
                    </div>
                </div>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="px-3 py-2 text-sm bg-background border border-text/20 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[120px]"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </motion.div>
    );

    const tabs = [
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "preferences", label: "Preferences", icon: Settings },
        { id: "room", label: "Room Info", icon: Users },
    ];

    return (
        <AnimatePresence>
            {showSettings && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        key="settings-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] z-[60] mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Card
                            variant="elevated"
                            className="overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-text/10">
                                <div className="flex items-center space-x-3">
                                    <Settings className="w-6 h-6 text-text/80" />
                                    <h3 className="text-xl font-bold text-text">Room Settings</h3>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-text/60 hover:text-text hover:bg-text/10 transition-colors"
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            {/* Tabs - Enhanced with theme colors */}
                            <div className="flex p-6 pb-0">
                                <div className="flex w-full bg-alt/30 rounded-xl p-1.5 border border-text/5">
                                    {tabs.map((tab) => (
                                        <motion.button
                                            key={tab.id}
                                            variants={tabVariants}
                                            animate={activeTab === tab.id ? "active" : "inactive"}
                                            whileHover="active"
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                activeTab === tab.id
                                                    ? "bg-primary text-alt shadow-lg shadow-primary/25 border border-primary/20"
                                                    : "text-text/70 hover:text-text hover:bg-background/50"
                                            }`}
                                        >
                                            <tab.icon size={16} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <AnimatePresence mode="wait">
                                    {activeTab === "notifications" && (
                                        <motion.div
                                            key="notifications"
                                            variants={contentVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            className="space-y-0"
                                        >
                                            <ToggleSwitch
                                                icon={Bell}
                                                checked={notificationSettings.messageNotifications}
                                                onChange={(value) =>
                                                    handleNotificationChange(
                                                        "messageNotifications",
                                                        value
                                                    )
                                                }
                                                label="Message Notifications"
                                                description="Get notified when you receive messages in the room"
                                            />
                                            <ToggleSwitch
                                                icon={Zap}
                                                checked={notificationSettings.quizNotifications}
                                                onChange={(value) =>
                                                    handleNotificationChange("quizNotifications", value)
                                                }
                                                label="Quiz Notifications"
                                                description="Get notified about new quizzes and deadlines"
                                            />
                                            <ToggleSwitch
                                                icon={Clock}
                                                checked={notificationSettings.scheduleNotifications}
                                                onChange={(value) =>
                                                    handleNotificationChange(
                                                        "scheduleNotifications",
                                                        value
                                                    )
                                                }
                                                label="Schedule Notifications"
                                                description="Get notified when a new topic from the roadmap is added to your todo list"
                                            />
                                            <ToggleSwitch
                                                icon={Shield}
                                                checked={notificationSettings.pushNotifications}
                                                onChange={(value) =>
                                                    handleNotificationChange("pushNotifications", value)
                                                }
                                                label="Browser Notifications"
                                                description="Show notifications even when tab is not active"
                                            />
                                        </motion.div>
                                    )}

                                    {activeTab === "preferences" && (
                                        <motion.div
                                            key="preferences"
                                            variants={contentVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            className="space-y-0"
                                        >
                                            <SelectField
                                                icon={Clock}
                                                value={roomPreferences.quizFrequency}
                                                onChange={(value) =>
                                                    handlePreferenceChange("quizFrequency", value)
                                                }
                                                label="Quiz Frequency"
                                                description="How often you want to receive quiz notifications"
                                                options={[
                                                    { value: "daily", label: "Daily" },
                                                    { value: "weekly", label: "Weekly" },
                                                    { value: "never", label: "Never" },
                                                ]}
                                            />
                                            <SelectField
                                                icon={Zap}
                                                value={roomPreferences.quizDifficulty}
                                                onChange={(value) =>
                                                    handlePreferenceChange("quizDifficulty", value)
                                                }
                                                label="Quiz Difficulty"
                                                description="Preferred difficulty level for generated quizzes"
                                                options={[
                                                    { value: "easy", label: "Easy" },
                                                    { value: "medium", label: "Medium" },
                                                    { value: "hard", label: "Hard" },
                                                ]}
                                            />
                                            <ToggleSwitch
                                                icon={roomPreferences.showOthersTasks ? Eye : EyeOff}
                                                checked={roomPreferences.showOthersTasks}
                                                onChange={(value) =>
                                                    handlePreferenceChange("showOthersTasks", value)
                                                }
                                                label="Show Others' Completed Tasks"
                                                description="Display tasks you've completed but others haven't (shown in yellow in kanban view)"
                                            />
                                        </motion.div>
                                    )}

                                    {activeTab === "room" && (
                                        <motion.div
                                            key="room"
                                            variants={contentVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            className="space-y-6"
                                        >
                                            {/* Room Name and Description - moved above room code */}
                                            <div className="p-4 bg-alt/10 rounded-xl">
                                                <h4 className="font-medium text-text mb-2">
                                                    {roomData?.name || "Frontend in 30 Days"}
                                                </h4>
                                                <p className="text-sm text-text/70">
                                                    {roomData?.description ||
                                                        "Master modern frontend development with React, JavaScript, and CSS"}
                                                </p>
                                            </div>

                                            {/* Room Details */}
                                            <div className="bg-alt/20 p-4 rounded-xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-text/70">
                                                        Room Code
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-background px-3 py-1.5 rounded-lg border font-mono text-sm text-text">
                                                            {roomData?.code || "N/A"}
                                                        </code>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={copyRoomCode}
                                                            className="p-1.5 rounded-lg hover:bg-text/10 transition-colors"
                                                        >
                                                            {roomCodeCopied ? (
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="w-4 h-4 text-text/60" />
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-text/70">
                                                        Room Members
                                                    </span>
                                                    <Badge
                                                        variant="primary"
                                                        className="bg-primary/10 text-text border-primary/20"
                                                    >
                                                        {roomData?.memberCount || 0} / {roomData?.maxSeats || 0}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-text/70">
                                                        Status
                                                    </span>
                                                    <span className={`text-sm font-medium ${
                                                        roomData?.status === 'ACTIVE' ? 'text-green-500' :
                                                        roomData?.status === 'WAITING' ? 'text-orange-500' :
                                                        roomData?.status === 'PAUSED' ? 'text-yellow-500' :
                                                        'text-blue-500'
                                                    }`}>
                                                        {roomData?.status || "N/A"}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-text/70">
                                                        Created
                                                    </span>
                                                    <span className="text-sm text-text">
                                                        {roomData?.createdAt 
                                                            ? new Date(roomData.createdAt).toLocaleDateString()
                                                            : "N/A"
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Room Stats */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {roomData?.daysRemaining !== undefined ? roomData.daysRemaining : "N/A"}
                                                    </p>
                                                    <p className="text-sm text-text/60">Days Left</p>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {roomData?.completionRate !== undefined ? `${roomData.completionRate}%` : "N/A"}
                                                    </p>
                                                    <p className="text-sm text-text/60">Complete</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-text/10 p-6 bg-alt/5">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                                >
                                    <LogOut size={18} />
                                    Leave Room
                                </motion.button>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Leave Room Confirmation */}
                    <AnimatePresence>
                        {showLeaveConfirm && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                                onClick={() => setShowLeaveConfirm(false)}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-background rounded-xl p-6 max-w-md w-full"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-text">
                                                Leave Room?
                                            </h3>
                                            <p className="text-sm text-text/60">
                                                You'll lose your progress and chat history
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3 justify-end">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowLeaveConfirm(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleLeaveRoom}
                                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                        >
                                            Leave Room
                                        </Button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
