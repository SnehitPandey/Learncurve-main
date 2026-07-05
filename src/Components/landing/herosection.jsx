import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";

export default function Hero() {
  const { isAuthenticated } = useUser();
  const isLoggedIn = isAuthenticated;

  return (
    <motion.section
      className="min-h-[60vh] max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center px-6 md:px-16 transition-colors duration-300 text-text mt-40 mb-60"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="md:w-1/2 max-w-xl text-center md:text-left space-y-6">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-primary"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Learn Together, Build Your Future
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Create personalized learning roadmaps and join collaborative rooms to
          learn with like-minded peers and stay motivated.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center md:justify-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {isLoggedIn ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to="/home"
                className="block px-8 py-3 rounded-full font-semibold text-center transition-all duration-300 bg-primary text-alt hover:bg-primary/90"
                style={{
                  boxShadow: '0 0 15px rgba(var(--color-primary-rgb), 0.4)'
                }}
              >
                Go to Dashboard
              </NavLink>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to="/signup"
                className="block px-8 py-3 rounded-full font-semibold text-center transition-all duration-300 bg-primary text-alt hover:bg-primary/90"
                style={{
                  boxShadow: '0 0 15px rgba(var(--color-primary-rgb), 0.4)'
                }}
              >
                Get Started for Free
              </NavLink>
            </motion.div>
          )}

          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <NavLink
              to="/about"
              className="block px-8 py-3 rounded-full border font-semibold text-center transition-all duration-300 border-primary text-primary hover:bg-primary hover:text-alt"
            >
              Learn More
            </NavLink>
          </motion.div>
        </motion.div>
      </div>

      <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
        <motion.div
          className="w-80 h-80 rounded-3xl relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <motion.img
            src="/assets/icons/studytogether.png"
            alt="Learning collaboration illustration"
            className="w-full h-full object-contain rounded-3xl relative z-10"
            loading="lazy"
            animate={{
              y: [0, -25, 5, -15, 0],
              rotate: [0, -2, 3, -2, 0],
              skewX: [0, 2, -2, 2, 0],
              skewY: [0, -1, 2, -1, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.3, 0.6, 0.8, 1],
            }}
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
