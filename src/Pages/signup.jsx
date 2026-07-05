import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const [error, setError] = useState("");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint
    console.log('🔍 Redirecting to Google OAuth endpoint');
    window.location.href = import.meta.env.DEV
      ? `/auth/google`
      : (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/auth/google` : `/auth/google`);
  };

  const GoogleButton = ({ text }) => {
    return (
      <motion.button
        type="button"
        onClick={handleGoogleSignup}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-text/20 rounded-xl 
                   bg-background text-text font-medium shadow-sm 
                   hover:bg-alt/50 transition-colors duration-300"
      >
        <img src="/assets/icons/google.png" alt="Google" className="w-5 h-5" />
        {text}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="p-8 rounded-2xl shadow-lg bg-background/60 backdrop-blur-lg border border-text/20 space-y-6">

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-2">
              Join LearnCurve
            </h2>
            <p className="text-text/70">
              Create your account to start learning
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <GoogleButton text="Sign up with Google" />

          <p className="text-xs text-text/60 text-center mt-4">
            More Signup options coming soon..
          </p>

          <p className="text-xs text-text/60 text-center mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>

          <div className="text-center mt-6">
            <p className="text-sm text-text/60">
              Already have an account?{" "}
              <NavLink
                to="/login"
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                Sign In
              </NavLink>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
