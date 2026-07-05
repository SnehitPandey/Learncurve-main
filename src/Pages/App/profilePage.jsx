import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getUserAvatarUrl } from "../../utils/imageUtils";
import {
  User,
  Mail,
  BookOpen,
  Calendar,
  Trophy,
  Target,
  Clock,
  Edit3,
  Settings,
  Award,
  TrendingUp,
  Users,
  Camera,
  Github,
  Linkedin,
  Twitter,
  Globe,
  ExternalLink,
  Upload,
  Share2,
  MessageCircle,
} from "lucide-react";
import { apiClient } from "../../services/api";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studyTopics, setStudyTopics] = useState({ ongoing: [], completed: [] });
  const [topicsLoading, setTopicsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch real user data
  useEffect(() => {
    const loadUserData = () => {
      try {
        const currentUser = apiClient.getUser();
        if (currentUser) {
          setUserData(currentUser);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load user data:', error);
        setLoading(false);
      }
    };

    loadUserData();

    // Listen for storage changes
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, []);

  // Fetch user's study topics from rooms
  useEffect(() => {
    const fetchStudyTopics = async () => {
      try {
        const response = await apiClient.request('/api/rooms/my-study-topics');
        if (response.success && response.topics) {
          setStudyTopics(response.topics);
        }
      } catch (error) {
        console.error('Failed to fetch study topics:', error);
        // Keep empty arrays on error
      } finally {
        setTopicsLoading(false);
      }
    };

    if (userData) {
      fetchStudyTopics();
    }
  }, [userData]);

  // Helper function to get initials
  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ")
      .map((n) => n[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const user = {
    name: userData?.name || "Guest User",
    email: userData?.email || "guest@example.com",
    username: userData?.username ? `@${userData.username}` : `@${(userData?.name || "guest").toLowerCase().replace(/\s+/g, '')}`,
    initials: getInitials(userData?.name || "Guest User"),
    avatarColor: "bg-primary",
    avatarUrl: userData?.avatarUrl || null,
    online: true,
    joinedDate: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently",
    bio: userData?.bio || "Passionate learner focused on continuous growth and development.",
    location: "Online",

    currentStreak: 0, // TODO: Fetch from backend
    longestStreak: 0, // TODO: Fetch from backend
    completedLessons: 0, // TODO: Fetch from backend

    socialLinks: {
      github: userData?.socialLinks?.github || "",
      linkedin: userData?.socialLinks?.linkedin || "",
      twitter: userData?.socialLinks?.twitter || "",
      website: userData?.socialLinks?.website || "",
    },

    achievements: [
      // TODO: Fetch achievements from backend
    ],
  };

  // Simple fade-in animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const StatCard = ({ icon: Icon, label, value, color = "text-primary" }) => (
    <div
      className="p-4 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm transition-all duration-200"
      style={{
        boxShadow: "0 4px 20px rgba(var(--color-primary-rgb), 0.1)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon size={20} className={color} />
        </div>
        <div>
          <p className="text-2xl font-bold text-text">{value}</p>
          <p className="text-sm text-text/60">{label}</p>
        </div>
      </div>
    </div>
  );

  const SocialLink = ({ href, icon: Icon, label }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-3 rounded-xl bg-background/60 hover:bg-primary/10 border border-text/20 hover:border-primary/30 transition-all duration-200 group"
      title={label}
    >
      <Icon
        size={20}
        className="text-text/70 group-hover:text-primary transition-colors"
      />
    </a>
  );

  const handleUploadCV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log("Uploading CV:", file.name);
      }
    };
    input.click();
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Study Profile",
        text: "Check out my learning progress!",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

const handlePublicView = () => {
  const publicUrl = `/user/${user.username.replace("@", "")}`;
  window.open(publicUrl, '_blank');
};


  return (
    <div className="min-h-screen px-4 md:ml-24 pr-6 py-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header and Stats Grid */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Header Section */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-3 relative p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background/50 to-background/80 backdrop-blur-sm overflow-hidden"
              style={{
                boxShadow: "0 20px 40px rgba(var(--color-primary-rgb), 0.1)",
              }}
            >
              {/* Settings Button */}
              <NavLink
                to="/settings"
                className="absolute top-6 right-6 z-10 p-3 rounded-xl bg-background/60 hover:bg-primary/10 border border-text/20 hover:border-primary/30 transition-all duration-200"
                title="Settings"
              >
                <Settings size={20} className="text-text/70 hover:text-primary transition-colors" />
              </NavLink>

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary rounded-full translate-x-20 translate-y-20" />
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <div
                    className={`w-32 h-32 rounded-full ${getUserAvatarUrl(userData) ? 'overflow-hidden' : user.avatarColor} flex items-center justify-center text-white text-4xl font-bold shadow-xl`}
                  >
                    {getUserAvatarUrl(userData) ? (
                      <img 
                        src={getUserAvatarUrl(userData)} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add(user.avatarColor);
                          const initialsDiv = document.createElement('div');
                          initialsDiv.textContent = user.initials;
                          e.target.parentElement.appendChild(initialsDiv);
                        }}
                      />
                    ) : (
                      user.initials
                    )}
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-background" />
                  </div>

                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                    <h1 className="text-4xl font-bold text-text">
                      {user.name}
                    </h1>
                    <button
                      onClick={() => navigate('/settings?tab=profile')}
                      className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200"
                      title="Edit Profile"
                    >
                      <Edit3 size={20} className="text-primary" />
                    </button>
                  </div>

                  <p className="text-primary font-medium mb-2">
                    {user.username}
                  </p>

                  <div className="flex items-center gap-4 justify-center md:justify-start text-text/70 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Joined {user.joinedDate}</span>
                    </div>
                  </div>

                  <p className="text-text/80 max-w-2xl mb-6">{user.bio}</p>

                  {/* Social Links */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    <SocialLink
                      href={user.socialLinks.github}
                      icon={Github}
                      label="GitHub Profile"
                    />
                    <SocialLink
                      href={user.socialLinks.linkedin}
                      icon={Linkedin}
                      label="LinkedIn Profile"
                    />
                    <SocialLink
                      href={user.socialLinks.twitter}
                      icon={Twitter}
                      label="Twitter Profile"
                    />
                    <SocialLink
                      href={user.socialLinks.website}
                      icon={Globe}
                      label="Personal Website"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-1 space-y-4"
            >
              <StatCard
                icon={Trophy}
                label="Current Streak"
                value={`${user.currentStreak}🔥`}
              />
              <StatCard
                icon={Target}
                label="Longest Streak"
                value={user.longestStreak}
              />
              <StatCard
                icon={BookOpen}
                label="Lessons Done"
                value={user.completedLessons}
              />
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
              <Users className="text-primary" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={handleUploadCV}
                className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Upload size={20} className="text-primary" />
                  <span className="font-medium text-text">Upload CV</span>
                </div>
                <p className="text-xs text-text/60">Upload your resume/CV</p>
              </button>

              <button
                onClick={handleShareProfile}
                className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Share2 size={20} className="text-primary" />
                  <span className="font-medium text-text">Share Profile</span>
                </div>
                <p className="text-xs text-text/60">
                  Share your study progress
                </p>
              </button>

              <button
                onClick={handlePublicView}
                className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ExternalLink size={20} className="text-primary" />
                  <span className="font-medium text-text">Public View</span>
                </div>
                <p className="text-xs text-text/60">See public profile</p>
              </button>
            </div>
          </motion.div>

          {/* Study Topics */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
              <BookOpen className="text-primary" />
              Study Topics
            </h2>
            <div className="p-6 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm">
              {topicsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ongoing Topics */}
                  {studyTopics.ongoing.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                        <Clock size={20} className="text-primary" />
                        Ongoing Topics
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {studyTopics.ongoing.map((topic) => (
                          <span
                            key={`ongoing-${topic}`}
                            className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/30 transition-all duration-200 flex items-center gap-2"
                          >
                            <BookOpen size={16} />
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Topics */}
                  {studyTopics.completed.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                        <Trophy size={20} className="text-green-500" />
                        Completed Topics
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {studyTopics.completed.map((topic) => (
                          <span
                            key={`completed-${topic}`}
                            className="px-4 py-2 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-medium cursor-pointer hover:bg-green-500/30 transition-all duration-200 flex items-center gap-2"
                          >
                            <Trophy size={16} />
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {studyTopics.ongoing.length === 0 && studyTopics.completed.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen size={48} className="mx-auto text-text/30 mb-3" />
                      <p className="text-text/60 mb-2">No study topics yet</p>
                      <p className="text-sm text-text/40">
                        Join or create a study room to get started!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
