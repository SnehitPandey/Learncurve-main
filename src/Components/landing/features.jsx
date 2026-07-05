import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

export default function Features() {
    const [active, setActive] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    
    const previewRef = useRef(null);
    const isPreviewInView = useInView(previewRef, { once: true, margin: "-100px" });

    const features = [
        {
            name: "Personalized Roadmaps",
            description: "Create tailored learning paths by setting goals, proficiency, time commitment, and preferences.",
            img: "/images/personalized-roadmaps.png",
        },
        {
            name: "Collaborative Learning Rooms",
            description: "Join rooms with like-minded learners. Share progress, chat, and stay motivated together.",
            img: "/images/collaborate.png",
        },
        {
            name: "Track Daily Progress & Reminders",
            description: "Keep on top of daily tasks, quizzes, and smart reminders to sync with your group effectively.",
            img: "/images/boost-progress.png",
        },
        {
            name: "Resource Library",
            description: "Access curated guides, notes, and checklists to support your learning journey.",
            img: "/images/resources.png",
        },
    ];

    const handleSelectFeature = (index) => {
        setActive(index);
        if (window.innerWidth < 960) {
            setModalOpen(true);
        }
    };

    return (
        <div
            ref={ref}
            className="mx-auto max-w-7xl mt-40 px-4 sm:px-6 lg:px-8 text-text transition-colors duration-300"
        >
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 xl:gap-8 min-h-[600px]">
                <aside
                    className={`w-full lg:w-80 xl:w-96 flex-shrink-0 py-10 px-6 md:px-8 flex flex-col gap-4 rounded-xl bg-background/60 border border-primary shadow-lg transition-all duration-400 ${
                        isInView 
                            ? 'opacity-100 translate-x-0' 
                            : 'opacity-0 -translate-x-12'
                    }`}
                    style={{
                        minHeight: `${Math.max(400, features.length * 120 + 200)}px`,
                        transitionDelay: isInView ? '0.05s' : '0s'
                    }}
                >
                    <h2 className={`mb-6 text-lg font-extrabold text-center tracking-wide text-primary transition-all duration-300 ${
                        isInView 
                            ? 'opacity-100 translate-y-0' 
                            : 'opacity-0 -translate-y-4'
                    }`}
                    style={{ transitionDelay: isInView ? '0.15s' : '0s' }}
                    >
                        EXPLORE FEATURES
                    </h2>

                    <div className="flex flex-col space-y-4 flex-grow">
                        {features.map((feat, idx) => (
                            <div
                                key={feat.name}
                                className={`transition-all duration-300 ${
                                    isInView 
                                        ? 'opacity-100 translate-x-0' 
                                        : 'opacity-0 -translate-x-8'
                                }`}
                                style={{ 
                                    transitionDelay: isInView ? `${0.2 + (idx * 0.05)}s` : '0s'
                                }}
                            >
                                <button
                                    onClick={() => handleSelectFeature(idx)}
                                    className={`w-full rounded-xl px-5 py-4 text-left flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary
                                        transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
                                        ${active === idx
                                            ? "bg-primary/20 border border-primary text-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.6)]"
                                            : "text-text/80 hover:bg-primary/60 hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)]"
                                        }`}
                                >
                                    <div className={`text-base font-semibold transition-colors duration-100 ${
                                        active === idx ? 'text-primary' : 'text-text/80'
                                    }`}>
                                        {feat.name}
                                    </div>
                                    <div className="text-sm mt-1 line-clamp-3 text-text/60">
                                        {feat.description}
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                <motion.main 
                    ref={previewRef}
                    className="hidden lg:flex flex-1 max-w-3xl flex-col justify-center items-center py-10 px-6"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={isPreviewInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ 
                        duration: 0.4, 
                        ease: "easeOut",
                        delay: isPreviewInView ? 0.1 : 0
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            className="flex flex-col items-center w-full"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -15 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            <motion.h3 
                                className="text-3xl font-bold mb-8 text-center text-primary"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05, duration: 0.2 }}
                            >
                                {features[active].name}
                            </motion.h3>

                            <motion.div
                                className="rounded-xl p-4 w-full bg-background/60 relative overflow-hidden"
                                style={{
                                    boxShadow: '0 0 50px 15px rgba(var(--color-primary-rgb), 0.25)'
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                whileHover={{ 
                                    scale: 1.03, 
                                    rotate: 1,
                                    boxShadow: '0 0 60px 20px rgba(var(--color-primary-rgb), 0.35)',
                                    transition: { duration: 0.2 }
                                }}
                            >
                                <img
                                    src={features[active].img}
                                    alt={features[active].name}
                                    className="w-full max-h-96 object-contain rounded-xl relative z-10"
                                    loading="lazy"
                                />
                            </motion.div>

                            <motion.p 
                                className="mt-8 max-w-2xl text-center text-text/70 text-lg leading-relaxed"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.2 }}
                            >
                                {features[active].description}
                            </motion.p>
                        </motion.div>
                    </AnimatePresence>
                </motion.main>
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 dark:bg-black/80 z-[60]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setModalOpen(false)}
                        />
                        
                        <motion.div
                            className="fixed inset-0 flex justify-center items-center z-[70] px-4 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-background rounded-xl max-w-lg w-full p-6 relative transition-colors duration-300 pointer-events-auto"
                                style={{
                                    boxShadow: '0 0 40px 15px rgba(var(--color-primary-rgb), 0.5)'
                                }}
                                initial={{ scale: 0.9, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 30 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className="absolute top-4 right-4 text-text hover:text-primary 
                                        transition-all duration-150 hover:scale-110 hover:rotate-90 active:scale-90"
                                    onClick={() => setModalOpen(false)}
                                    aria-label="Close preview"
                                >
                                    ×
                                </button>

                                <h3 className="text-2xl font-bold mb-4 text-primary">
                                    {features[active].name}
                                </h3>

                                <img
                                    src={features[active].img}
                                    alt={features[active].name}
                                    className="w-full max-h-64 object-contain rounded-lg"
                                    loading="lazy"
                                />

                                <p className="mt-4 text-text/80">
                                    {features[active].description}
                                </p>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
