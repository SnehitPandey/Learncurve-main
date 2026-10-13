import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { getStudyDays } from "../../../../api/users";

/**
 * Biweekly study calendar.
 *
 * HIGHLIGHT RULES
 *   - Filled cell  : this learner completed every daily task (including the
 *                    checkpoint quiz) on that date. Persisted server-side, so a
 *                    date keeps its highlight for as long as it stays in the
 *                    window — it is stored when the day happens, not derived
 *                    from an undated task list that scrolls away.
 *   - Duo border   : the learner AND their study partner both completed that
 *                    date. Encoded with an outer ring, so it reads differently
 *                    from the fill rather than replacing it.
 *   - Fill only    : the learner completed it but the partner did not (or there
 *                    is no partner). Deliberately NOT the duo treatment — a
 *                    one-sided day must never look like a mutual one.
 */

/** `YYYY-MM-DD` in the browser's local zone, matching the server's key format. */
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const BiweeklyCalendar = ({ biweeklyDays, cardVariants, customIndex }) => {
  const [days, setDays] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getStudyDays().then(res => {
      if (cancelled) return;
      setDays(res.days);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // `YYYY-MM-DD` -> { duo }. One lookup per cell instead of a scan.
  const byDate = useMemo(() => {
    const map = new Map();
    for (const d of days) map.set(d.date, d.duo === true);
    return map;
  }, [days]);

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="p-4 rounded-2xl border border-primary/30 bg-background/50 min-h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-primary" />
        <h3 className="text-sm font-medium text-primary">Biweekly Calendar</h3>
      </div>
      <div className="text-xs text-text/70">
        <p className="mb-2 text-xs font-medium text-center">
          {biweeklyDays.length > 0 &&
            biweeklyDays[0].fullDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
            <div key={dayName} className="text-xs text-text/50 text-center font-medium">
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {biweeklyDays.map((day, i) => {
            const completed = byDate.has(dateKey(day.fullDate));
            const duo = completed && byDate.get(dateKey(day.fullDate));

            return (
              <div
                key={i}
                title={
                  completed
                    ? duo
                      ? "Completed — you and your study partner"
                      : "Completed"
                    : undefined
                }
                className={[
                  "aspect-square text-center flex items-center justify-center text-xs rounded",
                  // Padding + inset ring so the duo border sits OUTSIDE the fill
                  // and does not eat the cell's interior.
                  duo ? "p-[1.5px] border-2 border-primary" : "",
                  duo ? "bg-transparent" : "",
                  !duo && day.isToday ? "bg-primary text-alt font-bold" : "",
                  !duo && !day.isToday && completed ? "bg-primary/25 text-text font-semibold" : "",
                  !duo && !day.isToday && !completed ? "hover:bg-text/10 text-text/70" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {completed && duo ? (
                  <span className="w-full h-full flex items-center justify-center rounded-[2px] bg-primary text-alt font-bold">
                    {day.date}
                  </span>
                ) : (
                  day.date
                )}
              </div>
            );
          })}
        </div>

        {days.length > 0 && (
          <div className="flex items-center gap-3 mt-3 text-[10px] text-text/60">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-primary/40 inline-block" />
              Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-primary inline-block" />
              Duo day
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BiweeklyCalendar;