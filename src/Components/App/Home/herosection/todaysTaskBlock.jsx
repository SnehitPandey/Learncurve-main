import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Users, Bell, ArrowRight, Compass, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getMyRooms } from "../../../../api/rooms";

/**
 * How to describe the OTHER people in this room, or nothing at all.
 *
 * Returns `null` when you are alone in the room, which is what hides the line.
 * `memberCount` includes the reader, so it is never used directly as a peer
 * count — subtracting the caller is what stops a solo room advertising a peer.
 */
function peerLine(room) {
    if (!room) return null;

    const peers = typeof room.peerCount === "number"
        ? room.peerCount
        : typeof room.memberCount === "number"
            ? Math.max(0, room.memberCount - 1)
            : null;

    // Alone, or genuinely nothing to say.
    if (peers === null || peers <= 0) return null;

    const online = typeof room.onlinePeerCount === "number" ? room.onlinePeerCount : null;

    if (online !== null && online === 0) {
        return `${peers} peer${peers > 1 ? "s" : ""} enrolled · none online right now`;
    }

    const showing = online !== null ? online : peers;
    return `${showing} peer${showing > 1 ? "s" : ""} studying with you right now`;
}

const TodaysTaskBlock = ({ cardVariants, customIndex }) => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      try {
        const myRoomsRes = await getMyRooms();
        if (cancelled) return;
        if (Array.isArray(myRoomsRes?.rooms) && myRoomsRes.rooms.length > 0) {
          // getMyRooms returns `name`; the render reads `title`, so without this
          // the header printed "undefined — Active Module".
          setActiveRoom({ ...myRoomsRes.rooms[0], title: myRoomsRes.rooms[0].name || myRoomsRes.rooms[0].title });
        }
        // No fallback to the discovery feed.
        //
        // This used to pull a public room you have NOT joined and present it as
        // your active room, complete with a peer count — so the block showed
        // "1 peer learning together" for a room you are not even a member of. The
        // block describes what you are doing today; with nothing joined it says
        // nothing.
      } catch (err) {
        console.warn("[TaskBlock] Error loading tasks:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadTasks();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="lg:col-span-4 p-6 rounded-2xl border border-primary/40 bg-background/50 backdrop-blur-sm min-h-full flex flex-col justify-between"
      style={{
        boxShadow: '0 0 20px rgba(var(--color-primary-rgb), 0.15)'
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-primary">Today's Task Block</h2>
          </div>
          {activeRoom && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              {activeRoom.skill || "Curriculum"}
            </span>
          )}
        </div>

        {activeRoom ? (
          <div className="space-y-4">
            <div className="text-text/90">
              <p className="text-lg font-medium text-text">
                {activeRoom.title} — Active Module
              </p>
              <p className="text-sm text-text/70 mt-1">
                {activeRoom.description || "Interactive daily syllabus milestone with collaborative Kanban checkpoints"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-primary pt-1">
              <CheckCircle size={16} />
              <span className="font-medium text-sm">Checkpoint Quiz & Tasks Available</span>
            </div>
            <div className="w-full bg-text/10 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, activeRoom.progress ?? 0))}%` }}
              />
            </div>

            {/* Peers — shown only when someone ELSE is really here.
                A room containing just the reader used to render "1 peer learning
                together in this room", because `memberCount` counts the caller
                too. The backend now sends `peerCount` (everyone else) and
                `onlinePeerCount` (everyone else currently connected), so this
                line appears for a real peer and stays hidden when you are alone. */}
            {peerLine(activeRoom) && (
                <div className="flex items-center gap-2 text-text/70 text-sm">
                    <Users size={16} className="text-primary flex-shrink-0" />
                    <span>{peerLine(activeRoom)}</span>
                </div>
            )}
            <div className="mt-4 p-3 rounded-lg bg-text/5 border border-text/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-400">
                <Bell size={16} />
                <span className="text-xs font-medium">Daily Streak Target</span>
              </div>
              <span className="text-xs text-text/70">Complete 1 lesson today to keep your streak</span>
            </div>
          </div>
        ) : isLoading ? (
          <p className="text-sm text-text/60">Loading your rooms...</p>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-base text-text/80 font-medium">
              You haven't joined a study room yet.
            </p>
            <p className="text-sm text-text/60 leading-relaxed">
              Join or create a study room to unlock an AI-tailored syllabus, daily task check-offs, collaborative Kanban boards, and peer accountability duos.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <NavLink
                to="/joinroom"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Compass size={16} />
                Explore Rooms
              </NavLink>
              <NavLink
                to="/createroom"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <Plus size={16} />
                Create Room
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {activeRoom && (activeRoom.id || activeRoom._id) && (
        <div className="pt-5 border-t border-text/10 mt-4 flex items-center justify-between">
          <span className="text-xs text-text/60">Ready to jump in?</span>
          <NavLink
            to={`/room/${activeRoom.id || activeRoom._id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Enter Study Room
            <ArrowRight size={15} />
          </NavLink>
        </div>
      )}
    </motion.div>
  );
};

export default TodaysTaskBlock;
