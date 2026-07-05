import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Activity, CheckCircle, Users, Bell, Calendar } from "lucide-react";
import FriendsSection from "./friendsSection";

const MobileView = ({ activeTab, setActiveTab, tabVariants, biweeklyDays }) => {
  return (
    <div className="md:hidden lg:hidden space-y-6">
      <div className="flex rounded-xl border border-text/20 bg-background/50 p-1">
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
          <div className="p-6 rounded-2xl border border-primary/40 bg-background/50 backdrop-blur-sm mx-4"
               style={{
                 boxShadow: '0 0 20px rgba(var(--color-primary-rgb), 0.15)'
               }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <h2 className="text-xl font-bold text-primary">Today's Task Block</h2>
            </div>
            
            <div className="space-y-4">
              <div className="text-text/90">
                <p className="text-lg font-medium">"Lesson 3: JavaScript Loops - 15 mins"</p>
                <p className="text-sm text-text/70">Start button with timer + check-off system</p>
              </div>

              <div className="flex items-center gap-2 text-primary">
                <CheckCircle size={16} />
                <span className="font-medium">Daily Quiz Available</span>
              </div>
              <p className="text-sm text-text/70">"5-question checkpoint quiz ready"</p>
              <p className="text-sm text-text/70">Completion meter for the day</p>

              <div className="flex items-center gap-2 text-blue-400">
                <Users size={16} />
                <span className="text-sm">"Resume with your group"</span>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-text/10">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <Bell size={16} />
                  <span className="font-medium text-sm">Smart reminders:</span>
                </div>
                <p className="text-sm text-text/70">"You missed yesterday — catch up today in 20 mins"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mx-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
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

            <div className="p-4 rounded-2xl border border-primary/30 bg-background/50">
              <h3 className="text-sm font-medium text-primary mb-2">Updates about rooms</h3>
              <div className="text-sm text-text/70">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-text/5">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span>"3 users in your room completed today's lesson"</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-text/5">
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                  <span>"Sarah shared her notes on Lesson 2"</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-text/5">
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                  <span>"Your groupmate Raj encouraged someone falling behind"</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MobileView;
