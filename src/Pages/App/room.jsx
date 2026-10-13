// Components/room/room.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

import RoomHeader from "../../Components/App/room/roomHeader";
import RoomContent from "../../Components/App/room/roomContent";
import ChatModal from "../../Components/App/room/chatModal";
import SettingsModal from "../../Components/App/room/settingsModal";
import RoomOverlay from "../../Components/App/room/roomOverlay";
import { getRoomDetail, getRoomTasks, toggleTask, leaveRoom as leaveRoomApi, replanRoadmap } from "../../api/rooms";
import { getRoadmap, toggleRoadmapTask } from "../../api/kanban";
import { getRoomMessages } from "../../api/chat";
import { useRoomSocket } from "../../sockets/useRoomSocket";

const Room = () => {
    // The router only declares `room/:roomname`, so that is the one param that
    // can exist here. Renaming at the destructure keeps the rest of the page
    // (which talks about rooms as ids) unchanged.
    const { roomname: roomId } = useParams();
    const navigate = useNavigate();


    // UI state
    const [activeView, setActiveView] = useState("progress");
    const [showSettings, setShowSettings] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayContent, setOverlayContent] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [scheduleState, setScheduleState] = useState({ notStarted: false, startsOn: "", restDay: false, availability: "", finished: false });
    const [activeTaskId, setActiveTaskId] = useState(null);
    const lastSeenMsgRef = useRef(null);
    const mountedRef = useRef(true);

    // Re-arm on EVERY mount, not just the first.
//
// This used to be `useEffect(() => () => { mountedRef.current = false; }, [])`,
// which only ever clears the flag. Under React 19 StrictMode (main.jsx) effects
// are mounted, cleaned up, then mounted again — so the cleanup ran and nothing
// set it back to `true`. The ref stayed `false` for the rest of the session,
// which made every `if (!mountedRef.current) return;` guard bail and, critically,
// skipped `setLoading(false)` in the fetch's `finally` block. Both "Loading
// tasks..." and "Loading roadmap..." read from that one flag, so the room page
// spun forever on a room it had already fetched successfully.
//
// `friendsSection.jsx`, `createdRoom.jsx` and `settings.jsx` already re-arm
// correctly; this was the odd one out.
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);


    useEffect(() => {
        if (!roomId) return undefined;

        // ChatModal polls the SAME endpoint on its own 15s interval while it is
        // open, so polling here too would double every request. `showChat` is
        // only ever true on desktop (mobile chat goes through RoomOverlay, which
        // fetches once on open), so gating on it is exactly the overlap window.
        // While chat is closed this poll still runs, which is the only time the
        // unread badge needs it.
        if (showChat) return undefined;

        // Poll for new messages to drive the unread badge (works without websockets).
        // Seed lastSeen on first poll so we don't badge pre-existing history. The
        // seed is per-effect-run, so every `showChat` transition back to false
        // re-seeds it — that is what marks the chat the user just read as seen.
        let mounted = true;
        let seeded = false;
        const poll = async () => {
            try {
                const res = await getRoomMessages(roomId, 1, 20);
                const raw = res?.messages || res?.data;
                const list = Array.isArray(raw) ? raw : [];
                if (!mounted || list.length === 0) return;
                const latestId = list[list.length - 1]?.id || list[list.length - 1]?._id;
                if (!seeded) {
                    // Seed only — never badge the history that predates this mount.
                    lastSeenMsgRef.current = latestId;
                    seeded = true;
                    return;
                }
                if (latestId && latestId !== lastSeenMsgRef.current) {
                    // Count messages since last seen (cap at 99+ display)
                    const idx = list.findIndex(m => (m.id || m._id) === lastSeenMsgRef.current);
                    const fresh = idx === -1 ? list.length : list.length - 1 - idx;
                    if (fresh > 0) setUnreadCount(c => Math.min(99, c + fresh));
                    lastSeenMsgRef.current = latestId;
                }
            } catch {
                // Poll failed — the next tick retries.
            }
        };
        const timer = setInterval(poll, 15000);
        poll();
        return () => { mounted = false; clearInterval(timer); };
    }, [roomId, showChat]);

    // Room data — all driven from API
    const [roomData, setRoomData] = useState({
        id: roomId,
        name: "Loading...",
        description: "",
        daysRemaining: null,
        totalDays: null,
        completionRate: 0,
        activeUsers: 0,
        skill: "",
        category: "",
        difficulty: "",
        isCreator: false,
        isEnrolled: false,
    });
    const [members, setMembers] = useState([]);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [roadmapItems, setRoadmapItems] = useState([]);
    const [roadmapGeneratedBy, setRoadmapGeneratedBy] = useState("template");
    // Who is in the room right now, live. Presence used to be read only by the chat
    // modal, so with the chat closed a peer joining changed nothing on screen.
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    // The socket callbacks are captured once, so they cannot close over `showChat`.
    // A ref keeps them reading the current value instead of the value at mount,
    // which was `false` forever.
    const showChatRef = useRef(false);
    showChatRef.current = showChat;

    // Fetch all room data from backend
    const fetchRoomData = useCallback(async () => {
        if (!roomId) return;
        try {
            const [detailRes, tasksRes, roadmapRes] = await Promise.allSettled([
                getRoomDetail(roomId),
                getRoomTasks(roomId),
                getRoadmap(roomId),
            ]);
            if (!mountedRef.current) return;

            // Room detail + members
            if (detailRes.status === "fulfilled" && detailRes.value?.room) {
                const r = detailRes.value.room;
                setRoomData({
                    id: r.id || roomId,
                    name: r.name,
                    description: r.description || "",
                    // The backend computes the real schedule window and returns
                    // null when the room's start date/timeframe is unknown.
                    // Do NOT invent numbers here — a fabricated 18/30 reads as
                    // real progress to the user.
                    daysRemaining: r.daysRemaining ?? null,
                    totalDays: r.totalDays ?? null,
                    timeframe: r.timeframe || "",
                    // The learner's own daily commitment. Kept as "" when unset so
                    // the header can hide it rather than showing a fabricated one.
                    daily_time: r.daily_time || "",
                    completionRate: r.completionRate ?? 0,
                    activeUsers: r.activeUsers ?? (r.members?.length || 0),
                    skill: r.skill || "",
                    category: r.category || "",
                    difficulty: r.difficulty || "",
                    isCreator: r.isCreator || false,
                    isEnrolled: r.isEnrolled || false,
                });
                if (Array.isArray(r.members)) {
                    setMembers(r.members.map(m => ({
                        id: m.id,
                        name: m.name || "Peer Learner",
                        avatarUrl: m.avatarUrl || "",
                        progress: m.progress ?? 0,
                        status: m.status || "on-track",
                        isCurrentUser: m.isCurrentUser || false,
                    })));
                }
            }

            // Today's tasks
            if (tasksRes.status === "fulfilled") {
                const data = tasksRes.value;
                setScheduleState({
                    notStarted: Boolean(data?.notStarted),
                    startsOn: data?.startsOn || "",
                    restDay: Boolean(data?.restDay),
                    availability: data?.availability || "",
                    finished: Boolean(data?.finished)
                });
                setActiveTaskId(data?.activeTaskId || null);
                if (Array.isArray(data?.tasks)) {
                    setTodaysTasks(data.tasks.map(t => ({
                        id: t.id,
                        title: t.title,
                        completed: !!t.completed,
                        duration: t.duration || "30m",
                    })));
                } else {
                    setTodaysTasks([]);
                }
            }

            // Roadmap modules → ONE timeline item per TOPIC, with its lessons inside.
            //
            // This flattened every task into its own row, so the timeline read
            // "Lesson 1 / Lesson 2 / Checkpoint / Lesson 1 / Lesson 2 …" with
            // nothing marking which topic any of them belonged to. There was then
            // no topic to drop a subtopic list from — the dropdown could only
            // hang off a bare lesson, and the "Continue" button that should have
            // opened it had no onClick at all.
            //
            // One item per module is what the UI is actually shaped for: the card
            // is the topic, and the lessons live behind its disclosure.
            if (roadmapRes.status === "fulfilled" && roadmapRes.value?.roadmap?.modules) {
                setRoadmapGeneratedBy(roadmapRes.value.roadmap.generatedBy || "template");
                const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
                // Normalise instead of `return`-ing out of the whole fetch: an
                // early return here would skip every step added below it and any
                // added later, and this function has already been bitten once.
                // A malformed roadmap is an empty timeline, not a reason to stop.
                const modules = Array.isArray(roadmapRes.value.roadmap.modules)
                    ? roadmapRes.value.roadmap.modules
                    : [];
                const built = [];
                modules.forEach(mod => {
                    const rawTasks = Array.isArray(mod.tasks) ? mod.tasks : [];
                    const seen = new Set();
                    const tasks = [];
                    for (const task of rawTasks) {
                        const norm = (task.title || "").toLowerCase().trim();
                        if (seen.has(norm)) continue;
                        seen.add(norm);
                        tasks.push({
                            id: task.id,
                            title: task.title,
                            duration: task.durationEstimate || "30m",
                            completed: Array.isArray(task.completedByUserIds)
                                ? task.completedByUserIds.includes(userId)
                                : false,
                        });
                    }
                    if (tasks.length === 0) return;

                    const everyDone = tasks.every(t => t.completed);
                    built.push({
                        id: `module-${mod.weekNumber}`,
                        title: mod.title,
                        week: mod.weekNumber,
                        moduleTitle: mod.title,
                        summary: mod.summary || "",
                        subtopics: Array.isArray(mod.subtopics) ? mod.subtopics : [],
                        tasks,
                        // A topic counts as done only when ALL its lessons are —
                        // otherwise a single checked lesson would strike through
                        // the whole topic.
                        completed: everyDone,
                        current: !everyDone && built.every(b => b.completed),
                    });
                });
                setRoadmapItems(built);
            }
        } catch (err) {
            console.warn("[Room] Fetch error:", err?.message);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchRoomData();
    }, [fetchRoomData]);

    // Room membership is owned by the PAGE, not by the chat modal.
    useRoomSocket(roomId, !loading, useMemo(() => ({
        onPresence: (ids) => setOnlineUserIds(ids),
        onMessage: (msg) => {
            const myId = localStorage.getItem("userId") || JSON.parse(localStorage.getItem("user") || "{}").id;
            if (myId && msg && (msg.userId === myId || msg.user_id === myId)) return;
            if (!showChatRef.current) setUnreadCount(c => Math.min(99, c + 1));
        },
        onRoadmapUpdated: () => fetchRoomData(),
        onTaskCompleted: () => fetchRoomData(),
    }), [fetchRoomData]));


    // Task toggle — optimistic update + backend sync
    const handleToggleTask = useCallback(async (taskId, currentCompleted) => {
        const newCompleted = !currentCompleted;
        const nextTasks = todaysTasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t);
        setTodaysTasks(nextTasks);

        // Optimistically update active roadmap task if activeTaskId is set
        if (activeTaskId) {
            setRoadmapItems(prev =>
                prev.map(mod => {
                    const updatedTasks = (mod.tasks || []).map(t =>
                        t.id === activeTaskId ? { ...t, completed: newCompleted } : t
                    );
                    const everyDone = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
                    return { ...mod, tasks: updatedTasks, completed: everyDone };
                })
            );
        }

        try {
            // No `timeSpentMinutes` argument: nothing on this page measures a real
            // duration, so the backend applies its own default instead of being
            // credited a fabricated flat 0.5h for every toggled task.
            const res = await toggleTask(roomId, taskId, newCompleted);
            if (res?.progress !== undefined) {
                setMembers(prev =>
                    prev.map(m => m.isCurrentUser ? { ...m, progress: res.progress } : m)
                );
            }
            // Refresh completion rate
            const detailRes = await getRoomDetail(roomId);
            if (detailRes?.room?.completionRate !== undefined) {
                setRoomData(prev => ({ ...prev, completionRate: detailRes.room.completionRate }));
            }
            await fetchRoomData();
        } catch {
            // Rollback on failure
            await fetchRoomData();
        }
    }, [roomId, todaysTasks, activeTaskId, fetchRoomData]);

    // Roadmap task toggle — optimistic update + backend sync
    const handleToggleRoadmapTask = useCallback(async (taskId, currentCompleted) => {
        const nextCompleted = !currentCompleted;
        setRoadmapItems(prev =>
            prev.map(mod => {
                const updatedTasks = (mod.tasks || []).map(t =>
                    t.id === taskId ? { ...t, completed: nextCompleted } : t
                );
                const everyDone = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
                return {
                    ...mod,
                    tasks: updatedTasks,
                    completed: everyDone,
                };
            })
        );

        // If toggling active roadmap task, also update todaysTasks optimistically
        if (activeTaskId && taskId === activeTaskId) {
            setTodaysTasks(prev => prev.map(t => ({ ...t, completed: nextCompleted })));
        }

        try {
            const res = await toggleRoadmapTask(roomId, taskId);
            if (res?.progress !== undefined) {
                setMembers(prev =>
                    prev.map(m => m.isCurrentUser ? { ...m, progress: res.progress } : m)
                );
            }
            await fetchRoomData();
        } catch {
            await fetchRoomData();
        }
    }, [roomId, activeTaskId, fetchRoomData]);

    const handleReplanRoadmap = useCallback(async (options) => {
        if (!roomId) return;
        try {
            await replanRoadmap(roomId, options);
            await fetchRoomData();
        } catch (err) {
            console.error("[Room] Replan error:", err);
            throw err;
        }
    }, [roomId, fetchRoomData]);

    // Mobile detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 720);
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 720;
            setIsMobile(mobile);
            if (!mobile) setShowOverlay(false);
            else setShowMembers(false);
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Handlers
    const handleLeaveRoom = async () => {
        // Say it up front. Once the last member leaves, the room and everything in
        // it is deleted — there is no way back.
        const warning = "Are you sure you want to leave this room?\n\nIf you are the last member, the room will be deleted.";
        if (window.confirm(warning)) {
            let deleted = false;
            try {
                const res = await leaveRoomApi(roomId);
                deleted = !!res?.roomDeleted;
            } catch (err) {
                console.warn("Leave room backend note:", err?.message);
            }
            navigate("/home", {
                replace: true,
                state: deleted
                    ? { toast: "You were the last member — the room was deleted." }
                    : null
            });
        }
    };

    const handleChatToggle = () => {
        if (isMobile) {
            // On mobile: show overlay with chat content
            setOverlayContent('chat');
            setShowOverlay(true);
            setUnreadCount(0);
        } else {
            // On desktop: toggle chat modal
            setShowChat(!showChat);
            if (!showChat) {
                // No fetch here. ChatModal fetches the same history the moment it
                // opens, and closing it re-arms the poll effect above with a fresh
                // `seeded = false`, whose first tick re-seeds lastSeenMsgRef to the
                // latest id. Seeding twice bought nothing and doubled the request.
                setUnreadCount(0); // Clear unread count when opening chat
            }
        }
    };

    const handleMembersToggle = () => {
        if (isMobile) {
            // On mobile: show overlay with members content
            setOverlayContent('members');
            setShowOverlay(true);
        } else {
            // On desktop: toggle members panel
            setShowMembers(!showMembers);
        }
    };

    const handleCloseOverlay = () => {
        setShowOverlay(false);
    };

    const handleChatClose = () => {
        setShowChat(false);
    };

    // Animation variants
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

    return (
        <div className={`min-h-screen bg-gradient transition-colors duration-300 ${
            isMobile ? '' : 'md:ml-20'
        }`}>
            {/* Room Header */}
            <RoomHeader 
                roomData={roomData}
                activeView={activeView}
                onViewChange={setActiveView}
                onSettingsToggle={() => setShowSettings(!showSettings)}
                onChatToggle={handleChatToggle}
                onMembersToggle={handleMembersToggle}
                showChat={showChat}
                showMembers={showMembers} // This will be false by default
                unreadCount={unreadCount}
                // Live presence, straight from the socket. Rendered as a "N online"
                // pill so a peer arriving is visible immediately instead of only
                // becoming apparent after opening the chat panel.
                onlineUserIds={onlineUserIds}
            />

            {/* Main Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="h-[calc(100vh-120px)]"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="h-full"
                    >
                        <RoomContent
                            activeView={activeView}
                            roomData={roomData}
                            members={members}
                            todaysTasks={todaysTasks}
                            roadmapItems={roadmapItems}
                            showMembers={!isMobile && showMembers}
                            onToggleTask={handleToggleTask}
                            onToggleRoadmapTask={handleToggleRoadmapTask}
                            /* The checkpoint task is a real test, not a checkbox —
                               "Take Test" moves to the quiz view rather than
                               marking itself done without being taken. */
                            onOpenQuiz={() => setActiveView("quiz")}
                            loading={loading}
                            roadmapGeneratedBy={roadmapGeneratedBy}
                            scheduleState={scheduleState}
                            onReplanRoadmap={handleReplanRoadmap}
                        />
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && showOverlay && (
                    <RoomOverlay
                        content={overlayContent}
                        members={members}
                        roomData={roomData}
                        unreadCount={unreadCount}
                        onClose={handleCloseOverlay}
                        roomId={roomId}
                    />
                )}
            </AnimatePresence>

            {/* Desktop Settings Modal */}
            <SettingsModal 
                showSettings={showSettings}
                onClose={() => setShowSettings(false)}
                onLeaveRoom={handleLeaveRoom}
                roomData={roomData}
                isRoomAdmin={roomData.isCreator}
            />

            {/* Desktop Chat Modal - Only shows on desktop */}
            <ChatModal 
                isOpen={showChat && !isMobile}
                onClose={handleChatClose}
                roomName={roomData.name}
                roomId={roomId}
                onMessagesRead={() => setUnreadCount(0)}
            />
        </div>
    );
};

export default Room;
