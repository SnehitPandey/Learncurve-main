import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getMyRooms } from "../../../../api/rooms";

const RoomUpdates = ({ cardVariants, customIndex }) => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadUpdates() {
      try {
        const res = await getMyRooms();
        if (cancelled) return;
        if (Array.isArray(res?.rooms) && res.rooms.length > 0) {
          const generated = res.rooms.slice(0, 3).map((r) => {
            const title = r.name || r.title || "Your study room";
            const onlinePeers = typeof r.onlinePeerCount === "number" ? r.onlinePeerCount : 0;
            const peerCount = typeof r.peerCount === "number" ? r.peerCount : 0;
            const progress = typeof r.progress === "number" ? Math.round(r.progress) : 0;

            let color = "bg-purple-400";
            let message = "";

            if (onlinePeers > 0) {
              color = "bg-green-400";
              message = `${onlinePeers} peer${onlinePeers > 1 ? "s" : ""} active now in "${title}"`;
            } else if (peerCount > 0) {
              color = "bg-blue-400";
              message = `${peerCount} peer${peerCount > 1 ? "s" : ""} enrolled in "${title}" · ${progress}% done`;
            } else {
              color = "bg-emerald-400";
              message = `"${title}" · ${progress}% completed${r.daysRemaining !== null && r.daysRemaining !== undefined ? ` (${r.daysRemaining}d left)` : ""}`;
            }

            return {
              id: r.id,
              color,
              message
            };
          });
          setUpdates(generated);
        } else {
          setUpdates([]);
        }
      } catch (err) {
        console.warn("[RoomUpdates] Could not load user rooms:", err?.message);
        if (!cancelled) setUpdates([]);
      }
    }
    loadUpdates();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="p-4 rounded-2xl border border-primary/30 bg-background/50 min-h-full"
    >
      <h3 className="text-base font-medium text-primary mb-3">Live Room Updates</h3>
      <div className="space-y-2 text-xs text-text/70">
        {updates.length > 0 ? (
          updates.map((update, index) => (
            <Link
              key={update.id || index}
              to={update.id ? `/room/${update.id}` : "#"}
              className="flex items-center gap-2 hover:text-text hover:opacity-100 transition-opacity group"
            >
              <div className={`w-2 h-2 ${update.color} rounded-full flex-shrink-0 group-hover:scale-125 transition-transform`}></div>
              <span className="truncate">{update.message}</span>
            </Link>
          ))
        ) : (
          <p className="text-text/50 italic text-xs">
            Join or launch a study room to view live group updates and milestone achievements here.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default RoomUpdates;
