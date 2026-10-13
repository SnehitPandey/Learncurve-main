import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "./socketClient";

/**
 * Keep this socket joined to a room for as long as the calling page is mounted.
 *
 * WHY THIS EXISTS
 * Room membership used to be owned by the chat modal, which joined on open and
 * left on close. That made realtime presence a side effect of opening the chat:
 * the Kanban board only received peer card moves while the chat happened to be
 * open, and it received nothing at all otherwise — so the board was realtime in
 * name only.
 *
 * It also did not survive a dropped connection. Socket.IO rooms do not survive
 * a new socket id, so after any reconnect the client had silently left every
 * room and nothing re-joined. Chat recovered via its 15s poll; the board had no
 * poll fallback, so a peer's move was missed until the page was refetched.
 *
 * Ownership now sits with the room PAGE, which is mounted for the whole time
 * anyone is looking at the room, so every consumer (chat, Kanban, presence)
 * benefits from one join. `connect` is re-handled because that is the only
 * event that tells us the server has a fresh socket id for us.
 *
 /**
 * @param roomId  the room to join, or a falsy value to do nothing
 * @param enabled set false to hold off joining (e.g. while the room id resolves)
 * @param handlers optional `{ onMessage, onPresence }`.
 *
 * WHY THE PAGE NEEDS THESE
 *   Joining a room and LISTENING to it are separate things, and only the chat
 *   modal listened. It subscribes inside `if (isOpen)`, so with the chat closed
 *   the room page received nothing: a peer joining produced no visible change and
 *   a message arriving was invisible until you opened the panel. The join was
 *   live; the reactions were not.
 *
 *   These callbacks fire for the whole time the room page is mounted, so joins
 *   and messages surface immediately. The chat modal keeps its own listeners —
 *   it needs the full formatted message, and removing it would regress the panel.
 */
export function useRoomSocket(roomId, enabled = true, handlers = {}) {
  const navigate = useNavigate();
  const { onMessage, onPresence, onRoadmapUpdated, onTaskCompleted } = handlers;

  useEffect(() => {
    if (!enabled || !roomId) return undefined;

    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socket = getSocket();
    if (!socket) return undefined;

    const join = () => socket.emit("join_room", { roomId });
    const leave = () => socket.emit("leave_room", { roomId });

    // The last member leaving deletes the room outright. Anyone still looking at
    // it — the person who just left, or a peer who has not navigated away yet —
    // would otherwise sit on a page whose every action 404s. Bounce them out
    // instead. `replace` so Back does not return to the deleted room.
    const onDeleted = (payload) => {
      if (!payload || payload.roomId !== roomId) return;
      navigate("/home", {
        replace: true,
        state: { toast: "This room was deleted — everyone had left it." }
      });
    };

    const onNewMessage = (msg) => {
      if (!msg || (msg.roomId && msg.roomId !== roomId)) return;
      onMessage?.(msg);
    };

    const onUserPresence = (data) => {
      if (!data || data.roomId !== roomId) return;
      onPresence?.(Array.isArray(data.onlineUserIds) ? data.onlineUserIds : []);
    };

    const onRoadmapChange = (data) => {
      if (!data || (data.roomId && data.roomId !== roomId)) return;
      onRoadmapUpdated?.(data);
    };

    const onTaskComplete = (data) => {
      if (!data || (data.roomId && data.roomId !== roomId)) return;
      onTaskCompleted?.(data);
    };

    // Covers the initial connection AND every reconnection. Without the listener
    // the client rejoins exactly once and then silently stops receiving.
    socket.on("connect", join);
    socket.on("room_deleted", onDeleted);
    socket.on("new_message", onNewMessage);
    socket.on("user_presence", onUserPresence);
    socket.on("roadmap_updated", onRoadmapChange);
    socket.on("task_completed", onTaskComplete);
    join();

    return () => {
      socket.off("connect", join);
      socket.off("room_deleted", onDeleted);
      socket.off("new_message", onNewMessage);
      socket.off("user_presence", onUserPresence);
      socket.off("roadmap_updated", onRoadmapChange);
      socket.off("task_completed", onTaskComplete);
      // Only leave if we are actually still connected — emitting on a dead
      // socket queues an event that is never delivered and can leak on the next
      // connect.
      if (socket.connected) leave();
    };
  }, [roomId, enabled, navigate, onMessage, onPresence, onRoadmapUpdated, onTaskCompleted]);
}