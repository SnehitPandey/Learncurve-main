import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../../elements/toggletheme";
import { Bird, Book, HomeIcon, LogOut, Settings, User, Plus, UserPlus } from "lucide-react";
import { getMyRooms } from "../../../api/rooms";
import { getUserProfileAndSync } from "../../../api/users";
import { clearAuth } from "../../../api/client";
import { disconnectSocket } from "../../../sockets/socketClient";
import { getCurrentUser } from "../../../utils/user";

const buttonVariants = {
    inactive: {
        scale: 1,
        boxShadow: "0 0 0px rgba(var(--color-primary-rgb), 0)",
        transition: { duration: 0.3, ease: "easeInOut" }
    },
    active: {
        scale: 1.05,
        boxShadow: "0 0 15px rgba(var(--color-primary-rgb), 0.6)",
        transition: { duration: 0.3, ease: "easeInOut" }
    },
    hover: {
        scale: 1.1,
        transition: { duration: 0.2, ease: "easeOut" }
    }
};

// Hoisted: defined inside the component body this was a new component type on
// every render, which made the rail visibly flicker.
const AnimatedNavLink = ({ to, children, isSpecial = false }) => (
    <NavLink to={to}>
        {({ isActive }) => (
            <motion.div
                variants={buttonVariants}
                initial="inactive"
                animate={isActive ? "active" : "inactive"}
                whileHover="hover"
                className={`flex items-center justify-center w-10 h-10 rounded-lg border cursor-pointer ${
                    isActive
                        ? "border-primary bg-primary/20 text-primary"
                        : isSpecial
                        ? "border-text/50 text-text hover:border-text hover:bg-text/10"
                        : "border-text/50 text-text hover:border-text hover:bg-text/10"
                }`}
            >
                {children}
            </motion.div>
        )}
    </NavLink>
);

export default function AppSidebar() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [roomMenuOpen, setRoomMenuOpen] = useState(false);
    const [roomButtonPosition, setRoomButtonPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const roomMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
            if (roomMenuRef.current && !roomMenuRef.current.contains(e.target)) {
                setRoomMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update room button position when menu opens
    useEffect(() => {
        if (roomMenuOpen && roomMenuRef.current) {
            const rect = roomMenuRef.current.getBoundingClientRect();
            setRoomButtonPosition({
                top: rect.top,
                left: rect.right + 20
            });
        }
    }, [roomMenuOpen]);

    const menuVariants = {
        closed: {
            opacity: 0,
            scale: 0.95,
            y: 10,
            transition: { duration: 0.2, ease: "easeIn" }
        },
        open: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    const menuItemVariants = {
        closed: { x: -10, opacity: 0 },
        open: (i) => ({
            x: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.2 }
        })
    };

    const profileButtonVariants = {
        closed: { rotate: 0 },
        open: { rotate: 360, transition: { duration: 0.1 } }
    };

    const roomButtonVariants = {
        closed: { rotate: 0 },
        open: { rotate: 45, transition: { duration: 0.3 } }
    };

    const handleLogout = () => {
        clearAuth();
        // Drop the socket too — otherwise the authenticated connection stays
        // open after logout.
        disconnectSocket();
        navigate('/');
    };

    const handleRoomMenuToggle = () => {
        setRoomMenuOpen(!roomMenuOpen);
    };

    const [rooms, setRooms] = useState([]);
    // The learner's own photo for the profile button. Read from the session once
    // and refreshed when the sidebar mounts, because a Settings upload writes the
    // new URL to localStorage and this component is long-lived.
    const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

    useEffect(() => {
        setCurrentUser(getCurrentUser());
    }, [menuOpen]);

    // Keep currentUser synchronized across all tabs and components
    useEffect(() => {
        const handleStorage = () => {
            setCurrentUser(getCurrentUser());
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // Re-read the profile from the server once on mount.
    //
    // The blob in localStorage is written at SIGN-IN and used to be the only
    // source, so any photo uploaded afterwards — or any sign-in whose response
    // lacked `avatarUrl` — left this button blank for the rest of the session.
    // Refreshing here is what makes the sidebar agree with the Settings page.
    useEffect(() => {
        if (!localStorage.getItem("token")) return undefined;

        let cancelled = false;
        getUserProfileAndSync()
            .then(() => {
                // `syncSessionUser` inside the fetch re-broadcasts "storage", but
                // set it directly too so this mount never depends on that listener.
                if (!cancelled) setCurrentUser(getCurrentUser());
            })
            .catch(() => {
                // Offline / 401 — keep whatever the blob already holds rather than
                // blanking a working avatar on a transient failure.
            });

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        // The sidebar unmounts whenever `isMobile` flips at the 720px
        // breakpoint, so guard every setState-after-await.
        let cancelled = false;
        const mapRooms = (list) => (Array.isArray(list) ? list : [])
            .map(r => ({ id: r?.id || r?._id, name: r?.name || r?.title, icon: Book }))
            .filter(r => Boolean(r.id)); // a malformed room would link to /room/undefined

        // YOUR rooms, or none.
        //
        // This used to fall back to `listRooms({ limit: 4 })` — the public
        // discovery feed — whenever the learner was in no rooms. That put rooms
        // belonging to other people into the navigation sidebar, where every icon
        // looks like a shortcut to something you are enrolled in. It was most
        // glaring on another user's profile, where the sidebar beside their
        // details listed rooms that had nothing to do with them.
        //
        // Discovery has its own page. An empty sidebar is honest.
        getMyRooms()
            .then(res => {
                if (cancelled) return;
                setRooms(mapRooms(res?.rooms));
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return (
        <aside className="fixed left-4 top-4 bottom-4 z-50">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full w-16 rounded-2xl border border-text/20 bg-background/40 backdrop-blur-md flex flex-col items-center py-4"
            >
                <div className="flex flex-col items-center gap-4">
                    <NavLink to="/">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: -10 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center w-10 h-10 rounded-xl text-text hover:text-primary transition-colors duration-200"
                        >
                            <Bird size={20} />
                        </motion.div>
                    </NavLink>

                    <AnimatedNavLink to="/home">
                        <HomeIcon size={20} />
                    </AnimatedNavLink>
                </div>

                <div className="flex-1 flex flex-col items-center my-4 min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar py-2 pr-2">
                        <div className="flex flex-col items-center gap-3 pl-2">
                            {rooms.map((room) => (
                                <AnimatedNavLink key={room.id} to={`/room/${room.id}`}>
                                    <Book size={20} />
                                </AnimatedNavLink>
                            ))}
                            
                            {/* Room Menu Button */}
                            <motion.button
                                ref={roomMenuRef}
                                variants={roomButtonVariants}
                                animate={roomMenuOpen ? "open" : "closed"}
                                whileHover={{ scale: 1.0 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRoomMenuToggle}
                                className="flex items-center justify-center w-10 h-10 rounded-lg border border-text/50 hover:border-text hover:bg-text/10 text-text transition-colors duration-200"
                            >
                                <Plus size={20} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <ThemeToggle />

                    <div className="relative" ref={menuRef}>
                        <motion.button
                            variants={profileButtonVariants}
                            animate={menuOpen ? "open" : "closed"}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center justify-center w-12 h-12 rounded-full border border-text/50 hover:border-text hover:bg-text/10 text-text transition-colors duration-200 overflow-hidden"
                        >
                            {/* The learner's own photo, not a generic person glyph —
                                this button is on screen for the entire session. */}
                            {currentUser.avatarUrl ? (
                                <img
                                    src={currentUser.avatarUrl}
                                    alt={currentUser.name}
                                    referrerPolicy="no-referrer"
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (img.dataset.fellBack) return;
                                        img.dataset.fellBack = "1";
                                        setCurrentUser(prev => ({ ...prev, avatarUrl: "" }));
                                    }}
                                />
                            ) : currentUser.initials && currentUser.initials !== "?" ? (
                                <span className="font-bold text-sm tracking-tight">{currentUser.initials}</span>
                            ) : (
                                <User size={20} />
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    variants={menuVariants}
                                    initial="closed"
                                    animate="open"
                                    exit="closed"
                                    className="absolute left-16 bottom-0 w-44 rounded-lg border border-text/20 bg-background/80 backdrop-blur-md shadow-xl overflow-hidden"
                                >
                                    {[
                                        { icon: User, text: "Profile", action: () => navigate("/profile") },
                                        { icon: Settings, text: "Settings", action: () => navigate("/settings") },
                                        { icon: LogOut, text: "Logout", action: handleLogout, border: true }
                                    ].map((item, i) => (
                                        <motion.button
                                            key={item.text}
                                            custom={i}
                                            variants={menuItemVariants}
                                            initial="closed"
                                            animate="open"
                                            whileHover={{ 
                                                x: 5,
                                                backgroundColor: "rgba(var(--color-text-rgb), 0.1)"
                                            }}
                                            onClick={() => {
                                                setMenuOpen(false);
                                                item.action();
                                            }}
                                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-text/80 hover:text-text transition-colors ${
                                                item.border ? 'border-t border-text/10' : ''
                                            }`}
                                        >
                                            <item.icon size={16} />
                                            {item.text}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {roomMenuOpen && (
                    <motion.div
                        variants={menuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="fixed w-44 rounded-lg border border-text/20 bg-background/80 backdrop-blur-md shadow-xl overflow-hidden z-[100]"
                        style={{
                            top: `${roomButtonPosition.top}px`,
                            left: `${roomButtonPosition.left}px`
                        }}
                    >
                        {[
                            { 
                                icon: Plus, 
                                text: "New Room", 
                                action: () => navigate("/createroom") 
                            },
                            { 
                                icon: UserPlus, 
                                text: "Join Room", 
                                action: () => navigate("/joinroom") 
                            }
                        ].map((item, i) => (
                            <motion.button
                                key={item.text}
                                custom={i}
                                variants={menuItemVariants}
                                initial="closed"
                                animate="open"
                                whileHover={{ 
                                    x: 5,
                                    backgroundColor: "rgba(var(--color-text-rgb), 0.1)"
                                }}
                                onClick={() => {
                                    setRoomMenuOpen(false);
                                    item.action();
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text/80 hover:text-text transition-colors"
                            >
                                <item.icon size={16} />
                                {item.text}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(var(--color-text-rgb), 0.3) transparent;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--color-text-rgb), 0.3);
                    border-radius: 3px;
                    transition: background 0.2s ease;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--color-text-rgb), 0.5);
                }
                
                .custom-scrollbar::-webkit-scrollbar-corner {
                    background: transparent;
                }
            `}</style>
        </aside>
    );
}
