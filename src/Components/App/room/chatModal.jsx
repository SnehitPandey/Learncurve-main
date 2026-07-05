// Components/chat/ChatModal.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Smile, Paperclip, Minimize2, Maximize2 } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { chatService } from "../../../services/chatService";
import { socketService } from "../../../services/socketService";

const ChatModal = ({ isOpen, onClose, roomName = "Frontend in 30 Days", onlineCount = 0, totalMembers = 0, roomId }) => {
    const [message, setMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [size, setSize] = useState({ width: 600, height: 700 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const chatRef = useRef(null);

    // Dynamic max sizes based on viewport
    const getMaxSizes = useCallback(() => ({
        maxWidth: window.innerWidth - 40,
        maxHeight: window.innerHeight - 40
    }), []);

    // Messages state - populated from backend/socket
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    
    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Typing timeout ref
    const typingTimeoutRef = useRef(null);

    // Fetch chat history when modal opens
    useEffect(() => {
        const fetchMessages = async () => {
            if (!isOpen || !roomId) return;
            
            try {
                setIsLoadingMessages(true);
                const response = await chatService.getMessages(roomId, { limit: 50, order: 'asc' });
                
                if (response.success && response.messages) {
                    const formattedMessages = response.messages.map(msg => ({
                        id: msg._id || msg.id || Date.now().toString(),
                        userId: msg.user?._id || msg.senderId,
                        user: msg.user?.name || msg.senderName || 'Unknown',
                        avatar: msg.user?.avatarUrl || msg.user?.profilePic || msg.user?.customAvatarURL || msg.avatar || null,
                        message: msg.content,
                        timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isCurrentUser: (msg.user?._id || msg.senderId) === currentUser.id
                    }));
                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [isOpen, roomId, currentUser.id]);

    // Listen for new messages via Socket.IO
    useEffect(() => {
        if (!isOpen || !roomId) return;

        const handleNewMessage = (msg) => {
            console.log('New message received:', msg);
            const formattedMessage = {
                id: msg.id || Date.now().toString(),
                userId: msg.userId || msg.senderId,
                user: msg.username || msg.senderName || 'Unknown',
                avatar: msg.avatar || null,
                message: msg.content,
                timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isCurrentUser: (msg.userId || msg.senderId) === currentUser.id
            };
            setMessages(prev => [...prev, formattedMessage]);
        };

        const handleSystemMessage = (data) => {
            console.log('System message received:', data);
            const systemMsg = {
                id: Date.now().toString(),
                userId: null,
                user: 'System',
                avatar: null,
                message: data.type === 'join' 
                    ? `${data.username} joined the room` 
                    : `${data.username} left the room`,
                timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSystem: true,
                isCurrentUser: false
            };
            setMessages(prev => [...prev, systemMsg]);
        };

        const handleTyping = (data) => {
            if (data.userId === currentUser.id) return; // Ignore self
            
            if (data.isTyping) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.userId === data.userId)) {
                        return [...prev, { userId: data.userId, username: data.username }];
                    }
                    return prev;
                });
            } else {
                setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            }
        };

        socketService.onMessage(handleNewMessage);
        socketService.onSystemMessageNew(handleSystemMessage);
        socketService.onChatTyping(handleTyping);

        return () => {
            // Cleanup listeners when modal closes
            socketService.socket?.off('NEW_MESSAGE', handleNewMessage);
            socketService.socket?.off('chat:system', handleSystemMessage);
            socketService.socket?.off('chat:typing', handleTyping);
        };
    }, [isOpen, roomId, currentUser.id]);

    // Auto-resize textarea function
    const handleTextareaChange = useCallback((e) => {
        const textarea = e.target;
        const newValue = textarea.value;
        setMessage(newValue);
        
        // Emit typing indicator
        if (roomId && newValue.trim()) {
            // Send typing=true
            socketService.sendTyping(roomId, true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout to send typing=false after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                socketService.sendTyping(roomId, false);
            }, 2000);
        }
        
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
    }, [roomId]);

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

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen && roomId) {
            // Clear typing indicator
            socketService.sendTyping(roomId, false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    }, [isOpen, roomId]);

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

    // Resize functionality with max size constraints
    const handleMouseDown = useCallback((e, direction) => {
        e.preventDefault();
        setIsResizing(true);
        setResizeDirection(direction);
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;
        const { maxWidth, maxHeight } = getMaxSizes();

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction.includes('right')) {
                newWidth = Math.max(400, Math.min(startWidth + deltaX, maxWidth));
            }
            if (direction.includes('left')) {
                newWidth = Math.max(400, Math.min(startWidth - deltaX, maxWidth));
            }
            if (direction.includes('bottom')) {
                newHeight = Math.max(300, Math.min(startHeight + deltaY, maxHeight));
            }
            if (direction.includes('top')) {
                newHeight = Math.max(300, Math.min(startHeight - deltaY, maxHeight));
            }

            if (direction === 'top-left') {
                newWidth = Math.max(400, Math.min(startWidth - deltaX, maxWidth));
                newHeight = Math.max(300, Math.min(startHeight - deltaY, maxHeight));
            }
            if (direction === 'top-right') {
                newWidth = Math.max(400, Math.min(startWidth + deltaX, maxWidth));
                newHeight = Math.max(300, Math.min(startHeight - deltaY, maxHeight));
            }
            if (direction === 'bottom-left') {
                newWidth = Math.max(400, Math.min(startWidth - deltaX, maxWidth));
                newHeight = Math.max(300, Math.min(startHeight + deltaY, maxHeight));
            }
            if (direction === 'bottom-right') {
                newWidth = Math.max(400, Math.min(startWidth + deltaX, maxWidth));
                newHeight = Math.max(300, Math.min(startHeight + deltaY, maxHeight));
            }

            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeDirection('');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [size, getMaxSizes]);

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

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !roomId) return;

        // Send message via Socket.IO
        socketService.sendMessage(roomId, message.trim(), 'TEXT');
        
        // Clear typing indicator
        socketService.sendTyping(roomId, false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Clear input
        setMessage("");
        setShowEmojiPicker(false);
        
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
                                        {`${onlineCount} members online`}{totalMembers ? ` · ${totalMembers} total` : ''}
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
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <Send size={32} style={{ color: "rgba(var(--color-primary-rgb), 0.5)" }} />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2" style={{ color: "var(--color-text)" }}>
                                        No Messages Yet
                                    </h3>
                                    <p className="text-sm" style={{ color: "rgba(var(--color-text-rgb), 0.6)" }}>
                                        Start the conversation by sending a message below!
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {messages.map((msg, index) => {
                                        // Check if this is a system message
                                        if (msg.isSystem) {
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    variants={messageVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="flex justify-center my-2"
                                                >
                                                    <div 
                                                        className="px-3 py-1 rounded-full text-xs"
                                                        style={{
                                                            backgroundColor: "rgba(var(--color-text-rgb), 0.05)",
                                                            color: "rgba(var(--color-text-rgb), 0.6)"
                                                        }}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                </motion.div>
                                            );
                                        }
                                        
                                        // Regular user message
                                        const isOwnMessage = msg.isCurrentUser;
                                        
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                variants={messageVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}
                                            >
                                                <div className={`flex ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-start max-w-[75%] gap-2`}>
                                                    {/* Avatar */}
                                                    <div className="flex-shrink-0">
                                                        {msg.avatar ? (
                                                            <img 
                                                                src={msg.avatar} 
                                                                alt={msg.user}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                                style={{
                                                                    border: "2px solid rgba(var(--color-text-rgb), 0.1)"
                                                                }}
                                                                onError={(e) => {
                                                                    // Fallback to initials if image fails to load
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div 
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                                                            style={{
                                                                display: msg.avatar ? 'none' : 'flex',
                                                                backgroundColor: isOwnMessage 
                                                                    ? "var(--color-primary)" 
                                                                    : "rgba(var(--color-primary-rgb), 0.3)",
                                                                color: isOwnMessage ? "var(--color-alt)" : "var(--color-text)",
                                                                border: "2px solid rgba(var(--color-text-rgb), 0.1)"
                                                            }}
                                                        >
                                                            {msg.user.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Message Content */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Username and Timestamp */}
                                                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                                            <span 
                                                                className="text-xs font-semibold"
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
                                                        
                                                        {/* Message Bubble */}
                                                        <div 
                                                            className={`px-3 py-2 rounded-lg break-words text-sm ${isOwnMessage ? "rounded-tr-none" : "rounded-tl-none"}`}
                                                            style={{
                                                                backgroundColor: isOwnMessage 
                                                                    ? "var(--color-primary)" 
                                                                    : "rgba(var(--color-text-rgb), 0.08)",
                                                                color: isOwnMessage 
                                                                    ? "var(--color-alt)" 
                                                                    : "var(--color-text)",
                                                                wordWrap: "break-word",
                                                                overflowWrap: "break-word",
                                                                hyphens: "auto",
                                                                maxWidth: "100%"
                                                            }}
                                                        >
                                                            {msg.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    
                                    {/* Typing indicator */}
                                    {typingUsers.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="flex gap-3 mt-2"
                                        >
                                            <div className="flex-shrink-0">
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                                                    style={{
                                                        backgroundColor: "rgba(var(--color-primary-rgb), 0.2)",
                                                        color: "var(--color-primary)"
                                                    }}
                                                >
                                                    •••
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center">
                                                <span 
                                                    className="text-xs italic"
                                                    style={{ color: "rgba(var(--color-text-rgb), 0.6)" }}
                                                >
                                                    {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
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
