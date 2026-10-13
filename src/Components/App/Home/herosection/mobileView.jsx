import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Activity, Calendar } from "lucide-react";
import FriendsSection from "./friendsSection";
import TodaysTaskBlock from "./todaysTaskBlock";
import RoomUpdates from "./roomUpdates";

const MobileView = ({ activeTab, setActiveTab, tabVariants, biweeklyDays }) => {
  return (
    <div className="md:hidden lg:hidden space-y-6">
      <div className="flex rounded-xl border border-text/20 bg-background/50 p-1 mx-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "tasks"
              ? "bg-primary text-alt"
              : "text-text/70 hover:text-text"
          }`}
        >
          <BookOpen size={16} />
          Today's Tasks
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-alt"
              : "text-text/70 hover:text-text"
          }`}
        >
          <Activity size={16} />
          Overview
        </motion.button>
      </div>

      <motion.div
        key={activeTab}
        variants={tabVariants}
        initial="hidden"
        animate="visible"
      >
        {activeTab === "tasks" ? (
          <div className="mx-4">
            <TodaysTaskBlock customIndex={0} />
          </div>
        ) : (
          <div className="space-y-4 mx-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FriendsSection />

              <div className="p-4 rounded-2xl border border-primary/30 bg-background/50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-primary" />
                  <h3 className="text-sm font-medium text-primary">Biweekly Calendar</h3>
                </div>
                <div className="text-xs text-text/70">
                  <p className="mb-2 font-medium text-center">
                    {biweeklyDays.length > 0 && 
                      biweeklyDays[0].fullDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    }
                  </p>
                  
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
                      <div key={dayName} className="text-xs text-text/50 text-center font-medium">
                        {dayName}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {biweeklyDays.map((day, i) => (
                      <div
                        key={i}
                        className={`h-8 rounded text-center leading-8 text-xs ${
                          day.isToday 
                            ? 'bg-primary text-alt font-bold' 
                            : 'hover:bg-text/10 text-text/70'
                        }`}
                      >
                        {day.date}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <RoomUpdates customIndex={1} />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MobileView;
