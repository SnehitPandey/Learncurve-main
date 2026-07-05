import React from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

const BiweeklyCalendar = ({ biweeklyDays, cardVariants, customIndex }) => {
  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="p-4 rounded-2xl border border-primary/40 bg-background/50 backdrop-blur-sm"
      style={{
        boxShadow: '0 0 20px rgba(var(--color-primary-rgb), 0.15)'
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-primary" />
        <h3 className="text-base font-semibold text-primary">Biweekly Calendar</h3>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-center text-text/80">
          {biweeklyDays.length > 0 && 
            biweeklyDays[0].fullDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          }
        </p>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
            <div key={dayName} className="text-xs text-text/60 text-center font-medium">
              {dayName}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {biweeklyDays.map((day, i) => (
            <div
              key={i}
              className={`aspect-square text-center flex items-center justify-center text-sm rounded-lg transition-colors ${
                day.isToday 
                  ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30' 
                  : 'hover:bg-primary/10 text-text/70 hover:text-text'
              }`}
            >
              {day.date}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BiweeklyCalendar;
