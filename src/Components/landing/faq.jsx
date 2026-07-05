import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

export default function FAQ() {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const faqs = [
    { q: "What is Learncurve?", a: "Learncurve helps you create personalized learning roadmaps and join collaborative rooms to learn with others." },
    { q: "Is it free to use?", a: "Yes! We offer a free plan with core features. Premium features will be available soon." },
    { q: "Can I create my own rooms?", a: "Yes, you can create public or private rooms and invite others with similar interests." },
    { q: "What makes Learncurve different?", a: "We combine AI-curated learning maps with collaborative study rooms and progress tracking for a unique group learning experience." },
    { q: "Do I need to install anything?", a: "No installation is required — Learncurve works directly in your browser, and is also optimised for mobile use." },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }
    }
  };

  const faqItemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const answerContainerVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      transition: {
        height: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] },
        opacity: { duration: 0.25 },
        marginTop: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }
      }
    },
    visible: {
      height: "auto",
      opacity: 1,
      marginTop: 16,
      transition: {
        height: { duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] },
        opacity: { duration: 0.35, delay: 0.15 },
        marginTop: { duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }
      }
    }
  };

  const answerTextVariants = {
    hidden: { 
      y: -10, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.4, 
        delay: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const iconVariants = {
    closed: { 
      rotate: 0,
      scale: 1,
      transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
    },
    open: { 
      rotate: 225,
      scale: 1.1,
      transition: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }
    }
  };

  const hoverVariants = {
    rest: {
      borderColor: "rgba(var(--color-primary-rgb), 0.2)",
      backgroundColor: "rgba(var(--color-background-rgb), 1)",
      scale: 1,
      transition: { duration: 0.2 }
    },
    hover: {
      borderColor: "rgba(var(--color-primary-rgb), 0.4)",
      backgroundColor: "rgba(var(--color-primary-rgb), 0.05)",
      scale: 1.01,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      ref={ref}
      className=" px-6 py-8 mt-40 text-text transition-colors duration-300 "
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <motion.h2
        className="text-3xl font-bold text-center mb-12 text-primary"
        variants={titleVariants}
      >
        Frequently Asked Questions
      </motion.h2>

      <div className="max-w-4xl mx-auto space-y-4">
        {faqs.map((faq, idx) => (
          <motion.div
            key={idx}
            className="rounded-lg border border-text/30 p-5 cursor-pointer overflow-hidden bg-background/40"
            variants={faqItemVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            animate={hoverVariants}
            onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
            layout
          >
            <div className="flex justify-between items-center">
              <motion.h3
                className="text-lg font-semibold pr-4"
                animate={{
                  color: activeFAQ === idx
                    ? "rgba(var(--color-primary-rgb), 1)"
                    : "rgba(var(--color-text-rgb), 1)"
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {faq.q}
              </motion.h3>

              <motion.span
                className="text-2xl leading-none select-none text-primary font-light min-w-[28px] h-[28px] flex items-center justify-center"
                variants={iconVariants}
                animate={activeFAQ === idx ? "open" : "closed"}
              >
                +
              </motion.span>
            </div>

            <AnimatePresence mode="wait">
              {activeFAQ === idx && (
                <motion.div
                  variants={answerContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="overflow-hidden"
                >
                  <motion.p
                    className="text-text/70 leading-relaxed"
                    variants={answerTextVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    {faq.a}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}
