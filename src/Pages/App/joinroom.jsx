// Components/room/JoinRoom.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
    Search, 
    Filter, 
    Users, 
    Calendar, 
    Clock, 
    BookOpen,
    Settings,
    Plus,
    Eye,
    MapPin,
    Target,
    TrendingUp,
    User,
    X,
    UserPlus,
    MessageCircle,
    Star,
    Award,
    ArrowLeft,
    CheckCircle,
    Sparkles
} from "lucide-react";

// Import components
import { Card, Button, Badge, Avatar, ProgressBar } from "../../Components/elements/elements";
import RoomPreview from "../../Components/App/newrooms/roomPreview";
import { roomService } from "../../services/roomService";

const JoinRoom = () => {
    const navigate = useNavigate();
    
    // State management
    const [searchQuery, setSearchQuery] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");
    
    // Room limit state
    const [roomLimit, setRoomLimit] = useState(null);
    const [isCheckingLimit, setIsCheckingLimit] = useState(true);
    const [filters, setFilters] = useState({
        skill: "",
        size: "",
        pace: "",
        timeframe: ""
    });

    // Public rooms data
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredRooms, setFilteredRooms] = useState(rooms);

    // Check room limit on mount
    useEffect(() => {
        const checkLimit = async () => {
            try {
                const response = await roomService.checkRoomLimit();
                
                console.log('🔍 [Join Room] Room limit check response:', response);
                
                if (response.success) {
                    setRoomLimit(response.data);
                    console.log('📊 [Join Room] Room limit data:', response.data);
                    console.log('🚫 [Join Room] Can create?', response.data.canCreate);
                }
            } catch (err) {
                console.error('❌ [Join Room] Failed to check room limit:', err);
            } finally {
                setIsCheckingLimit(false);
            }
        };

        checkLimit();
    }, []);

    // Fetch public rooms on mount
    useEffect(() => {
        const fetchPublicRooms = async () => {
            try {
                setLoading(true);
                const response = await roomService.getPublicRooms();

                const rooms = response?.rooms || response?.data || [];
                if (response?.success && Array.isArray(rooms)) {
                    setRooms(rooms);
                    setFilteredRooms(rooms);
                }
            } catch (err) {
                console.error('Error fetching public rooms:', err);
                setError('Failed to load rooms. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchPublicRooms();
    }, []);

    // Filter and search logic
    useEffect(() => {
        let filtered = rooms.filter(room => {
            const matchesSearch = room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesSkill = !filters.skill || room.tags.some(tag => tag.toLowerCase().includes(filters.skill.toLowerCase()));
            const matchesSize = !filters.size || 
                (filters.size === "small" && room.maxSeats <= 4) ||
                (filters.size === "medium" && room.maxSeats > 4 && room.maxSeats <= 6) ||
                (filters.size === "large" && room.maxSeats > 6);

            return matchesSearch && matchesSkill && matchesSize;
        });
        
        setFilteredRooms(filtered);
    }, [searchQuery, filters, rooms]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3 }
        }
    };

    const handleRoomPreview = (room) => {
        setSelectedRoom(room);
        setShowPreviewModal(true);
    };

    const handleJoinRoom = async (room) => {
        setIsJoining(true);
        setError("");
        
        try {
            // If room has a code property, use it; otherwise use roomCode state
            const code = room?.code || roomCode;
            
            if (!code || code.length !== 6) {
                throw new Error("Please enter a valid 6-character room code");
            }

            const response = await roomService.joinRoom(code);
            const joinedRoom = response?.room || response?.data;

            if (response.success && joinedRoom) {
                console.log("Joined room:", joinedRoom);
                
                // Trigger room list refresh
                window.dispatchEvent(new CustomEvent('roomListChanged'));
                
                setShowPreviewModal(false);
                navigate(`/room/${joinedRoom.id || joinedRoom._id}`);
            } else {
                throw new Error("Failed to join room");
            }
        } catch (err) {
            console.error("Join room error:", err);
            
            // Check if it's a room limit error
            if (err.response?.status === 403 || err.message?.includes('limit reached')) {
                setError("Free plan limit reached. You can join or create a maximum of 5 rooms. Upgrade to join more rooms.");
            } else {
                setError(err.message || "Failed to join room. Please try again.");
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleJoinByCode = async () => {
        await handleJoinRoom({ code: roomCode });
    };

    const handleCreateNewRoom = () => {
        navigate('/createroom');
    };

    const clearFilters = () => {
        setFilters({
            skill: "",
            size: "",
            pace: "",
            timeframe: ""
        });
    };

    const handleEditPreferences = () => {
        navigate('/profile', { state: { tab: 'preferences' } });
    };

    const getPaceColor = (pace) => {
        switch (pace.toLowerCase()) {
            case "fast": return "danger";
            case "moderate": return "warning";
            case "slow": return "success";
            default: return "default";
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case "beginner": return "success";
            case "intermediate": return "warning";
            case "advanced": return "danger";
            default: return "default";
        }
    };

    // Show loading state while checking limit
    if (isCheckingLimit) {
        return (
            <div className="min-h-screen md:ml-20 mb-20 md:mb-0 transition-colors duration-300 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text/60">Loading...</p>
                </div>
            </div>
        );
    }

    // Show limit reached UI if user has reached max rooms
    if (roomLimit && !roomLimit.canCreate) {
        return (
            <div className="min-h-screen md:ml-20 mb-20 md:mb-0 transition-colors duration-300">
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
                                    <span>Unlimited room creation and joining</span>
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
        <div className="min-h-screen md:ml-20 mb-20 md:mb-0 transition-colors duration-300">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-text/10 bg-background/80 backdrop-blur-sm sticky top-0 z-40 mx-4 mt-4 rounded-xl"
            >
                <div className="p-4 md:p-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">
                        Find Rooms
                    </h1>
                    <p className="text-text/70">
                        AI-curated list of active rooms matching your interests
                    </p>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 md:p-6 max-w-6xl mx-auto"
            >
                {/* Search and Filters */}
                <motion.div variants={itemVariants}>
                    <Card className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/50" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search rooms by skill, name, or tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-text/5 border border-text/20 rounded-xl text-text placeholder-text/50 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            
                            {/* Filter Button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2"
                            >
                                <Filter size={18} />
                                Filters
                                {Object.values(filters).some(f => f) && (
                                    <Badge variant="primary" size="sm">
                                        {Object.values(filters).filter(f => f).length}
                                    </Badge>
                                )}
                            </Button>
                        </div>

                        {/* Filter Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 pt-4 border-t border-text/10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-text">Skill</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., React, Python"
                                                value={filters.skill}
                                                onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                                                className="w-full px-3 py-2 bg-text/5 border border-text/20 rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-text">Size</label>
                                            <select
                                                value={filters.size}
                                                onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
                                                className="w-full px-3 py-2 bg-text/5 border border-text/20 rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                                            >
                                                <option value="">Any size</option>
                                                <option value="small">Small (2-4)</option>
                                                <option value="medium">Medium (5-6)</option>
                                                <option value="large">Large (7+)</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-text">Pace</label>
                                            <select
                                                value={filters.pace}
                                                onChange={(e) => setFilters(prev => ({ ...prev, pace: e.target.value }))}
                                                className="w-full px-3 py-2 bg-text/5 border border-text/20 rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                                            >
                                                <option value="">Any pace</option>
                                                <option value="slow">Slow</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="fast">Fast</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-text">Timeframe</label>
                                            <select
                                                value={filters.timeframe}
                                                onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
                                                className="w-full px-3 py-2 bg-text/5 border border-text/20 rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                                            >
                                                <option value="">Any timeframe</option>
                                                <option value="week">1 week</option>
                                                <option value="month">1 month</option>
                                                <option value="months">2+ months</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-4">
                                        <Button variant="ghost" onClick={clearFilters}>
                                            Clear all filters
                                        </Button>
                                        <Button variant="ghost" onClick={handleEditPreferences}>
                                            <Settings size={16} className="mr-2" />
                                            Edit preferences
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>

                {/* Room Cards */}
                <div className="space-y-4">
                    {loading ? (
                        <motion.div variants={itemVariants}>
                            <Card className="text-center py-12">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                    <p className="text-text/70">Loading available rooms...</p>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            {filteredRooms.length > 0 ? (
                                filteredRooms.map((room) => (
                                    <motion.div
                                        key={room.id}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        layout
                                    >
                                        <Card className="hover:border-primary/50 transition-colors">
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                {/* Room Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-bold text-text mb-2">
                                                                {room.title}
                                                            </h3>
                                                            {room.description && (
                                                                <p className="text-text/70 text-sm">
                                                                    {room.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4">
                                                            {room.host?.avatarUrl ? (
                                                                <img 
                                                                    src={room.host.avatarUrl} 
                                                                    alt={room.host?.name || 'Host'}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                                                    {(room.host?.name || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="text-sm">
                                                                <p className="text-text/60">Host</p>
                                                                <p className="text-text font-medium">{room.host?.name || 'Unknown'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {room.tags.map((tag, index) => (
                                                            <Badge key={index} variant="default" size="sm">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        <Badge variant={room.status === 'PREPARING' ? 'warning' : 'success'} size="sm">
                                                            {room.status}
                                                        </Badge>
                                                    </div>

                                                    {/* Room Stats */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center gap-2 text-text/70">
                                                            <Users size={16} />
                                                            <span>{room.currentMembers}/{room.maxSeats} members</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-text/70">
                                                            <Calendar size={16} />
                                                            <span>Starts {new Date(room.startDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-text/70">
                                                            <BookOpen size={16} />
                                                            <span>{room.availableSeats} spots left</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div className="flex flex-col justify-center gap-3 lg:w-48">
                                                    <Button
                                                        onClick={() => handleJoinRoom(room)}
                                                        disabled={isJoining}
                                                        className="flex items-center gap-2 w-full justify-center"
                                                    >
                                                        <UserPlus size={16} />
                                                        {isJoining ? 'Joining...' : 'Join Room'}
                                                    </Button>
                                                    <div className="text-center">
                                                        <span className="text-xs text-text/60">
                                                            Code: {room.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div variants={itemVariants}>
                                    <Card className="text-center py-12">
                                        <Target className="mx-auto text-text/30 mb-4" size={48} />
                                        <h3 className="text-xl font-bold text-text mb-2">No rooms found</h3>
                                        <p className="text-text/70 mb-6">
                                            No rooms match your current filters. Try adjusting your search or create a new room.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <Button variant="outline" onClick={clearFilters}>
                                                Clear filters
                                            </Button>
                                            <Button onClick={handleCreateNewRoom}>
                                                <Plus size={16} className="mr-2" />
                                                Request to Form New Room
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>

            {/* Room Preview Modal */}
            <RoomPreview
                isOpen={showPreviewModal}
                room={selectedRoom}
                onClose={() => setShowPreviewModal(false)}
                onJoin={handleJoinRoom}
                mode="view"
            />
        </div>
    );
};

export default JoinRoom;
