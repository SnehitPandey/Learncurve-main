// Components/room/KanbanView.jsx
import React, { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
    MoreHorizontal,
    Clock,
    Loader,
    AlertCircle
} from "lucide-react";
import { Card, Badge } from "../../elements/elements";
import { roomService } from "../../../services/roomService";
import { socketService } from "../../../services/socketService";

const KanbanView = ({ roomData, userId }) => {
    const [boardData, setBoardData] = useState({
        columns: {
            'backlog': {
                id: 'backlog',
                title: 'Backlog',
                tasks: []
            },
            'todo': {
                id: 'todo',
                title: 'To Do',
                tasks: []
            },
            'inprogress': {
                id: 'inprogress',
                title: 'In Progress',
                tasks: []
            },
            'done': {
                id: 'done',
                title: 'Done',
                tasks: []
            }
        },
        columnOrder: ['backlog', 'todo', 'inprogress', 'done']
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // Fetch Kanban board from backend
    useEffect(() => {
        const fetchKanbanBoard = async () => {
            if (!roomData?.id || !userId) return;

            try {
                setLoading(true);
                const response = await roomService.getKanbanBoard(roomData.id, userId);
                
                // Transform backend data to frontend format
                if (response && response.kanban) {
                    const transformedData = {
                        columns: {
                            'backlog': {
                                id: 'backlog',
                                title: 'Backlog',
                                tasks: response.kanban.backlog || []
                            },
                            'todo': {
                                id: 'todo',
                                title: 'To Do',
                                tasks: response.kanban.todo || []
                            },
                            'inprogress': {
                                id: 'inprogress',
                                title: 'In Progress',
                                tasks: response.kanban.inProgress || response.kanban.inprogress || []
                            },
                            'done': {
                                id: 'done',
                                title: 'Done',
                                tasks: response.kanban.done || []
                            }
                        },
                        columnOrder: ['backlog', 'todo', 'inprogress', 'done']
                    };
                    setBoardData(transformedData);
                } else {
                    // Initialize empty board if no data
                    setBoardData({
                        columns: {
                            'backlog': { id: 'backlog', title: 'Backlog', tasks: [] },
                            'todo': { id: 'todo', title: 'To Do', tasks: [] },
                            'inprogress': { id: 'inprogress', title: 'In Progress', tasks: [] },
                            'done': { id: 'done', title: 'Done', tasks: [] }
                        },
                        columnOrder: ['backlog', 'todo', 'inprogress', 'done']
                    });
                }
                setError(null);
            } catch (err) {
                console.error('Failed to fetch kanban board:', err);
                // Initialize empty board on error so AI can populate it
                setBoardData({
                    columns: {
                        'backlog': { id: 'backlog', title: 'Backlog', tasks: [] },
                        'todo': { id: 'todo', title: 'To Do', tasks: [] },
                        'inprogress': { id: 'inprogress', title: 'In Progress', tasks: [] },
                        'done': { id: 'done', title: 'Done', tasks: [] }
                    },
                    columnOrder: ['backlog', 'todo', 'inprogress', 'done']
                });
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchKanbanBoard();
    }, [roomData?.id, userId]);

    // Auto-regenerate tasks if board is empty after initial load
    useEffect(() => {
        const autoRegenerate = async () => {
            if (loading || regenerating || !roomData?.id) return;
            
            // Check if all columns are empty
            const totalTasks = Object.values(boardData.columns).reduce((acc, col) => acc + col.tasks.length, 0);
            if (totalTasks > 0) return;

            console.log('[Kanban] No tasks found — triggering fallback regeneration');
            try {
                setRegenerating(true);
                const regenResponse = await roomService.regenerateTasks(roomData.id);
                
                // The regenerate endpoint now returns { kanban: { backlog, todo, inProgress, done } }
                if (regenResponse && regenResponse.kanban) {
                    console.log('[Kanban] Fallback regen returned kanban:', regenResponse.kanban);
                    setBoardData({
                        columns: {
                            'backlog': { id: 'backlog', title: 'Backlog', tasks: regenResponse.kanban.backlog || [] },
                            'todo': { id: 'todo', title: 'To Do', tasks: regenResponse.kanban.todo || [] },
                            'inprogress': { id: 'inprogress', title: 'In Progress', tasks: regenResponse.kanban.inProgress || regenResponse.kanban.inprogress || [] },
                            'done': { id: 'done', title: 'Done', tasks: regenResponse.kanban.done || [] }
                        },
                        columnOrder: ['backlog', 'todo', 'inprogress', 'done']
                    });
                } else {
                    // Fallback: re-fetch from the GET endpoint
                    console.log('[Kanban] Regen response empty, re-fetching board...');
                    const response = await roomService.getKanbanBoard(roomData.id, userId);
                    if (response && response.kanban) {
                        setBoardData({
                            columns: {
                                'backlog': { id: 'backlog', title: 'Backlog', tasks: response.kanban.backlog || [] },
                                'todo': { id: 'todo', title: 'To Do', tasks: response.kanban.todo || [] },
                                'inprogress': { id: 'inprogress', title: 'In Progress', tasks: response.kanban.inProgress || response.kanban.inprogress || [] },
                                'done': { id: 'done', title: 'Done', tasks: response.kanban.done || [] }
                            },
                            columnOrder: ['backlog', 'todo', 'inprogress', 'done']
                        });
                    }
                }
                console.log('[Kanban] Auto-regeneration complete');
            } catch (err) {
                console.error('[Kanban] Auto-regeneration failed:', err);
            } finally {
                setRegenerating(false);
            }
        };

        autoRegenerate();
    }, [loading, roomData?.id, userId]);

    // Subscribe to Socket.IO kanban updates
    useEffect(() => {
        if (!roomData?.id) return;

        const handleKanbanUpdate = ({ userId: updateUserId, change }) => {
            console.log('Kanban update received:', { updateUserId, change });
            
            // Refetch board to get latest state
            if (roomData?.id && userId) {
                roomService.getKanbanBoard(roomData.id, userId)
                    .then(response => {
                        if (response.kanban) {
                            const transformedData = {
                                columns: {
                                    'backlog': {
                                        id: 'backlog',
                                        title: 'Backlog',
                                        tasks: response.kanban.backlog || []
                                    },
                                    'todo': {
                                        id: 'todo',
                                        title: 'To Do',
                                        tasks: response.kanban.todo || []
                                    },
                                    'inprogress': {
                                        id: 'inprogress',
                                        title: 'In Progress',
                                        tasks: response.kanban.inProgress || []
                                    },
                                    'done': {
                                        id: 'done',
                                        title: 'Done',
                                        tasks: response.kanban.done || []
                                    }
                                },
                                columnOrder: ['backlog', 'todo', 'inprogress', 'done']
                            };
                            setBoardData(transformedData);
                        }
                    })
                    .catch(err => console.error('Failed to sync kanban:', err));
            }
        };

        socketService.on('room:kanban:update', handleKanbanUpdate);

        return () => {
            socketService.off('room:kanban:update', handleKanbanUpdate);
        };
    }, [roomData?.id, userId]);

    const onDragEnd = useCallback(async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistic update
        const previousBoardData = boardData;
        
        setBoardData(prevData => {
            const start = prevData.columns[source.droppableId];
            const finish = prevData.columns[destination.droppableId];

            if (start === finish) {
                const newTaskIds = Array.from(start.tasks);
                const [removed] = newTaskIds.splice(source.index, 1);
                newTaskIds.splice(destination.index, 0, removed);

                const newColumn = {
                    ...start,
                    tasks: newTaskIds,
                };

                return {
                    ...prevData,
                    columns: {
                        ...prevData.columns,
                        [newColumn.id]: newColumn,
                    },
                };
            }

            // Moving from one list to another
            const startTaskIds = Array.from(start.tasks);
            const [removed] = startTaskIds.splice(source.index, 1);
            const newStart = {
                ...start,
                tasks: startTaskIds,
            };

            const finishTaskIds = Array.from(finish.tasks);
            finishTaskIds.splice(destination.index, 0, removed);
            const newFinish = {
                ...finish,
                tasks: finishTaskIds,
            };

            return {
                ...prevData,
                columns: {
                    ...prevData.columns,
                    [newStart.id]: newStart,
                    [newFinish.id]: newFinish,
                },
            };
        });

        // Sync with backend
        try {
            setSyncing(true);
            
            // Map frontend column IDs to backend format
            const columnMap = {
                'backlog': 'backlog',
                'todo': 'todo',
                'inprogress': 'inProgress',
                'done': 'done'
            };

            await roomService.moveKanbanTask(
                roomData.id,
                userId,
                draggableId, // taskId
                columnMap[source.droppableId], // fromColumn
                columnMap[destination.droppableId], // toColumn
                destination.index // order
            );
            
            setError(null);
        } catch (err) {
            console.error('Failed to sync kanban move:', err);
            setError('Failed to sync changes');
            
            // Rollback on error
            setBoardData(previousBoardData);
        } finally {
            setSyncing(false);
        }
    }, [boardData, roomData?.id, userId]);

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text flex items-center gap-2">
                        📋 AI-Managed Kanban
                        {syncing && (
                            <Loader className="w-5 h-5 animate-spin text-primary ml-2" />
                        )}
                    </h2>
                    <p className="text-text/60 mt-1">Drag tasks between columns to update their status</p>
                </div>
                <div className="flex items-center gap-3">
                    {regenerating && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                            <Loader className="w-4 h-4 animate-spin" />
                            Generating tasks...
                        </span>
                    )}
                    <div className="text-sm text-text/60">
                        Total Tasks: {Object.values(boardData.columns).reduce((acc, col) => acc + col.tasks.length, 0)}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-text/60">Loading kanban board...</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 pb-6" style={{ minWidth: 'max-content' }}>
                        {boardData.columnOrder.map((columnId) => {
                            const column = boardData.columns[columnId];

                            return (
                                <div key={column.id} className="flex flex-col w-80 rounded-xl bg-alt/5">
                                    <div className="flex items-center justify-between p-4 border-b border-text/10">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-text">{column.title}</h3>
                                            <Badge className="bg-primary/10 text-primary">
                                                {column.tasks.length}
                                            </Badge>
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
                                                className={`flex-1 p-4 space-y-3 min-h-[300px] transition-colors duration-200 ${
                                                    droppableSnapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
                                                }`}
                                            >
                                                {column.tasks.map((task, index) => {
                                                    let displayTitle = typeof task.title === 'string' ? task.title : (task.title || '-');
                                                    let displayDesc = task.description || '';
                                                    let displayMins = parseInt(task.estimatedMinutes || task.estimatedHours * 60 || 0);

                                                    if (typeof task.title === 'string' && task.title.trim().startsWith('{')) {
                                                        try {
                                                            const titleMatch = task.title.match(/title:\s*['"]([^'"]+)['"]/);
                                                            if (titleMatch && titleMatch[1]) displayTitle = titleMatch[1];
                                                            
                                                            const descMatch = task.title.match(/description:\s*['"]([^'"]+)['"]/);
                                                            if (descMatch && descMatch[1]) displayDesc = descMatch[1];
                                                            
                                                            const minMatch = task.title.match(/estimatedMinutes:\s*(\d+)/);
                                                            if (minMatch && minMatch[1]) displayMins = parseInt(minMatch[1], 10);
                                                        } catch (e) {}
                                                    }

                                                    return (
                                                    <Draggable key={task.taskId || `task-${index}`} draggableId={task.taskId || `task-${index}`} index={index}>
                                                        {(draggableProvided, draggableSnapshot) => (
                                                            <div
                                                                ref={draggableProvided.innerRef}
                                                                {...draggableProvided.draggableProps}
                                                                {...draggableProvided.dragHandleProps}
                                                                className={`transition-all duration-200 ${
                                                                    draggableSnapshot.isDragging 
                                                                        ? 'rotate-2 scale-105 shadow-2xl ring-2 ring-primary/30' 
                                                                        : 'hover:shadow-md'
                                                                }`}
                                                                style={{
                                                                    ...draggableProvided.draggableProps.style,
                                                                    marginBottom: '12px'
                                                                }}
                                                            >
                                                                <Card className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700 hover:border-teal-500 transition-colors cursor-grab active:cursor-grabbing">
                                                                    {/* Header: title + priority badge */}
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <h4 className="text-white font-semibold text-sm leading-snug pr-2">
                                                                            {displayTitle}
                                                                        </h4>
                                                                        {(() => {
                                                                            const mins = displayMins;
                                                                            const priorityClass = mins >= 90 ? 'bg-red-900 text-red-300' 
                                                                                              : mins >= 60 ? 'bg-yellow-900 text-yellow-300' 
                                                                                              : 'bg-green-900 text-green-300';
                                                                            const priorityLabel = mins >= 90 ? 'high' : mins >= 60 ? 'medium' : 'low';
                                                                            return (
                                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${priorityClass}`}>
                                                                                    {priorityLabel}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    
                                                                    {/* Description - truncated */}
                                                                    {displayDesc && (
                                                                        <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                                                                            {displayDesc.length > 80 
                                                                                ? displayDesc.substring(0, 80) + '...'
                                                                                : displayDesc}
                                                                        </p>
                                                                    )}

                                                                    {/* Tags container */}
                                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                                        {task.phaseRef && (
                                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900 text-teal-300">
                                                                                {task.phaseRef.replace('p', 'Phase ')}
                                                                            </span>
                                                                        )}
                                                                        {task.milestoneRef && (
                                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900 text-teal-300">
                                                                                {task.milestoneRef}
                                                                            </span>
                                                                        )}
                                                                        {column.id === 'done' && (
                                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                                                                Completed
                                                                            </span>
                                                                        )}
                                                                        {/* Fallback tags if refs are missing but topicId exists */}
                                                                        {!task.phaseRef && !task.milestoneRef && task.topicId && (
                                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900 text-teal-300">
                                                                                {task.topicId}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Footer: Date */}
                                                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700/50">
                                                                        <div className="flex items-center gap-1">
                                                                            <span>📅 </span>
                                                                            <span>
                                                                                {task.scheduledDate || task.createdAt
                                                                                    ? new Date(task.scheduledDate || task.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                                                                                    : 'No date'
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </Card>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                    );
                                                })}
                                                {droppableProvided.placeholder}

                                                {column.tasks.length === 0 && (
                                                    <div className="text-center py-8 text-text/40">
                                                        <div className="w-12 h-12 mx-auto mb-3 bg-text/5 rounded-full flex items-center justify-center">
                                                            <Clock size={20} />
                                                        </div>
                                                        <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                                                        <p className="text-xs mt-1">AI will assign tasks here</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>
            )}
        </div>
    );
};

export default KanbanView;
