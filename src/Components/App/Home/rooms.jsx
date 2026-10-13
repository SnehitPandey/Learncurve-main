import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, ArrowRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getMyRooms } from "../../../api/rooms";

// Hoisted: these were rebuilt on every render.
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

const RoomsSection = () => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchRooms() {
            try {
                // ENROLLED ROOMS ONLY.
                //
                // This used to merge `listRooms()` (the public discovery feed) into
                // the dashboard, so a learner signed in to an empty account saw
                // six rooms they had never joined — presented exactly like their
                // own, with a progress bar. Discovery has its own page ("Find
                // Rooms"); the dashboard is "where I am", not "what exists".
                const myRes = await getMyRooms();
                if (cancelled) return;
                const byId = new Map();
                // Both list endpoints now return `daysRemaining` (computed server-side
                // from the room's start date and timeframe), so this normally
                // returns a real number. The fallbacks are for older cached
                // payloads, and null — not a hardcoded 30 — so an unknown value
                // renders as "—" rather than a fabricated duration. `(x || 30)`
                // also turned a genuine 0 (room finished) into 30.
                const resolveDays = (r) => {
                    if (typeof r?.daysRemaining === "number") return r.daysRemaining;
                    if (typeof r?.durationWeeks === "number" && r.durationWeeks > 0) return r.durationWeeks * 7;
                    return null;
                };
                const resolveMembers = (r) => {
                    if (typeof r?.memberCount === "number") return r.memberCount;
                    if (Array.isArray(r?.members)) return r.members.length;
                    return 0;
                };
                if (Array.isArray(myRes?.rooms)) {
                    myRes.rooms.forEach(r => {
                        const id = r.id || r._id;
                        if (!id || byId.has(id)) return;
                        byId.set(id, {
                            id,
                            name: r.name || r.title,
                            description: r.description || "",
                            category: r.skill || "Skill Track",
                            difficulty: r.difficulty || "All Levels",
                            daysRemaining: resolveDays(r),
                            // my-rooms returns real user progress
                            completionRate: Math.round(r.progress ?? r.completionRate ?? 0),
                            activeUsers: resolveMembers(r),
                            isUserJoined: true,
                        });
                    });
                }
                const mapped = Array.from(byId.values()).slice(0, 6).map((room, idx) => ({
                    ...room,
                    color: idx % 2 === 0 ? "from-blue-500 to-cyan-500" : "from-purple-500 to-pink-500"
                }));
                setRooms(mapped);
            } catch (err) {
                console.warn("[Rooms] Error fetching rooms:", err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchRooms();
        return () => { cancelled = true; };
    }, []);

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

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-6 justify-center md:justify-start"
            >
                {isLoading && rooms.length === 0 && (
                    <p className="w-full text-center text-text/60 text-sm">Loading rooms...</p>
                )}
                {!isLoading && rooms.length === 0 && (
                    // Enrolled rooms only, so this is genuinely an empty account —
                    // not "the API is down". Discovery lives on its own page.
                    <p className="w-full text-center text-text/60 text-sm">
                        You have not joined any rooms yet. Create one, or find one to join from Find Rooms.
                    </p>
                )}
                {rooms.map((room) => (
                    <motion.div
                        key={room.id}
                        variants={cardVariants}
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                        className="group relative overflow-hidden rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm hover:border-primary/50 transition-all duration-200 w-80 flex-shrink-0"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${room.color} opacity-5 group-hover:opacity-10 transition-opacity duration-200`} />
                        
                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                                            {room.category}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-full bg-text/10 text-text/70">
                                            {room.difficulty}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors duration-200">
                                        {room.name}
                                    </h3>
                                    <p className="text-text/60 text-sm mt-2 line-clamp-2">
                                        {room.description || "No description provided for this room yet."}
                                    </p>
                                </div>
                                
                                {room.isUserJoined && (
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                )}
                            </div>




                            {/* Progress Section */}
                            {room.isUserJoined && (
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-text/70">Progress</span>
                                        <span className="text-sm font-medium text-text">{room.completionRate}%</span>
                                    </div>
                                    <div className="w-full bg-text/10 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${room.completionRate}%` }}
                                            transition={{ duration: 0.1, ease: "easeOut" }}
                                            className={`h-2 rounded-full bg-gradient-to-r ${room.color}`}
                                        />
                                    </div>
                                </div>
                            )}




                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-text/50" />
                                    <div>
                                        <p className="text-xs text-text/50">Days Left</p>
                                        {/* Both room endpoints now return daysRemaining, so
                                            this is a real number rather than the permanent
                                            "—" placeholder. Still guarded: a room whose
                                            schedule genuinely cannot be resolved shows
                                            "—", not a fabricated 30. */}
                                        <p className="text-sm font-medium text-text">
                                            {room.daysRemaining ?? "—"}
                                            {room.daysRemaining === 0 ? " (finished)" : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-text/50" />
                                    <div>
                                        <p className="text-xs text-text/50">Active Users</p>
                                        <p className="text-sm font-medium text-text">{room.activeUsers}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <NavLink to={`/room/${room.id}`}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.1 }}
                                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                        room.isUserJoined
                                            ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                                            : 'bg-gradient-to-r from-primary to-primary/80 text-alt hover:shadow-lg'
                                    }`}
                                    style={{
                                        boxShadow: !room.isUserJoined ? '0 0 20px rgba(var(--color-primary-rgb), 0.3)' : 'none'
                                    }}
                                >
                                    {room.isUserJoined ? (
                                        <>
                                            Continue Learning
                                            <ArrowRight size={16} />
                                        </>
                                    ) : (
                                        <>
                                            Join Room
                                            <ArrowRight size={16} />
                                        </>
                                    )}
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
                    className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-text/30 hover:border-primary/50 bg-background/30 backdrop-blur-sm transition-all duration-200 cursor-pointer w-80 flex-shrink-0"
                >
                    <NavLink to="/createroom" className="block h-full">
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.1 }}
                                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-200"
                            >
                                <span className="text-2xl text-primary">+</span>
                            </motion.div>
                            <h3 className="text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors duration-200">
                                Create New Room
                            </h3>
                            <p className="text-text/60 text-sm">
                                Start your own learning journey and invite others to join
                            </p>
                        </div>
                    </NavLink>
                </motion.div>
            </motion.div>
        </div>
    );
};




export default RoomsSection;
