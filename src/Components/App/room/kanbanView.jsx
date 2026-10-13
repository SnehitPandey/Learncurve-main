// Components/room/kanbanView.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
    MoreHorizontal,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from "lucide-react";
import { Card, Badge } from "../../elements/elements";
import { getKanbanBoard, patchKanbanCard } from "../../../api/kanban";
import { getSocket } from "../../../sockets/socketClient";

const normalizeTask = (t, columnKey, index) => {
    const raw = t?._doc || t || {};
    const rawDoneBy = Array.isArray(raw.doneBy)
        ? raw.doneBy
        : Array.isArray(t?.doneBy)
            ? t.doneBy
            : Array.isArray(raw.completers)
                ? raw.completers
                : Array.isArray(t?.completers)
                    ? t.completers
                    : [];

    const doneBy = rawDoneBy.map((c) => ({
        userId: c.userId || c.id,
        name: c.name || "Learner",
        avatar: c.avatar || c.avatar_url || c.avatarUrl || ""
    }));

    return {
        id: raw.id || t?.id || raw._id || t?._id || `${columnKey}-${index}`,
        weekNumber: raw.weekNumber || t?.weekNumber || 1,
        title: raw.title || t?.title || "Untitled Task",
        duration: raw.duration || t?.duration || raw.durationEstimate || t?.durationEstimate || "45m",
        dueDate: raw.dueDate || t?.dueDate || raw.due_date || t?.due_date || null,
        tag: raw.tag || t?.tag || "Study",
        priority: raw.priority || t?.priority || "medium",
        order: raw.order ?? t?.order ?? (index * 100),
        overdue: Boolean(raw.overdue ?? t?.overdue),
        doneBy
    };
};

const COLUMN_DEFS = [
    { key: 'upcoming', title: 'Upcoming', subtitle: 'Future modules' },
    { key: 'backlog', title: 'Backlog', subtitle: 'Missed' },
    { key: 'todo', title: 'To Do', subtitle: 'This module' },
    { key: 'inProgress', title: 'In Progress', subtitle: 'Active focus' },
    { key: 'done', title: 'Done', subtitle: 'Completed' },
];

const normalizeBoard = (data) => {
    if (!data) return null;
    const board = data.board || data;
    const rawUpcoming = Array.isArray(data.upcoming)
        ? data.upcoming
        : Array.isArray(board.upcoming)
            ? board.upcoming
            : (Array.isArray(board.columns?.upcoming) ? board.columns.upcoming : []);
    const activeWeek = Number(data.activeWeek || board.activeWeek) || 1;

    const rawCols = board.columns || board;
    const columns = {};
    const order = [ 'upcoming','backlog', 'todo', 'inProgress', 'done'];

    order.forEach(key => {
        const def = COLUMN_DEFS.find(d => d.key === key);
        let list;
        if (key === 'upcoming') {
            list = rawUpcoming;
        } else if (key === 'inProgress') {
            list = rawCols['inProgress'] || rawCols['inprogress'];
        } else {
            list = rawCols[key];
        }
        columns[key] = {
            id: key,
            title: def?.title || key,
            subtitle: def?.subtitle || '',
            tasks: (Array.isArray(list) ? list : []).map((t, i) => normalizeTask(t, key, i))
        };
    });

    const upcoming = columns.upcoming.tasks;

    return { columns, columnOrder: order, upcoming, activeWeek };
};

const formatDueDate = (dueDate) => {
    if (!dueDate) return "No due date";
    const parsed = new Date(dueDate);
    return Number.isNaN(parsed.getTime())
        ? "No due date"
        : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high': return 'bg-red-500/10 text-red-600 border border-red-200/40';
        case 'medium': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-200/40';
        case 'low': return 'bg-green-500/10 text-green-600 border border-green-200/40';
        default: return 'bg-text/10 text-text/60 border border-text/20';
    }
};

const KanbanCardItem = ({ task, index, isUpcomingCol, isHighlighted }) => {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(draggableProvided, draggableSnapshot) => (
                <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                    className={`transition-all duration-300 w-full mb-3 ${
                        draggableSnapshot.isDragging
                            ? 'rotate-2 scale-105 shadow-2xl ring-2 ring-primary/40 z-50'
                            : 'hover:shadow-md'
                    } ${
                        isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20 animate-pulse' : ''
                    }`}
                    style={draggableProvided.draggableProps.style}
                >
                    <Card className={`p-4 cursor-grab active:cursor-grabbing bg-background hover:bg-alt/10 transition-colors border ${
                        task.overdue ? 'border-red-500/40' : 'border-text/10'
                    }`}>
                        <div className="space-y-3">
                            {/* Card Top: Tag + Priority + Wk chip + Overdue */}
                            <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                        task.tag === "Practice"
                                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                                            : "bg-primary/10 text-primary border border-primary/20"
                                    }`}>
                                        {task.tag}
                                    </span>
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded capitalize ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                    {task.weekNumber && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                            Wk {task.weekNumber}
                                        </span>
                                    )}
                                </div>

                                {task.overdue && (
                                    <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 border border-red-500/30 font-semibold animate-pulse">
                                        <AlertCircle size={10} /> Overdue
                                    </span>
                                )}
                            </div>

                            {/* Card Title */}
                            <h4 className="font-semibold text-text text-sm leading-snug line-clamp-2">
                                {task.title}
                            </h4>

                            {/* Card Meta: Duration & Due Date */}
                            <div className="flex items-center justify-between text-xs text-text/60">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} className="text-text/50" />
                                    <span>{task.duration}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-text/50" />
                                    <span className={task.overdue ? "text-red-500 font-medium" : ""}>
                                        {formatDueDate(task.dueDate)}
                                    </span>
                                </div>
                            </div>

                            {/* Card Footer: doneBy avatars */}
                            <div className="flex items-center justify-between pt-2 border-t border-text/10 text-xs">
                                <span className="text-[11px] text-text/50">Completed by:</span>
                                <div className="flex items-center">
                                    {task.doneBy && task.doneBy.length > 0 ? (
                                        <div className="flex -space-x-1.5 overflow-hidden items-center">
                                            {task.doneBy.slice(0, 3).map((u, ui) => (
                                                u.avatar ? (
                                                    <img
                                                        key={u.userId || ui}
                                                        src={u.avatar}
                                                        alt={u.name}
                                                        title={`Done by ${u.name}`}
                                                        className="w-5 h-5 rounded-full object-cover ring-1 ring-background"
                                                    />
                                                ) : (
                                                    <div
                                                        key={u.userId || ui}
                                                        title={`Done by ${u.name}`}
                                                        className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold ring-1 ring-background"
                                                    >
                                                        {(u.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                )
                                            ))}
                                            {task.doneBy.length > 3 && (
                                                <span className="text-[10px] text-text/50 pl-1">
                                                    +{task.doneBy.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-text/40">None yet</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};

const KanbanView = ({ roomData }) => {
    const roomId = roomData?.id;
    const [boardData, setBoardData] = useState({
        columns: {
            backlog: { id: "backlog", title: "Backlog", subtitle: "Missed", tasks: [] },
            todo: { id: "todo", title: "To Do", subtitle: "This module", tasks: [] },
            inProgress: { id: "inProgress", title: "In Progress", subtitle: "Active focus", tasks: [] },
            done: { id: "done", title: "Done", subtitle: "Completed", tasks: [] },
            upcoming: { id: "upcoming", title: "Upcoming", subtitle: "Future modules", tasks: [] }
        },
        columnOrder: ['upcoming', 'backlog', 'todo', 'inProgress', 'done'],
        upcoming: [],
        activeWeek: 1
    });
    const [highlightedCardIds, setHighlightedCardIds] = useState(new Set());
    const [boardLoading, setBoardLoading] = useState(true);
    const boardRef = useRef(boardData);
    const previousCardColumnsRef = useRef(new Map());

    const applyBoard = useCallback((data) => {
        const next = normalizeBoard(data);
        if (!next) return false;

        // Detect column changes to apply brief highlight
        const currentCardColumns = new Map();
        for (const colKey of ['backlog', 'todo', 'inProgress', 'done', 'upcoming']) {
            if (next.columns[colKey]) {
                for (const t of next.columns[colKey].tasks) {
                    currentCardColumns.set(t.id, colKey);
                }
            }
        }

        if (previousCardColumnsRef.current.size > 0) {
            const changed = new Set();
            for (const [cId, newCol] of currentCardColumns.entries()) {
                const oldCol = previousCardColumnsRef.current.get(cId);
                if (oldCol && oldCol !== newCol) {
                    changed.add(cId);
                }
            }
            if (changed.size > 0) {
                setHighlightedCardIds(changed);
                setTimeout(() => {
                    setHighlightedCardIds(new Set());
                }, 3000);
            }
        }
        previousCardColumnsRef.current = currentCardColumns;

        boardRef.current = next;
        setBoardData(next);
        return true;
    }, []);

    const fetchBoard = useCallback(async () => {
        if (!roomId) return;
        try {
            const res = await getKanbanBoard(roomId);
            applyBoard(res);
        } catch (err) {
            console.warn("[Kanban] board fetch failed:", err?.message);
        }
    }, [roomId, applyBoard]);

    useEffect(() => {
        let isMounted = true;
        const loadBoard = async () => {
            if (!roomId) { setBoardLoading(false); return; }
            setBoardLoading(true);
            try {
                const res = await getKanbanBoard(roomId);
                if (isMounted) applyBoard(res);
            } catch (err) {
                console.warn("[Kanban] board fetch failed:", err?.message);
            } finally {
                if (isMounted) setBoardLoading(false);
            }
        };

        loadBoard();

        const socket = getSocket();
        if (!socket) return () => { isMounted = false; };

        // Realtime Roadmap sync: when a peer marks a task complete/incomplete,
        // update only the doneBy list of that card; NEVER move cards on current user's board.
        const handleRoadmapUpdated = (payload) => {
            if (!payload) return;
            const currentUserId = localStorage.getItem("userId") || JSON.parse(localStorage.getItem("user") || "{}").id;
            const { userId, taskId, completed } = payload;

            if (userId && currentUserId && userId === currentUserId) {
                fetchBoard();
            } else if (taskId) {
                setBoardData((prevData) => {
                    if (!prevData) return prevData;
                    let taskFound = false;

                    const nextColumns = { ...prevData.columns };
                    for (const colKey of Object.keys(nextColumns)) {
                        const col = nextColumns[colKey];
                        const idx = col.tasks.findIndex(t => t.id === taskId);
                        if (idx !== -1) {
                            taskFound = true;
                            const t = col.tasks[idx];
                            let nextDoneBy = [...t.doneBy];
                            if (completed) {
                                if (!nextDoneBy.some(u => u.userId === userId)) {
                                    nextDoneBy.push({ userId, name: "Peer", avatar: "" });
                                }
                            } else {
                                nextDoneBy = nextDoneBy.filter(u => u.userId !== userId);
                            }

                            const updatedTasks = [...col.tasks];
                            updatedTasks[idx] = { ...t, doneBy: nextDoneBy };
                            nextColumns[colKey] = { ...col, tasks: updatedTasks };
                            break;
                        }
                    }

                    let nextUpcoming = prevData.upcoming;
                    if (!taskFound && Array.isArray(prevData.upcoming)) {
                        const uIdx = prevData.upcoming.findIndex(t => t.id === taskId);
                        if (uIdx !== -1) {
                            taskFound = true;
                            const t = prevData.upcoming[uIdx];
                            let nextDoneBy = [...t.doneBy];
                            if (completed) {
                                if (!nextDoneBy.some(u => u.userId === userId)) {
                                    nextDoneBy.push({ userId, name: "Peer", avatar: "" });
                                }
                            } else {
                                nextDoneBy = nextDoneBy.filter(u => u.userId !== userId);
                            }
                            nextUpcoming = [...prevData.upcoming];
                            nextUpcoming[uIdx] = { ...t, doneBy: nextDoneBy };
                        }
                    }

                    if (!taskFound) {
                        fetchBoard();
                        return prevData;
                    }
                    const nextBoard = { ...prevData, columns: nextColumns, upcoming: nextUpcoming };
                    boardRef.current = nextBoard;
                    return nextBoard;
                });
            }
        };

        const handleTaskCompleted = (payload) => {
            if (!payload) return;
            const currentUserId = localStorage.getItem("userId") || JSON.parse(localStorage.getItem("user") || "{}").id;
            if (payload.userId === currentUserId) {
                fetchBoard();
            }
        };

        socket.on("roadmap_updated", handleRoadmapUpdated);
        socket.on("task_completed", handleTaskCompleted);

        return () => {
            isMounted = false;
            socket.off("roadmap_updated", handleRoadmapUpdated);
            socket.off("task_completed", handleTaskCompleted);
        };
    }, [roomId, applyBoard, fetchBoard, roomData]);

    const onDragEnd = useCallback((result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const fromCol = source.droppableId;
        const toCol = destination.droppableId;

        // Restriction: Only moves into or out of Done are valid drops
        // (the Upcoming column cards are draggable to Done only)
        const isIntoDone = toCol === "done" && fromCol !== "done";
        const isOutOfDone = fromCol === "done" && toCol !== "done";

        if (!isIntoDone && !isOutOfDone) {
            // Drop rejected: other columns are derived automatically by syllabus schedule.
            return;
        }

        if (fromCol === "upcoming" && toCol !== "done") {
            // Upcoming cards are draggable to Done only
            return;
        }

        // Call PATCH endpoint and render the returned board instead of trusting the optimistic target
        if (roomId && draggableId) {
            const patchPayload = toCol === "done"
                ? { column: "done" }
                : toCol === "upcoming"
                    ? { lane: "upcoming" }
                    : { column: "todo" };

            patchKanbanCard(roomId, draggableId, patchPayload)
                .then(res => {
                    const returnedBoard = res?.board || res?.data?.board ? (res?.data || res) : null;
                    if (returnedBoard) {
                        applyBoard(returnedBoard);
                    } else {
                        fetchBoard();
                    }
                })
                .catch(err => {
                    console.warn("[Kanban] move rejected, rolling back:", err?.message);
                    fetchBoard();
                });
        }
    }, [roomId, applyBoard, fetchBoard]);

    const totalBoardTasks = boardData.columnOrder.reduce((sum, colId) => {
        return sum + (boardData.columns[colId]?.tasks?.length || 0);
    }, 0);

    const completedCount = boardData.columns.done?.tasks?.length || 0;

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            {/* Header bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" /> Roadmap Kanban Board
                    </h2>
                    <p className="text-text/60 text-sm mt-1">
                        Personalized view derived from your syllabus. Drag to & from <strong className="text-text">Done</strong> to mark milestone completion.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-text/60 bg-alt/10 px-3 py-1.5 rounded-lg border border-text/10">
                        <span className="font-semibold text-primary">Module {boardData.activeWeek}</span>
                        <span className="text-text/30">|</span>
                        <CheckCircle2 size={16} className="text-primary" />
                        <span>
                            {boardLoading
                                ? "Loading board..."
                                : `${completedCount} of ${totalBoardTasks} Completed`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main DragDrop Context: 5 Columns including Upcoming */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto pb-4">
                    {/* 5 Columns: Backlog, To Do, In Progress, Done, Upcoming */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-w-[1100px] xl:min-w-0">
                        {boardData.columnOrder.map((columnId) => {
                            const column = boardData.columns[columnId];
                            if (!column) return null;
                            const isDoneCol = columnId === "done";
                            const isInProgressCol = columnId === "inProgress";
                            const isUpcomingCol = columnId === "upcoming";

                            return (
                                <div
                                    key={column.id}
                                    className={`flex flex-col rounded-xl transition-all ${
                                        isDoneCol
                                            ? 'bg-primary/5 border border-primary/20'
                                            : isInProgressCol
                                                ? 'bg-primary/5 border border-primary/30 ring-1 ring-primary/20'
                                                : isUpcomingCol
                                                    ? 'bg-alt/5 border border-text/10'
                                                    : 'bg-alt/5 border border-text/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-text/10">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-text">{column.title}</h3>
                                                <Badge className={
                                                    isDoneCol
                                                        ? "bg-primary/20 text-primary"
                                                        : isInProgressCol
                                                            ? "bg-primary/25 text-primary"
                                                            : "bg-alt/20 text-text/80"
                                                }>
                                                    {column.tasks.length}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-text/50">{column.subtitle}</span>
                                        </div>
                                        <button className="p-1 hover:bg-alt/20 rounded transition-colors opacity-50">
                                            <MoreHorizontal size={16} className="text-text/60" />
                                        </button>
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(droppableProvided, droppableSnapshot) => (
                                            <div
                                                ref={droppableProvided.innerRef}
                                                {...droppableProvided.droppableProps}
                                                className={`flex-1 p-3 space-y-3 min-h-[360px] transition-colors duration-200 ${
                                                    droppableSnapshot.isDraggingOver
                                                        ? isDoneCol ? 'bg-primary/10 ring-2 ring-primary/40' : 'bg-alt/15 ring-2 ring-alt/30'
                                                        : ''
                                                }`}
                                            >
                                                {column.tasks.map((task, index) => (
                                                    <KanbanCardItem
                                                        key={task.id}
                                                        task={task}
                                                        index={index}
                                                        isUpcomingCol={isUpcomingCol}
                                                        isHighlighted={highlightedCardIds.has(task.id)}
                                                    />
                                                ))}
                                                {droppableProvided.placeholder}

                                                {column.tasks.length === 0 && (
                                                    <div className="text-center py-8 text-text/40">
                                                        <div className="w-10 h-10 mx-auto mb-2 bg-text/5 rounded-full flex items-center justify-center">
                                                            <Clock size={18} />
                                                        </div>
                                                        <p className="text-xs">
                                                            {isUpcomingCol
                                                                ? "No upcoming tasks — final module reached!"
                                                                : `No tasks in ${column.title.toLowerCase()}`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
};

export default KanbanView;
