import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";
import FriendsSection from "./herosection/friendsSection";
import BiweeklyCalendar from "./herosection/biweeklyCalendar";
import RoomUpdates from "./herosection/roomUpdates";
import TodaysTaskBlock from "./herosection/todaysTaskBlock";
import MobileView from "./herosection/mobileView";
import { apiClient } from "../../../services/api";

// Custom hook to track window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export default function Hero() {
  const [activeTab, setActiveTab] = useState("tasks"); 
  const [greeting, setGreeting] = useState("");
  const [biweeklyDays, setBiweeklyDays] = useState([]);
  const [userName, setUserName] = useState("User");
  const { width } = useWindowSize();

  // Load user name from localStorage
  useEffect(() => {
    const loadUserName = () => {
      const user = apiClient.getUser();
      if (user && user.name) {
        // Get first name only
        const firstName = user.name.split(' ')[0];
        setUserName(firstName);
      }
    };

    loadUserName();

    // Listen for storage changes
    window.addEventListener('storage', loadUserName);
    return () => window.removeEventListener('storage', loadUserName);
  }, []);

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon");
      } else if (hour >= 17 && hour < 23) {
        setGreeting("Good evening");
      } else {
        setGreeting("Good night");
      }

      const today = new Date();
      const currentDay = today.getDay();
      const mondayOfThisWeek = new Date(today);
      
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
      mondayOfThisWeek.setDate(today.getDate() - daysToSubtract);

      const days = [];
      for (let i = 0; i < 14; i++) {
        const day = new Date(mondayOfThisWeek);
        day.setDate(mondayOfThisWeek.getDate() + i);
        
        const isToday = day.toDateString() === today.toDateString();
        
        days.push({
          date: day.getDate(),
          day: day.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday: isToday,
          fullDate: day
        });
      }
      
      setBiweeklyDays(days);
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  const welcomeVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return <Sunrise size={20} className="text-yellow-400" />;
    } else if (hour >= 12 && hour < 17) {
      return <Sun size={20} className="text-orange-400" />;
    } else if (hour >= 17 && hour < 21) {
      return <Sunset size={20} className="text-orange-500" />;
    } else {
      return <Moon size={20} className="text-blue-400" />;
    }
  };

  const isMobile = width < 720;

  return (
    <>
      {isMobile ? (
        <MobileView 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          tabVariants={tabVariants} 
          biweeklyDays={biweeklyDays} 
        />
      ) : (
        <div className="ml-20 p-4 space-y-6">
          <motion.div
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getGreetingIcon()}
                <h1 className="text-2xl lg:text-3xl font-bold text-text">
                  {greeting}, <span className="text-primary">{userName}</span>!
                </h1>
              </div>
            </div>
          </motion.div>

          {/* Responsive Grid Layout */}
          <div 
            className="grid gap-4 
            2xl:grid-cols-12
            lg:grid-cols-7 md:grid-cols-6"
            style={{ gridTemplateRows: 'max-content 1fr' }}
          >
            
            {/* Today's Tasks Block */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="
                2xl:col-span-8 2xl:row-span-2
                lg:col-span-5 lg:row-span-2 md:col-span-6 md:row-span-1"
            >
              <TodaysTaskBlock cardVariants={cardVariants} customIndex={0} />
            </motion.div>

            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="
                2xl:col-span-2 2xl:row-span-1
                lg:col-span-2 lg:row-span-1 md:col-span-3 md:row-span-1"
            >
              <FriendsSection />
            </motion.div>

            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="
                2xl:col-span-2 2xl:row-span-1
                lg:col-span-2 lg:row-span-1 md:col-span-3 md:row-span-1"
            >
              <BiweeklyCalendar 
                biweeklyDays={biweeklyDays} 
                cardVariants={cardVariants} 
                customIndex={2} 
              />
            </motion.div>

            {/* Room Updates */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="
                2xl:col-span-4 2xl:row-span-1
                lg:col-span-7 md:col-span-6 h-full flex flex-col"
            >
              <RoomUpdates cardVariants={cardVariants} customIndex={3} />
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
}
