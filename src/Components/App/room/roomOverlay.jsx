// Components/room/roomOverlay.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft,
    Users, 
    MessageCircle, 
    Crown, 
    Circle,
    Send,
    Smile,
    Paperclip
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Card, Badge } from '../../elements/elements';
import { chatService } from '../../../services/chatService';
import { socketService } from '../../../services/socketService';

const RoomOverlay = ({ content, members, roomData, unreadCount, onClose, roomId }) => {
    // Chat state
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    
    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Typing timeout ref
    const typingTimeoutRef = useRef(null);
    
    // Fetch chat history when overlay opens with chat content
    useEffect(() => {
        const fetchMessages = async () => {
            if (content !== 'chat' || !roomId) return;
            
            try {
                setIsLoadingMessages(true);
                const response = await chatService.getMessages(roomId, { limit: 50, order: 'asc' });
                
                if (response.success && response.messages) {
                    const formattedMessages = response.messages.map(msg => ({
                    id: msg._id || msg.id || Date.now().toString(),
                    userId: msg.user?._id || msg.senderId,
                    user: msg.user?.name || msg.senderName || 'Unknown',
                    avatar: msg.user?.avatarUrl || msg.user?.profilePic || msg.user?.customAvatarURL || msg.avatar ||
                        ((msg.user?.name || msg.senderName) ? (msg.user?.name || msg.senderName).substring(0, 2).toUpperCase() : 'UN'),
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
    }, [content, roomId, currentUser.id]);

    // Listen for new messages via Socket.IO
    useEffect(() => {
        if (content !== 'chat' || !roomId) return;

        const handleNewMessage = (msg) => {
            console.log('New message received:', msg);
            const formattedMessage = {
                id: msg.id || Date.now().toString(),
                userId: msg.userId || msg.senderId,
                user: msg.username || msg.senderName || 'Unknown',
                avatar: msg.avatar || ((msg.username || msg.senderName) ? (msg.username || msg.senderName).substring(0, 2).toUpperCase() : 'UN'),
                message: msg.content,
                timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isCurrentUser: (msg.userId || msg.senderId) === currentUser.id
            };
            setMessages(prev => [...prev, formattedMessage]);
        };

        const handleSystemMessage = (data) => {
            const systemMsg = {
                id: Date.now().toString(),
                userId: null,
                user: 'System',
                avatar: '🔔',
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
            if (data.userId === currentUser.id) return;
            
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
            // Cleanup listeners when overlay closes
            socketService.socket?.off('NEW_MESSAGE', handleNewMessage);
            socketService.socket?.off('chat:system', handleSystemMessage);
            socketService.socket?.off('chat:typing', handleTyping);
        };
    }, [content, roomId, currentUser.id]);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Helper function for status colors
    const getStatusColor = (status) => {
        switch (status) {
            case 'ahead': return 'text-green-500';
            case 'on-track': return 'text-blue-500';
            case 'behind': return 'text-red-500';
            default: return 'text-text/60';
        }
    };

    // Auto-resize textarea function
    const handleTextareaChange = useCallback((e) => {
        const textarea = e.target;
        const newValue = textarea.value;
        setMessage(newValue);
        
        // Emit typing indicator
        if (roomId && newValue.trim()) {
            socketService.sendTyping(roomId, true);
            
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            typingTimeoutRef.current = setTimeout(() => {
                socketService.sendTyping(roomId, false);
            }, 2000);
        }
        
        textarea.style.height = 'auto';
        
        if (textarea.scrollHeight <= 120) {
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        } else {
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const renderMembers = () => (
        <div className="flex-1 overflow-y-auto p-6 mb-24">
            <div className="space-y-3">
                {members.map((member, index) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className={`p-4 transition-all hover:shadow-md ${
                            member.isCurrentUser ? 'ring-2 ring-primary/30' : ''
                        }`}>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                        <span className="text-primary font-medium text-lg">
                                            {member.name.charAt(0)}
                                        </span>
                                    </div>
                                    {member.isCurrentUser && (
                                        <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
                                    )}
                                    <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-current" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="font-medium text-text truncate">
                                            {member.name}
                                        </p>
                                        {member.isCurrentUser && (
                                            <span className="text-xs text-primary font-medium">(You)</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-sm font-medium capitalize ${getStatusColor(member.status)}`}>
                                            {member.status.replace('-', ' ')}
                                        </span>
                                        <span className="text-sm font-semibold text-text">
                                            {member.progress?.progressPercentage || 0}%
                                        </span>
                                    </div>
                                    
                                    <div className="w-full h-2 bg-text/20 rounded-full mt-3">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${member.progress?.progressPercentage || 0}%` }}
                                            transition={{ duration: 0.8, delay: index * 0.1 }}
                                            className="h-full bg-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="flex flex-col h-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 mb-24">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-3"
                        >
                            <div className="flex-shrink-0">
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                                    style={{
                                        backgroundColor: msg.isCurrentUser 
                                            ? "var(--color-primary)" 
                                            : "#667eea",
                                        color: "white"
                                    }}
                                >
                                    {msg.avatar}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-text">
                                        {msg.user}
                                    </span>
                                    <span className="text-xs text-text/50">
                                        {msg.timestamp}
                                    </span>
                                </div>
                                <div className="text-sm break-words text-text">
                                    {msg.message}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-text/10">
                {/* Emoji Picker */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            ref={emojiPickerRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-4 mb-2 z-50"
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
                        className="p-2 rounded-lg transition-colors mb-1 text-text/60 hover:text-text hover:bg-text/10"
                    >
                        <Paperclip size={16} />
                    </motion.button>
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-200 resize-none bg-alt/20 border border-text/20 text-text focus:border-primary focus:ring-2 focus:ring-primary/20"
                            rows={1}
                            style={{
                                minHeight: "40px",
                                maxHeight: "120px",
                                lineHeight: "1.5",
                                overflowY: "hidden"
                            }}
                        />
                    </div>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 rounded-lg transition-colors mb-1 ${
                            showEmojiPicker 
                                ? 'text-primary bg-primary/10' 
                                : 'text-text/60 hover:text-text hover:bg-text/10'
                        }`}
                    >
                        <Smile size={16} />
                    </motion.button>
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!message.trim()}
                        className="p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed mb-1 bg-primary text-white disabled:opacity-50 shadow-lg shadow-primary/25"
                    >
                        <Send size={16} />
                    </motion.button>
                </form>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50 flex flex-col"
        >
            {/* Header with Back Button */}
            <div className="flex items-center justify-between p-4 border-b border-text/10 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 rounded-lg text-text/60 hover:text-text hover:bg-text/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div className="flex items-center space-x-2">
                        {content === 'members' ? (
                            <>
                                <Users className="w-5 h-5 text-text/60" />
                                <h2 className="text-xl font-semibold text-text">Members</h2>
                                <Badge variant="primary" className="bg-primary/10 text-primary">
                                    {members.length}
                                </Badge>
                            </>
                        ) : (
                            <>
                                <MessageCircle className="w-5 h-5 text-text/60" />
                                <h2 className="text-xl font-semibold text-text">{roomData.name}</h2>
                                {unreadCount > 0 && (
                                    <Badge variant="primary" className="bg-red-500 text-white">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {content === 'members' ? renderMembers() : renderChat()}

            {/* Custom Styles - Using regular style tag */}
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
                
                textarea::placeholder {
                    color: rgba(var(--color-text-rgb), 0.5) !important;
                }
                
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
        </motion.div>
    );
};

export default RoomOverlay;
