import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, TrendingUp, ArrowRight, Clock, Loader2, Star, Sparkles, CheckCircle, ArrowLeft } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { roomService } from "../../../services/roomService";
import { Button, Badge } from "../../elements/elements";

const RoomsSection = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkingLimit, setCheckingLimit] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [roomLimitData, setRoomLimitData] = useState(null);

    const handleCreateClick = async (e) => {
        if (e) e.preventDefault();
        try {
            setCheckingLimit(true);
            const res = await roomService.checkRoomLimit();
            if (res.success && res.data) {
                if (!res.data.canCreate) {
                    setRoomLimitData(res.data);
                    setShowLimitModal(true);
                } else {
                    navigate('/createroom');
                }
            } else {
                navigate('/createroom');
            }
        } catch (err) {
            console.error('Failed to check limit:', err);
            navigate('/createroom');
        } finally {
            setCheckingLimit(false);
        }
    };

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await roomService.getMyRooms();
                if (response.success && response.rooms) {
                    setRooms(response.rooms);
                } else {
                    setRooms([]);
                }
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setError('Failed to load rooms');
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
        
        // Listen for room list changes
        const handleRoomListChanged = () => {
            console.log('Room list changed, refreshing...');
            fetchRooms();
        };
        window.addEventListener('roomListChanged', handleRoomListChanged);
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchRooms, 30000);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('roomListChanged', handleRoomListChanged);
        };
    }, []);




    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0
            }
        }
    };




    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    return (
        <div className="w-full px-4 md:pl-24 pr-4 mt-8 mb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-12"
            >
                <h2 className="text-4xl font-bold text-text mb-4">
                    <span className="text-primary">Rooms</span>
                </h2>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-text/60">Loading rooms...</span>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center py-20">
                    <p className="text-red-500">{error}</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap gap-6 justify-center md:justify-start"
                >
                    {rooms.length === 0 ? (
                        <div className="w-full text-center py-20">
                            <p className="text-text/60 mb-4">You haven't joined any rooms yet</p>
                            <div onClick={handleCreateClick}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={checkingLimit}
                                    className="px-6 py-3 bg-primary text-alt rounded-xl font-medium hover:shadow-lg transition-all"
                                >
                                    {checkingLimit ? "Checking..." : "Create Your First Room"}
                                </motion.button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {rooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    variants={cardVariants}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative overflow-hidden rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm hover:border-primary/50 transition-all duration-200 w-80 flex-shrink-0"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 opacity-5 group-hover:opacity-10 transition-opacity duration-200" />
                                    
                                    <div className="relative p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 font-medium">
                                                        {room.currentPhase || 'Phase 1'}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-text/10 text-text/70 border border-text/20">
                                                        {room.skillLevel ? room.skillLevel : 'Intermediate'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors duration-200">
                                                    {room.title}
                                                </h3>
                                                <p className="text-text/60 text-sm mt-1 mb-4 h-10 overflow-hidden text-ellipsis">
                                                    {room.currentMilestone || 'Master modern frontend development with React, JavaScript, and CSS'}
                                                </p>
                                            </div>
                                            
                                            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        </div>

                                        {/* Progress bar section */}
                                        <div className="mb-5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-text/80">Progress</span>
                                                <span className="text-sm font-bold text-text">{room.averageProgress ?? room.progressPercentage ?? 0}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-text/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${room.averageProgress ?? room.progressPercentage ?? 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats footer */}
                                        <div className="flex items-center justify-between mb-6 text-sm text-text/60">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                <span>Days Left</span>
                                                <span className="text-text font-semibold ml-1">
                                                    {(() => {
                                                        const start = new Date(room.startDate || room.createdAt);
                                                        const daysPassed = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
                                                        return Math.max(0, (room.expectedDurationDays || 30) - daysPassed);
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users size={14} />
                                                <span>Active Users</span>
                                                <span className="text-text font-semibold ml-1">{room.memberCount || 1}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <NavLink to={`/room/${room.id}`}>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.1 }}
                                                className="w-full py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30"
                                            >
                                                Continue Learning
                                                <ArrowRight size={16} />
                                            </motion.button>
                                        </NavLink>
                                    </div>

                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-2xl transition-all duration-200 pointer-events-none" />
                                </motion.div>
                            ))}

                            {/* Create Room Card */}
                            <motion.div
                                variants={cardVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className={`group relative overflow-hidden rounded-2xl border-2 border-dashed border-text/30 hover:border-primary/50 bg-background/30 backdrop-blur-sm transition-all duration-200 cursor-pointer w-80 flex-shrink-0 ${checkingLimit ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={handleCreateClick}
                            >
                                <div className="block h-full">
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ duration: 0.1 }}
                                            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-200"
                                        >
                                            <span className="text-2xl text-primary">+</span>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors duration-200">
                                            {checkingLimit ? "Checking..." : "Create New Room"}
                                        </h3>
                                        <p className="text-text/60 text-sm">
                                            Start your own learning journey and invite others to join
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            )}

            {/* Room Limit Modal */}
            <AnimatePresence>
                {showLimitModal && roomLimitData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setShowLimitModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl p-8 text-center border border-text/10"
                        >
                            <div className="mb-6 w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                                <Star className="w-10 h-10 text-primary" />
                            </div>

                            <h2 className="text-3xl font-bold text-text mb-4">Room Limit Reached</h2>

                            <p className="text-text/70 text-lg mb-2">
                                You've reached the maximum of <span className="font-bold text-primary">{roomLimitData.maxRooms} rooms</span> on the free plan.
                            </p>
                            <p className="text-text/60 mb-8">
                                Currently in {roomLimitData.currentRooms} active room{roomLimitData.currentRooms !== 1 ? 's' : ''}.
                            </p>

                            <div className="inline-block mb-8">
                                <Badge variant="warning" className="text-lg px-6 py-2">
                                    <Sparkles className="w-5 h-5 mr-2 inline" />
                                    Learncurve Pro - Coming Soon
                                </Badge>
                            </div>

                            <div className="bg-background/50 rounded-xl p-6 mb-8 border border-text/5 text-left">
                                <h3 className="font-semibold text-text mb-4">Learncurve Pro will include:</h3>
                                <ul className="space-y-3 text-text/70">
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

                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLimitModal(false)}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};




export default RoomsSection;
