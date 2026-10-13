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
import { getRoomMessages, sendRoomMessage } from '../../../api/chat';
import { confirmLocalMessage } from '../../../utils/chatMessages';

// Collision-free optimistic message ids.
let localSeq = 0;

const RoomOverlay = ({ content, members = [], roomData, unreadCount, onClose, roomId }) => {
    // Chat state — loaded live from backend, no sample messages
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(true);

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
        setMessage(textarea.value);
        
        textarea.style.height = 'auto';
        
        if (textarea.scrollHeight <= 120) {
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        } else {
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load live chat history when overlay opens in chat mode
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (content !== 'chat' || !roomId) return;
            setChatLoading(true);
            try {
                const res = await getRoomMessages(roomId);
                const raw = res?.messages || res?.data;
                // `data` is not guaranteed to be an array — guard before .map
                const list = Array.isArray(raw) ? raw : [];
                if (!mounted) return;
                let myId = null;
                try { myId = JSON.parse(localStorage.getItem("user") || "{}").id || null; } catch {
                    // Corrupt/absent localStorage — fall back to server-provided flags.
                }
                const fromServer = list.map(m => {
                    const name = m.userName || m.sender_name || "Peer";
                    const isMine = m.is_current_user !== undefined ? !!m.is_current_user : (myId ? (m.userId === myId || m.user_id === myId) : false);
                    return {
                        id: m._id || m.id,
                        user: isMine ? "You" : name,
                        avatar: (isMine ? "YOU" : String(name)).slice(0, 2).toUpperCase(),
                        // Sent by the API all along, never read before.
                        avatarUrl: m.userAvatar || m.avatar || m.avatarUrl || "",
                        message: m.content,
                        timestamp: (m.createdAt || m.created_at) ? new Date(m.createdAt || m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
                        isCurrentUser: !!isMine
                    };
                });

                // Server history is the source of truth. Any still-unconfirmed
                // local row whose text now appears in it is dropped, so reloading
                // the panel cannot leave the sender staring at their own message
                // twice.
                setMessages(prev => {
                    const persisted = new Set(fromServer.map(m => m.message));
                    const stillPending = prev.filter(
                        m => String(m.id).startsWith("local-") && !persisted.has(m.message)
                    );
                    return [...fromServer, ...stillPending];
                });
            } catch (err) {
                console.warn("[Overlay] chat load failed:", err?.message);
            } finally {
                if (mounted) setChatLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [content, roomId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const trimmed = message.trim();
        // `Date.now()` alone can collide when two sends land in the same
        // millisecond, which produced duplicate React keys.
        const optimisticId = `local-${Date.now()}-${++localSeq}`;
        const optimistic = {
            id: optimisticId,
            user: "You",
            avatar: "YO",
            message: trimmed,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCurrentUser: true
        };

        setMessages(prev => [...prev, optimistic]);
        setMessage("");
        setShowEmojiPicker(false);

        if (roomId) {
            try {
                // Reconcile the optimistic row onto the id the server assigned.
                // Previously this call's result was ignored entirely, so the local
                // copy stayed on screen under its `local-…` id while the next
                // history load added the server's copy beside it — the sender saw
                // their message twice, then a third time on the next reload.
                const res = await sendRoomMessage(roomId, trimmed);
                const saved = res?.message;
                if (saved?.id || saved?._id) {
                    setMessages(prev => confirmLocalMessage(prev, optimisticId, saved, trimmed));
                } else {
                    // No server id came back; just clear the pending flag.
                    setMessages(prev => prev.map(m => (m.id === optimisticId ? { ...m, pending: false } : m)));
                }
            } catch (err) {
                console.warn("[Overlay] send failed:", err?.message);
            }
        }
        
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
                                            {(member.name || "?").charAt(0).toUpperCase()}
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
                                            {member.status ? member.status.replace('-', ' ') : 'unknown'}
                                        </span>
                                        <span className="text-sm font-semibold text-text">
                                            {member.progress ?? 0}%
                                        </span>
                                    </div>
                                    
                                    <div className="w-full h-2 bg-text/20 rounded-full mt-3">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${member.progress ?? 0}%` }}
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
                {chatLoading && messages.length === 0 && (
                    <p className="text-center text-xs text-text/40">Loading messages...</p>
                )}
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
                                {msg.avatarUrl ? (
                                    <img
                                        src={msg.avatarUrl}
                                        alt={msg.user}
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                ) : (
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
                                )}
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

            {/* Custom Styles */}
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
