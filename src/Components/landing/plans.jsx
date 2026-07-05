import React from "react";
import { motion } from "framer-motion";

export default function Plans() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.div
      className=" mt-40 px-6 py-16 text-text transition-colors duration-300"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-3xl font-bold text-center mb-12 text-primary"
        variants={titleVariants}
      >
        Pricing Plans
      </motion.h2>

      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
        
        <motion.div
          className="rounded-xl p-8 border border-primary flex flex-col bg-background/60 transition-colors duration-300 relative overflow-hidden"
          variants={cardVariants}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 0 30px rgba(var(--color-primary-rgb), 0.4)",
            transition: { duration: 0.3 }
          }}
          whileTap={{ scale: 0.98 }}
          style={{
            boxShadow: '0 0 15px rgba(var(--color-primary-rgb), 0.3)'
          }}
        >
          <motion.div
            className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-primary rounded-full"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />

          <div>
            <motion.h3
              className="text-2xl font-bold mb-4 text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Free
            </motion.h3>
            
            <motion.p
              className="text-text/70 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Start your journey. All the essential tools, totally free.
            </motion.p>
            
            <motion.ul 
              className="space-y-2 text-text/80"
              initial="hidden"
              animate="visible"
            >
              {[
                "✅ AI-Curated Map included",
                "✅ Join Learning Rooms", 
                "✅ Track Daily Progress",
                "🚫 Limited Room Creation"
              ].map((feature, i) => (
                <motion.li
                  key={i}
                  custom={i}
                  variants={featureVariants}
                >
                  {feature}
                </motion.li>
              ))}
            </motion.ul>
          </div>
          
          <motion.a
            href="/signup"
            className="mt-8 block text-center px-6 py-3 rounded-lg font-semibold bg-primary text-alt transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(var(--color-primary-rgb), 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{
              boxShadow: '0 0 12px rgba(var(--color-primary-rgb), 0.5)'
            }}
          >
            Start Free
          </motion.a>
        </motion.div>

        <motion.div
          className="rounded-xl p-8 border border-text/30 relative overflow-hidden flex flex-col bg-background/50 transition-colors duration-300"
          variants={cardVariants}
          whileHover={{
            scale: 1.02,
            borderColor: "rgba(var(--color-text-rgb), 0.4)",
            transition: { duration: 0.3 }
          }}
          style={{ opacity: 0.8 }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-lg font-semibold bg-background/60 backdrop-blur-sm text-text z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <motion.span
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Coming Soon
            </motion.span>
          </motion.div>
          
          <div className="relative z-0">
            <motion.h3
              className="text-2xl font-bold mb-4 text-text/80"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Premium
            </motion.h3>
            
            <motion.p
              className="text-text/60 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Boost your learning with more power and smart practice.
            </motion.p>
            
            <ul className="space-y-2 text-text/60">
              {[
                "🚀 Everything in Free",
                "🚀 AI-Curated Quizzes",
                "🚀 Unlimited Room Creation", 
                "🚀 Priority Support"
              ].map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.6, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 0.4 }}
                >
                  {feature}
                </motion.li>
              ))}
            </ul>
          
            <motion.button
              disabled
              className="mt-8 block w-full px-6 py-3 rounded-lg font-semibold bg-text/20 text-text/60 cursor-not-allowed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              Coming Soon
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl p-8 border border-text/30 relative overflow-hidden flex flex-col bg-background/50 transition-colors duration-300"
          variants={cardVariants}
          whileHover={{
            scale: 1.02,
            borderColor: "rgba(var(--color-text-rgb), 0.4)",
            transition: { duration: 0.3 }
          }}
          style={{ opacity: 0.8 }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-lg font-semibold bg-background/60 backdrop-blur-sm text-text z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <motion.span
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              Coming Soon
            </motion.span>
          </motion.div>
          
          <div className="relative z-0">
            <motion.h3
              className="text-2xl font-bold mb-4 text-text/80"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Teacher
            </motion.h3>
            
            <motion.p
              className="text-text/60 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Designed for educators—manage large communities & unlock analytics.
            </motion.p>
            
            <ul className="space-y-2 text-text/60">
              {[
                "📚 Everything in Premium",
                "📚 Lift Room Creation Limit (unlimited groups)",
                "📚 Advanced Room Analytics",
                "📚 Student Progress Monitoring"
              ].map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.6, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 0.4 }}
                >
                  {feature}
                </motion.li>
              ))}
            </ul>
          
            <motion.button
              disabled
              className="mt-8 block w-full px-6 py-3 rounded-lg font-semibold bg-text/20 text-text/60 cursor-not-allowed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              Coming Soon
            </motion.button>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
