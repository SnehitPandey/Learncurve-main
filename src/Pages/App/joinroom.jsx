// Components/room/JoinRoom.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
    Search, Filter, Users, Calendar, Clock, Settings, Plus, Eye, MapPin, Target } from "lucide-react";

// Import components
import { Card, Button, Badge, Avatar, ProgressBar } from "../../Components/elements/elements";
import RoomPreview from "../../Components/App/newrooms/roomPreview";
import { listRooms, joinRoom as joinRoomApi } from "../../api/rooms";

const JoinRoom = () => {
    const navigate = useNavigate();
    
    // State management
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [filters, setFilters] = useState({
        skill: "",
        size: "",
        pace: "",
        timeframe: ""
    });

    // Rooms load from backend only — no sample data
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    // (sample rooms removed - backend only)

    const [filteredRooms, setFilteredRooms] = useState(rooms);
    const [joiningRoomId, setJoiningRoomId] = useState(null);
    const [joinError, setJoinError] = useState("");

    // Load rooms from backend API
    useEffect(() => {
        let isMounted = true;
        const fetchBackendRooms = async () => {
            try {
                const res = await listRooms({
                    query: searchQuery,
                    skill: filters.skill,
                    pace: filters.pace
                });
                if (res && Array.isArray(res.rooms) && isMounted) {
                    // Backend listRooms returns {id,name,skill,pace,difficulty,maxMembers,
                    // memberCount,schedule,timeframe,tags,description}. It does NOT
                    // return created_at / creator_name / max_members.
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
                        isActive: true,
                        creator: null,
                        createdDate: null,
                        learningGoals: [],
                        prerequisites: [],
                        memberProfiles: []
                    }));
                    if (formatted.length > 0 && isMounted) {
                        setRooms(formatted);
                    }
                }

                // Always clear the spinner, whatever came back.
                //
                // This used to sit inside `if (formatted.length > 0)`, so a search
                // that legitimately matched NOTHING left `roomsLoading` true
                // forever — the page spun indefinitely and showed neither an empty
                // state nor an error. An empty result is a result, not a pending
                // request.
                if (isMounted) setRoomsLoading(false);
            } catch (err) {
                console.warn("Could not fetch backend rooms:", err);
                if (isMounted) setRoomsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchBackendRooms();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery, filters.skill, filters.pace]);

    // Filter and search logic (null-safe — backend rooms may omit skill/tags)
    useEffect(() => {
        let filtered = rooms.filter(room => {
            const q = (searchQuery || "").toLowerCase();
            const name = (room.name || "").toLowerCase();
            const skill = (room.skill || "").toLowerCase();
            const tags = Array.isArray(room.tags) ? room.tags : [];
            const matchesSearch = !q || name.includes(q) ||
                                skill.includes(q) ||
                                tags.some(tag => String(tag).toLowerCase().includes(q));
            
            const matchesSkill = !filters.skill || room.skill.toLowerCase().includes(filters.skill.toLowerCase());
            const matchesSize = !filters.size || 
                (filters.size === "small" && room.maxMembers <= 4) ||
                (filters.size === "medium" && room.maxMembers > 4 && room.maxMembers <= 6) ||
                (filters.size === "large" && room.maxMembers > 6);
            const matchesPace = !filters.pace || room.pace.toLowerCase() === filters.pace.toLowerCase();
            const matchesTimeframe = !filters.timeframe || room.timeframe.includes(filters.timeframe);

            return matchesSearch && matchesSkill && matchesSize && matchesPace && matchesTimeframe;
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
        if (!room?.id) return;
        setJoiningRoomId(room.id);
        setJoinError("");
        try {
            await joinRoomApi(room.id);
            setShowPreviewModal(false);
            navigate(`/room/${room.id}`);
        } catch (err) {
            // Don't pretend the join worked — staying here surfaces the failure.
            console.warn("Join room failed:", err?.message);
            setJoinError(err?.message || "Could not join this room.");
        } finally {
            setJoiningRoomId(null);
        }
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
        navigate('/settings', { state: { tab: 'preferences' } });
    };


    const getPaceColor = (pace) => {
        switch (String(pace || "").toLowerCase()) {
            case "fast": return "danger";
            case "moderate": return "warning";
            case "slow": return "success";
            default: return "default";
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (String(difficulty || "").toLowerCase()) {
            case "beginner": return "success";
            case "intermediate": return "warning";
            case "advanced": return "danger";
            default: return "default";
        }
    };

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

            {joinError && (
                <div className="mx-4 mt-4 max-w-6xl md:mx-auto rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {joinError}
                </div>
            )}

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
                    <AnimatePresence>
                        {roomsLoading ? (
                            <motion.div variants={itemVariants}>
                                <Card className="text-center py-12">
                                    <p className="text-text/70">Loading rooms…</p>
                                </Card>
                            </motion.div>
                        ) : filteredRooms.length > 0 ? (
                            filteredRooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    layout
                                >
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Room Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-text mb-2">
                                                            {room.name}
                                                        </h3>
                                                        <p className="text-text/70 text-sm">
                                                            {room.description}
                                                        </p>
                                                    </div>
                                                    <Avatar name={room.avatar} size="md" />
                                                </div>

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {room.tags.map((tag) => (
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

                                                {/* Room Stats */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                                                {/* Progress */}
                                                <div className="mt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-text/70">Progress</span>
                                                        <span className="text-sm font-medium text-text">{room.progress}% Started</span>
                                                    </div>
                                                    <ProgressBar value={room.progress} variant="primary" />
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="flex flex-col justify-center gap-3">
                                                <Button
                                                    onClick={() => handleRoomPreview(room)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Eye size={16} />
                                                    Preview Room
                                                </Button>
                                                <div className="text-center">
                                                    <span className="text-xs text-text/60">
                                                        {room.maxMembers - room.members} spots left
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
                </div>
            </motion.div>

            {/* Room Preview Modal */}
            <RoomPreview
                isOpen={showPreviewModal}
                room={selectedRoom}
                onClose={() => setShowPreviewModal(false)}
                onJoin={handleJoinRoom}
                joining={joiningRoomId === selectedRoom?.id}
                mode="view"
            />
            {joinError && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {joinError}
                </div>
            )}
        </div>
    );
};

export default JoinRoom;
