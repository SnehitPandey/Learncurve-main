import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Book, HomeIcon, LogOut, Settings, User, Plus, UserPlus, X
} from "lucide-react";
import ThemeToggle from "../../elements/toggletheme";
import NotificationCenter from "./NotificationCenter";
import { roomService } from "../../../services/roomService";
import { authService } from "../../../services/authService";

export default function AppBottomBar() {
    const navigate = useNavigate();
    const [roomsModalOpen, setRoomsModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        if (roomsModalOpen || profileModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [roomsModalOpen, profileModalOpen]);

    // Fetch user's rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await roomService.getMyRooms();
                if (response.success && response.rooms) {
                    setRooms(response.rooms);
                } else {
                    setRooms([]);
                }
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setRooms([]);
            }
        };

        fetchRooms();
        
        // Refresh rooms every 30 seconds
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, []);

    const modalVariants = {
        closed: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } },
        open: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    };

    const overlayVariants = {
        closed: { opacity: 0, transition: { duration: 0.2 } },
        open: { opacity: 1, transition: { duration: 0.3 } },
    };

    const roomItemVariants = {
        closed: { x: -20, opacity: 0 },
        open: (i) => ({
            x: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.3 },
        }),
    };

    const handleLogout = async () => {
        try {
            // Use authService.logout() to properly clear tokens and user-specific data
            await authService.logout();
            // Navigate to landing page
            navigate("/");
            // Reload to clear any remaining state
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
            // Even if API call fails, clear local data and redirect
            navigate("/");
            window.location.reload();
        }
    };

    return (
        <>
            {/* Bottom Navigation Bar - Original Structure */}
            <div className="fixed bottom-0 w-[100vw] z-50">
                <div className="bg-background/90 backdrop-blur-md border border-text/20 px-6 py-3 shadow-lg h-16">
                    <div className="flex items-center justify-around">
                        {/* Home */}
                        <NavLink to="/home">
                            {({ isActive }) => (
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? "text-primary" : "text-text/70"}`}>
                                        <HomeIcon size={24} />
                                    </div>
                                </div>
                            )}
                        </NavLink>

                        {/* Notifications */}
                        <NotificationCenter />

                        {/* Rooms Button */}
                        <button
                            onClick={() => setRoomsModalOpen(true)}
                            className="flex items-center justify-center w-12 h-12 rounded-xl"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg text-text/70">
                                <Book size={24} />
                            </div>
                        </button>

                        {/* Profile Button */}
                        <button
                            onClick={() => setProfileModalOpen(true)}
                            className="flex items-center justify-center w-12 h-12 rounded-xl"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg text-text/70">
                                <User size={24} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Rooms Modal/Sheet with New Room and Join Room Options */}
            <AnimatePresence>
                {roomsModalOpen && (
                    <>
                        <motion.div
                            variants={overlayVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                            onClick={() => setRoomsModalOpen(false)}
                        />

                        <motion.div
                            variants={modalVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="fixed bottom-4 left-4 right-4 z-[70] max-h-[70vh]"
                        >
                            <div className="bg-background/95 backdrop-blur-md border border-text/20 rounded-2xl shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-text/10">
                                    <h2 className="text-lg font-semibold text-text">Your Rooms</h2>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setRoomsModalOpen(false)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg text-text/70 hover:text-text hover:bg-text/10 transition-colors"
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                <div className="max-h-[50vh] overflow-y-auto p-4">
                                    <div className="space-y-3">
                                        {/* Existing Rooms */}
                                        {rooms.map((room, index) => (
                                            <motion.button
                                                key={room.id}
                                                custom={index + 1}
                                                variants={roomItemVariants}
                                                initial="closed"
                                                animate="open"
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setRoomsModalOpen(false);
                                                    navigate(`/room/${room.id}`);
                                                }}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg border border-text/20 text-text hover:border-text/40 hover:bg-text/5 transition-colors"
                                            >
                                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-text/10">
                                                    <Book size={20} className="text-text/70" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h3 className="font-medium">{room.title}</h3>
                                                    <p className="text-sm text-text/70">{room.memberCount} {room.memberCount === 1 ? 'member' : 'members'} • {room.status}</p>
                                                </div>
                                            </motion.button>
                                        ))}
                                        
                                        {/* Divider */}
                                        <div className="border-t border-text/10 my-4"></div>
                                        
                                        {/* New Room and Join Room Options */}
                                        <motion.button
                                            custom={rooms.length + 1}
                                            variants={roomItemVariants}
                                            initial="closed"
                                            animate="open"
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setRoomsModalOpen(false);
                                                navigate("/createroom");
                                            }}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                                                <Plus size={20} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="font-medium">Create New Room</h3>
                                                <p className="text-sm text-primary/70">
                                                    Start a new learning session
                                                </p>
                                            </div>
                                        </motion.button>

                                        <motion.button
                                            custom={rooms.length + 2}
                                            variants={roomItemVariants}
                                            initial="closed"
                                            animate="open"
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setRoomsModalOpen(false);
                                                navigate("/joinroom");
                                            }}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                                                <UserPlus size={20} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="font-medium">Join Room</h3>
                                                <p className="text-sm text-primary/70">
                                                    Find and join existing rooms
                                                </p>
                                            </div>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Profile Modal/Sheet - Unchanged */}
            <AnimatePresence>
                {profileModalOpen && (
                    <>
                        <motion.div
                            variants={overlayVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                            onClick={() => setProfileModalOpen(false)}
                        />
                        <motion.div
                            variants={modalVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="fixed bottom-4 left-4 right-4 z-[70] max-h-[60vh]"
                        >
                            <div className="bg-background/95 backdrop-blur-md border border-text/20 rounded-2xl shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-text/10">
                                    <h2 className="text-lg font-semibold text-text">Profile & Settings</h2>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setProfileModalOpen(false)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg text-text/70 hover:text-text hover:bg-text/10 transition-colors"
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>
                                <div className="p-4 flex flex-col gap-4">
                                    <ThemeToggle />
                                    <div className="space-y-2">
                                        {[
                                            { icon: User, text: "Profile", action: () => navigate("/profile") },
                                            { icon: Settings, text: "Settings", action: () => navigate("/settings") },
                                            { icon: LogOut, text: "Logout", action: handleLogout, border: true }
                                        ].map((item, i) => (
                                            <motion.button
                                                key={item.text}
                                                custom={i}
                                                initial="closed"
                                                animate="open"
                                                whileHover={{
                                                    x: 5
                                                }}
                                                onClick={() => {
                                                    setProfileModalOpen(false);
                                                    item.action();
                                                }}
                                                className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-text/80 hover:text-text hover:bg-white/5 transition-colors
                                                    ${item.border ? 'border-t border-text/10 mt-2 pt-2' : ''}`}
                                            >
                                                <item.icon size={16} />
                                                {item.text}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
