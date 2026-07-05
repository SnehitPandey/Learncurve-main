import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const missionRef = useRef(null);
  const isMissionInView = useInView(missionRef, { once: true, margin: "-50px" });
  
  const storyRef = useRef(null);
  const isStoryInView = useInView(storyRef, { once: true, margin: "-50px" });
  
  const teamRef = useRef(null);
  const isTeamInView = useInView(teamRef, { once: true, margin: "-50px" });

  const teamMembers = [
    // {
    //   name: "Nishant",
    //   alias: "callmenixsh",
    //   github: "https://github.com/callmenixsh",
    //   linkedin: "https://linkedin.com/in/callmenixsh",
    //   image: "/assets/images/cat-rol.gif", 
    // },
    // {
    //   name: "Ashutosh Jha",
    //   alias: "as018",
    //   github: "https://github.com/As190704",
    //   linkedin: "https://www.linkedin.com/in/ashutosh-jha-9294a81b6/",
    //   image: "/assets/images/ashutosh.png", 
    // },    
    {
      name: "Snehit Pandey",
      alias: "snehit pandey", 
      github: "https://github.com/SnehitPandey",
      linkedin: "https://www.linkedin.com/in/snehit-pandey-315a36293?originalSubdomain=in",
      image: "/assets/images/snehit.jpg", 
    },
  ];

  return (
    <div className="min-h-screen  text-text transition-colors duration-300 pt-16">

      <motion.section 
        ref={ref}
        className="max-w-6xl mx-auto px-6 py-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold mb-6 text-primary"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          About Learncurve
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl text-text/70 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Learncurve is your personalized learning companion — helping you craft
          AI-powered roadmaps, join collaborative communities, and stay motivated
          while achieving your learning goals.
        </motion.p>
      </motion.section>

      <motion.section 
        ref={missionRef}
        className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 py-12"
        initial={{ opacity: 0 }}
        animate={isMissionInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="p-6 rounded-xl bg-background shadow-lg border border-primary/20 transition-colors hover:border-primary/40 hover:shadow-xl duration-300"
          initial={{ opacity: 0, x: -30 }}
          animate={isMissionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-primary">
            Our Mission
          </h2>
          <p className="text-text/80 leading-relaxed">
            To make learning engaging, social, and effective by combining modern
            AI tools with the power of peer collaboration. We want to make it
            possible for anyone to learn new skills — faster and smarter.
          </p>
        </motion.div>
        
        <motion.div 
          className="p-6 rounded-xl bg-background shadow-lg border border-primary/20 transition-colors hover:border-primary/40 hover:shadow-xl duration-300"
          initial={{ opacity: 0, x: 30 }}
          animate={isMissionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-primary">
            Our Vision
          </h2>
          <p className="text-text/80 leading-relaxed">
            A world where motivated learners can instantly connect with like-minded
            individuals, follow clear and structured roadmaps, and measure progress
            together — building communities that support lifelong growth.
          </p>
        </motion.div>
      </motion.section>

      <motion.section 
        ref={storyRef}
        className="bg-background/50 py-16 mt-10 transition-colors"
        initial={{ opacity: 0, y: 30 }}
        animate={isStoryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.h2 
            className="text-3xl font-bold mb-8 text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={isStoryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            How We Got the Idea
          </motion.h2>
          <motion.p 
            className="text-lg text-text/80 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isStoryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            We noticed that many students lose excitement for learning because they're often
            studying alone. Without someone beside them to share the journey, staying
            motivated can be tough.<br />
            <br />
            That's when we thought — what if learning could feel more like a
            shared adventure?<br />
            Learncurve was created to give learners a sense of assurance that
            they're not alone, while also guiding them through clear, personalized roadmaps.
            By connecting students with peers and providing constant direction,
            we make learning both productive and enjoyable.
          </motion.p>
        </div>
      </motion.section>

<motion.section 
  ref={teamRef}
  className="max-w-6xl mx-auto px-6 py-16 text-center"
>
  <motion.h2 
    className="text-3xl font-bold mb-6 text-primary"
    initial={{ opacity: 0, y: 20 }}
    animate={isTeamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
    transition={{ duration: 0.4 }}
  >
    Meet The Developer
  </motion.h2>
  
  <motion.p 
    className="text-text/70 mb-10 max-w-3xl mx-auto"
    initial={{ opacity: 0, y: 15 }}
    animate={isTeamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
    transition={{ delay: 0.1, duration: 0.4 }}
  >
    We're a passionate group of developers, designers, and educators dedicated
    to making learning accessible, collaborative, and enjoyable for everyone.
  </motion.p>
  
  <div className="flex flex-wrap justify-center gap-8">
    {teamMembers.map((member, idx) => (
      <motion.div
        key={member.name}
        className="w-48 p-4 bg-background rounded-xl shadow-md border border-primary/20 transition-all duration-200 hover:border-primary/40 hover:shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={isTeamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ 
          duration: 0.3,
          ease: "easeOut"
        }}
        whileHover={{ 
          boxShadow: '0 8px 25px rgba(var(--color-primary-rgb), 0.15)',
          transition: { duration: 0.1 }
        }}
      >
        <img
          src={member.image}
          alt={`${member.name} profile`}
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
        />
        <h3 className="text-lg font-semibold text-center">{member.name}</h3>
        {member.alias && (
          <p className="text-center text-sm text-text/60 mb-2">
            @{member.alias}
          </p>
        )}
        <p className="text-primary text-sm text-center mb-4 font-medium">
          {member.post}
        </p>
        <div className="flex justify-center space-x-4">
          <motion.a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} GitHub`}
            className="text-text/60 hover:text-primary transition-colors duration-200"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <img src="/assets/icons/github.png" alt="GitHub" className="w-6 h-6" />
          </motion.a>
          <motion.a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} LinkedIn`}
            className="text-text/60 hover:text-primary transition-colors duration-200"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <img src="/assets/icons/linkedin.png" alt="LinkedIn" className="w-6 h-6" />
          </motion.a>
        </div>
      </motion.div>
    ))}
  </div>
</motion.section>

    </div>
  );
}
