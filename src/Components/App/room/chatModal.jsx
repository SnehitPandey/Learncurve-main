// Components/chat/ChatModal.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Smile, Paperclip, Minimize2, Maximize2 } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { getRoomMessages, sendRoomMessage } from "../../../api/chat";
import { getSocket } from "../../../sockets/socketClient";

// Local ids and the merge rules now live in utils/chatMessages so the modal and
// the room overlay cannot drift — the overlay previously had its own id scheme
// and never reconciled at all, which is how one sent message became three rows.
import { confirmLocalMessage, createLocalId, reconcileMessage } from "../../../utils/chatMessages";
const ChatModal = ({ isOpen, onClose, roomName = "Study Room", roomId, onNewMessage, onMessagesRead }) => {
    // Held in refs so the socket effect can call the latest callbacks without
    // taking them as dependencies (which would re-join the room on every
    // parent render whenever the parent passes a fresh closure).
    const onNewMessageRef = useRef(onNewMessage);
    const onMessagesReadRef = useRef(onMessagesRead);
    useEffect(() => {
        onNewMessageRef.current = onNewMessage;
        onMessagesReadRef.current = onMessagesRead;
    }, [onNewMessage, onMessagesRead]);

    const [message, setMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [size, setSize] = useState({ width: 600, height: 700 });
    const [isResizing, setIsResizing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(1);

    
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const chatRef = useRef(null);
    const resizeOriginRef = useRef(null);

    // Dynamic max sizes based on viewport
    const getMaxSizes = useCallback(() => ({
        maxWidth: window.innerWidth - 40,
        maxHeight: window.innerHeight - 40
    }), []);

    // Sample messages
    const [messages, setMessages] = useState([]);
    // True only for the very first fetch; afterwards the optimistic list is
    // already on screen, so a spinner would be a regression.
    const [messagesLoading, setMessagesLoading] = useState(true);

    // Fetch messages from backend — backend returns {userName,content,createdAt}
    useEffect(() => {
        // The modal component is always mounted by room.jsx and only returns null
        // after its hooks have run. Without this guard the socket would join the
        // room, register listeners and start polling even though chat was closed.
        if (!isOpen || !roomId) return undefined;

        let isMounted = true;
        const getCurrentUserId = () => {
            try {
                const raw = localStorage.getItem("user");
                if (raw) { const u = JSON.parse(raw); return u.id || u._id || null; }
            } catch {
                // Corrupt/absent localStorage — treat as signed out.
            }
            return null;
        };
        const fetchMessages = async () => {
            if (!isOpen || !roomId) return;
            setMessagesLoading(true);
            try {
                const res = await getRoomMessages(roomId);
                const backendMsgs = res?.messages || res?.data;
                if (Array.isArray(backendMsgs) && isMounted) {
                    const myId = getCurrentUserId();
                    const formatted = backendMsgs.map(m => {
                        const name = m.userName || m.sender_name || "Peer";
                        const isMine = (m.is_current_user !== undefined)
                            ? !!m.is_current_user
                            : (myId ? (m.userId === myId || m.user_id === myId) : false);
                        return {
                            id: m._id || m.id,
                            user: isMine ? "You" : name,
                            avatar: (isMine ? "YOU" : String(name)).slice(0, 2).toUpperCase(),
                            // The API has always returned `userAvatar`; it was never
                            // read, so every chat bubble fell back to initials.
                            avatarUrl: m.userAvatar || m.avatar || m.avatarUrl || "",
                            message: m.content,
                            timestamp: (m.createdAt || m.created_at) ? new Date(m.createdAt || m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
                            isCurrentUser: !!isMine
                        };
                    });
                    if (isMounted) {
                        // Keep not-yet-confirmed optimistic messages so a poll cannot
                        // make a just-sent message blink out of existence.
                        setMessages(prev => {
                            const stillPending = prev.filter(m =>
                                m.pending && !formatted.some(f => f.isCurrentUser && f.message === m.message)
                            );
                            return [...formatted, ...stillPending];
                        });
                        if (onMessagesReadRef.current) onMessagesReadRef.current();
                    }
                }
            } catch (err) {
                console.warn("Chat history unavailable:", err?.message);
            } finally {
                if (isMounted) setMessagesLoading(false);
            }
        };

        fetchMessages();

        // Socket.IO listeners only. Room MEMBERSHIP is owned by the room page
        // (`useRoomSocket` in Pages/App/room.jsx) for the whole visit, so the
        // Kanban board and presence are live too — and so the join survives a
        // reconnect. This modal deliberately does not join or leave: doing so
        // would mean realtime presence started and stopped with the chat panel,
        // and closing the modal would un-join every other consumer in the room.
        const socket = getSocket();

        const handleNewMessage = (msg) => {
            if (msg && (msg.roomId === roomId || !msg.roomId)) {
                const myId = getCurrentUserId();
                const isMine = (myId && (msg.userId === myId || msg.user_id === myId));
                const formatted = {
                    id: msg.id || msg._id || createLocalId(),
                    user: isMine ? "You" : (msg.userName || "Peer"),
                    avatar: (isMine ? "YOU" : String(msg.userName || "PE")).slice(0, 2).toUpperCase(),
                    avatarUrl: msg.userAvatar || msg.avatar || msg.avatarUrl || "",
                    message: msg.content,
                    timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
                    isCurrentUser: !!isMine
                };
                // Dedupes on server id AND collapses an unconfirmed local copy of
                // the same message. Checking the id alone was not enough: the
                // optimistic row carries a `local-…` id, so a confirmed copy
                // looked like a brand new message and the sender saw theirs twice.
                setMessages(prev => reconcileMessage(prev, formatted));
                if (onNewMessageRef.current) onNewMessageRef.current(formatted);
            }
        };

        const handlePresence = (data) => {
            if (data && data.roomId === roomId && Array.isArray(data.onlineUserIds)) {
                setOnlineCount(Math.max(1, data.onlineUserIds.length));
            }
        };

        socket.on("new_message", handleNewMessage);
        socket.on("user_presence", handlePresence);

        const poll = setInterval(fetchMessages, 15000);
        return () => {
            isMounted = false;
            clearInterval(poll);
            socket.off("new_message", handleNewMessage);
            socket.off("user_presence", handlePresence);
        };
    }, [isOpen, roomId]);


    // Auto-resize textarea function
    const handleTextareaChange = useCallback((e) => {
        const textarea = e.target;
        setMessage(textarea.value);
        
        // Reset height to auto to get the actual scroll height
        textarea.style.height = 'auto';
        
        // If content fits within max height, expand the textarea
        if (textarea.scrollHeight <= 120) {
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        } else {
            // If content exceeds max height, set to max and show scrollbar
            textarea.style.height = '120px';
            textarea.style.overflowY = 'auto';
        }
    }, []);

    // Auto-resize on message change (for emoji insertion)
    useEffect(() => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            
            if (textarea.scrollHeight <= 120) {
                textarea.style.height = textarea.scrollHeight + 'px';
                textarea.style.overflowY = 'hidden';
            } else {
                textarea.style.height = '120px';
                textarea.style.overflowY = 'auto';
            }
        }
    }, [message]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update max sizes when window resizes
    useEffect(() => {
        const handleResize = () => {
            const { maxWidth, maxHeight } = getMaxSizes();
            
            setSize(prevSize => ({
                width: Math.min(prevSize.width, maxWidth),
                height: Math.min(prevSize.height, maxHeight)
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [getMaxSizes]);

    // Resize functionality with max size constraints.
    // mousedown only records the drag origin; the document listeners live in an
    // effect keyed on isResizing so unmounting mid-drag always removes them.
    const handleMouseDown = useCallback((e, direction) => {
        e.preventDefault();
        setIsResizing(true);
        resizeOriginRef.current = {
            direction,
            startX: e.clientX,
            startY: e.clientY,
            width: size.width,
            height: size.height,
        };
    }, [size]);

    useEffect(() => {
        if (!isResizing) return undefined;

        const { maxWidth, maxHeight } = getMaxSizes();

        const handleMouseMove = (e) => {
            const origin = resizeOriginRef.current;
            if (!origin) return;

            const deltaX = e.clientX - origin.startX;
            const deltaY = e.clientY - origin.startY;
            const { direction } = origin;

            let newWidth = origin.width;
            let newHeight = origin.height;

            if (direction.includes('right')) {
                newWidth = Math.max(400, Math.min(origin.width + deltaX, maxWidth));
            }
            if (direction.includes('left')) {
                newWidth = Math.max(400, Math.min(origin.width - deltaX, maxWidth));
            }
            if (direction.includes('bottom')) {
                newHeight = Math.max(300, Math.min(origin.height + deltaY, maxHeight));
            }
            if (direction.includes('top')) {
                newHeight = Math.max(300, Math.min(origin.height - deltaY, maxHeight));
            }

            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            resizeOriginRef.current = null;
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, getMaxSizes]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed) return;

        // Exactly ONE persistence channel: the REST endpoint. Emitting over the
        // socket as well would persist the same message twice (the socket handler
        // writes its own ChatMessage) and the echo would race the local id away.
        const localId = createLocalId();
        const newMessage = {
            id: localId,
            user: "You",
            avatar: "YO",
            message: trimmed,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCurrentUser: true,
            pending: true
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage("");
        setShowEmojiPicker(false);

        if (roomId) {
            try {
                const res = await sendRoomMessage(roomId, trimmed);
                const saved = res?.message;

                if (saved?.id || saved?._id) {
                    // Reconcile on the id the server assigned to THIS message, and
                    // collapse any copy the socket already delivered under it.
                    setMessages(prev => confirmLocalMessage(prev, localId, saved, trimmed));
                } else {
                    setMessages(prev => prev.map(m => (m.id === localId ? { ...m, pending: false } : m)));
                }
            } catch (err) {
                console.warn("Backend chat send note:", err?.message);
                setMessages(prev => prev.map(m => (m.id === localId ? { ...m, pending: false, failed: true } : m)));
            }
        }
        
        // Reset textarea height and overflow
        if (textareaRef.current) {
            textareaRef.current.style.height = '40px';
            textareaRef.current.style.overflowY = 'hidden';
        }
    };

    const onEmojiClick = (emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    // Handle Enter key to send message (Shift+Enter for new line)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 100 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.8, y: 100, transition: { duration: 0.2, ease: "easeIn" } }
    };

    const messageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    if (!isOpen) return null;

    const currentWidth = isMinimized ? 300 : size.width;
    const currentHeight = isMinimized ? 60 : size.height;

    return (
        <div className="fixed inset-0 z-[45] pointer-events-none">
            <motion.div
                key="chat-modal"
                ref={chatRef}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute pointer-events-auto"
                style={{
                    right: '20px',  
                    bottom: '20px', 
                    width: currentWidth,
                    height: currentHeight,
                    maxWidth: window.innerWidth - 40,
                    maxHeight: window.innerHeight - 40,
                    transition: isMinimized ? 'width 0.3s ease, height 0.3s ease' : 'none'
                }}
            >
                <div 
                    className="rounded-2xl overflow-hidden h-full flex flex-col relative"
                    style={{
                        backgroundColor: "var(--color-background)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(var(--color-text-rgb), 0.2)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 20px rgba(var(--color-primary-rgb), 0.1)",
                        transition: "background-color 0.3s ease, border-color 0.3s ease"
                    }}
                >
                    {/* Resize handles - Only when not minimized */}
                    {!isMinimized && (
                        <>
                            {/* Corner handles */}
                            <div
                                className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10"
                                onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                            />
                            <div
                                className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10"
                                onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                            />
                            <div
                                className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10"
                                onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                            />
                            <div
                                className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10"
                                onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                            />
                            
                            {/* Edge handles */}
                            <div
                                className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'top')}
                            />
                            <div
                                className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                            />
                            <div
                                className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'left')}
                            />
                            <div
                                className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'right')}
                            />
                        </>
                    )}

                    {/* Header */}
                    <div 
                        className="flex items-center justify-between p-4 cursor-pointer flex-shrink-0"
                        onClick={isMinimized ? toggleMinimize : undefined}
                        style={{
                            backgroundColor: "rgba(var(--color-background-rgb), 0.8)",
                            borderBottom: "1px solid rgba(var(--color-text-rgb), 0.1)",
                            transition: "background-color 0.3s ease"
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                    color: "var(--color-alt)"
                                }}
                            >
                                #
                            </div>
                            <div>
                                <h3 
                                    className="font-semibold text-sm"
                                    style={{ color: "var(--color-text)" }}
                                >
                                    {roomName}
                                </h3>
                                {!isMinimized && (
                                    <p 
                                        className="text-xs"
                                        style={{ color: "rgba(var(--color-text-rgb), 0.6)" }}
                                    >
                                        {onlineCount} {onlineCount === 1 ? "member" : "members"} online
                                    </p>
                                )}

                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMinimize();
                                }}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{
                                    color: "rgba(var(--color-text-rgb), 0.6)"
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = "var(--color-text)";
                                    e.target.style.backgroundColor = "rgba(var(--color-text-rgb), 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = "rgba(var(--color-text-rgb), 0.6)";
                                    e.target.style.backgroundColor = "transparent";
                                }}
                            >
                                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{
                                    color: "rgba(var(--color-text-rgb), 0.6)"
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = "var(--color-text)";
                                    e.target.style.backgroundColor = "rgba(var(--color-text-rgb), 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = "rgba(var(--color-text-rgb), 0.6)";
                                    e.target.style.backgroundColor = "transparent";
                                }}
                            >
                                <X size={16} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Messages Container - Only when not minimized */}
                    {!isMinimized && (
                        <div 
                            className="flex-1 overflow-y-auto p-4 space-y-3 relative min-h-0"
                            style={{
                                backgroundColor: "rgba(var(--color-background-rgb), 0.5)",
                                transition: "background-color 0.3s ease"
                            }}
                        >
                            {messagesLoading && messages.length === 0 && (
                                <p className="text-center text-xs text-text/40">Loading messages...</p>
                            )}
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        variants={messageVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="flex gap-3"
                                    >
                                        <div className="flex-shrink-0">
                                            {/* Real photo when the member has one,
                                                initials otherwise. Previously this
                                                always rendered `msg.avatar`, which is
                                                two letters of the name — so no chat
                                                participant ever had a picture. */}
                                            {msg.avatarUrl ? (
                                                <img
                                                    src={msg.avatarUrl}
                                                    alt={msg.user}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    onError={(e) => {
                                                        // A dead Supabase URL must not leave
                                                        // a broken image icon in the list.
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                                                    style={{
                                                        backgroundColor: msg.isCurrentUser
                                                            ? "var(--color-primary)"
                                                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                        color: "white"
                                                    }}
                                                >
                                                    {msg.avatar}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span 
                                                    className="text-xs font-medium"
                                                    style={{ color: "var(--color-text)" }}
                                                >
                                                    {msg.user}
                                                </span>
                                                <span 
                                                    className="text-xs"
                                                    style={{ color: "rgba(var(--color-text-rgb), 0.5)" }}
                                                >
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                            <div 
                                                className="text-sm break-words"
                                                style={{ color: "var(--color-text)" }}
                                            >
                                                {msg.message}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Input Area - Only when not minimized */}
                    {!isMinimized && (
                        <div 
                            className="p-4 relative flex-shrink-0"
                            style={{
                                backgroundColor: "rgba(var(--color-background-rgb), 0.8)",
                                borderTop: "1px solid rgba(var(--color-text-rgb), 0.1)",
                                transition: "background-color 0.3s ease"
                            }}
                        >
                            {/* Emoji Picker */}
                            <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div
                                        ref={emojiPickerRef}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full left-4 mb-2 z-50"
                                        style={{
                                            filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2))"
                                        }}
                                    >
                                        <EmojiPicker
                                            onEmojiClick={onEmojiClick}
                                            width={320}
                                            height={400}
                                            theme="auto"
                                            searchPlaceholder="Search emojis..."
                                            previewConfig={{ showPreview: false }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg transition-colors mb-1"
                                    style={{
                                        color: "rgba(var(--color-text-rgb), 0.6)"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = "var(--color-text)";
                                        e.target.style.backgroundColor = "rgba(var(--color-text-rgb), 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = "rgba(var(--color-text-rgb), 0.6)";
                                        e.target.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <Paperclip size={16} />
                                </motion.button>
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={textareaRef}
                                        value={message}
                                        onChange={handleTextareaChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                                        className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-200 resize-none"
                                        rows={1}
                                        style={{
                                            backgroundColor: "rgba(var(--color-text-rgb), 0.05)",
                                            border: "1px solid rgba(var(--color-text-rgb), 0.2)",
                                            color: "var(--color-text)",
                                            minHeight: "40px",
                                            maxHeight: "120px",
                                            lineHeight: "1.5",
                                            overflowY: "hidden" // Initial state - will be changed dynamically
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "var(--color-primary)";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(var(--color-primary-rgb), 0.2)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(var(--color-text-rgb), 0.2)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                </div>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 rounded-lg transition-colors mb-1"
                                    style={{
                                        color: showEmojiPicker 
                                            ? "var(--color-primary)" 
                                            : "rgba(var(--color-text-rgb), 0.6)",
                                        backgroundColor: showEmojiPicker 
                                            ? "rgba(var(--color-primary-rgb), 0.1)" 
                                            : "transparent"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!showEmojiPicker) {
                                            e.target.style.color = "var(--color-text)";
                                            e.target.style.backgroundColor = "rgba(var(--color-text-rgb), 0.1)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!showEmojiPicker) {
                                            e.target.style.color = "rgba(var(--color-text-rgb), 0.6)";
                                            e.target.style.backgroundColor = "transparent";
                                        }
                                    }}
                                >
                                    <Smile size={16} />
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={!message.trim()}
                                    className="p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed mb-1"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        color: "var(--color-alt)",
                                        opacity: !message.trim() ? 0.5 : 1,
                                        boxShadow: `0 4px 14px 0 rgba(var(--color-primary-rgb), 0.25)`
                                    }}
                                    onMouseEnter={(e) => {
                                        if (message.trim()) {
                                            e.target.style.backgroundColor = "rgba(var(--color-primary-rgb), 0.9)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "var(--color-primary)";
                                    }}
                                >
                                    <Send size={16} />
                                </motion.button>
                            </form>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Custom scrollbar styles using your theme */}
            <style>{`
                .overflow-y-auto::-webkit-scrollbar {
                    width: 4px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: transparent;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: rgba(var(--color-text-rgb), 0.2);
                    border-radius: 2px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--color-text-rgb), 0.3);
                }
                
                /* Textarea placeholder styling */
                textarea::placeholder {
                    color: rgba(var(--color-text-rgb), 0.5) !important;
                }
                
                /* Textarea scrollbar styling */
                textarea::-webkit-scrollbar {
                    width: 4px;
                }
                textarea::-webkit-scrollbar-track {
                    background: transparent;
                }
                textarea::-webkit-scrollbar-thumb {
                    background: rgba(var(--color-text-rgb), 0.3);
                    border-radius: 2px;
                }
                textarea::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--color-text-rgb), 0.4);
                }
            `}</style>
        </div>
    );
};

export default ChatModal;
