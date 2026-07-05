import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  BookOpen,
  Calendar,
  Trophy,
  Target,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Download,
  Share2,
  Eye,
  Users,
  Clock,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import Toggletheme from "../../Components/elements/toggletheme";
import { apiClient } from "../../services/api";

const PublicProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current theme for icon display
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

  // Fetch user data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.request(`/api/users/username/${username}`);
        
        if (response.success && response.user) {
          // Transform API data to component format
          const userData = response.user;
          const initials = userData.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          
          setUser({
            name: userData.name,
            username: userData.username || `@${username}`,
            initials: initials,
            avatarUrl: userData.avatarUrl,
            hasCustomAvatar: userData.hasCustomAvatar,
            avatarColor: "bg-primary",
            online: false, // Can be enhanced with real-time presence later
            joinedDate: userData.joinedDate || "Recently",
            bio: userData.bio || "Learning and growing every day.",
            
            currentStreak: userData.stats?.currentStreak || 0,
            longestStreak: userData.stats?.longestStreak || 0,
            completedLessons: userData.stats?.completedLessons || 0,
            
            studyTopics: {
              ongoing: userData.studyTopics?.ongoing || [],
              completed: userData.studyTopics?.completed || [],
            },

            socialLinks: userData.socialLinks || {},

            hasCV: !!userData.resumeUrl,
            resumeUrl: userData.resumeUrl,
            cvLastUpdated: "Recently", // Can be enhanced with timestamp
          });
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

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
      className="p-4 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm"
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

  const handleDownloadCV = () => {
    if (user?.resumeUrl) {
      window.open(user.resumeUrl, '_blank');
    } else {
      alert("Resume not available");
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user?.name || 'User'}'s Study Profile`,
        text: `Check out ${user?.name || 'this user'}'s learning progress!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const handleContact = () => {
    // Open email or contact form
    alert('Contact feature coming soon!');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen px-6 py-6 pb-18 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen px-6 py-6 pb-18 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="mx-auto text-text/30 mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Profile Not Found</h2>
          <p className="text-text/60 mb-4">{error || 'User does not exist'}</p>
          <button
            onClick={() => navigate('/app')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6 pb-18">
      {/* Theme Toggle Button - Fixed Position */}
<Toggletheme/>
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Public Profile Badge */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 text-sm text-text/70"
          >
            <Eye size={16} />
            <span>Public Profile</span>
            <span className="px-2 py-1 rounded-full bg-green-400/20 text-green-600 text-xs">
              ● Available for opportunities
            </span>
          </motion.div>

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
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary rounded-full translate-x-20 translate-y-20" />
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover shadow-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-32 h-32 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-4xl font-bold shadow-xl ${user.avatarUrl ? 'hidden' : ''}`}
                  >
                    {user.initials}
                  </div>
                  {user.online && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-background" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold text-text mb-2">
                    {user.name}
                  </h1>

                  <p className="text-primary font-medium mb-2">
                    {user.username}
                  </p>

                  <div className="flex items-center gap-4 justify-center md:justify-start text-text/70 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Joined {user.joinedDate}</span>
                    </div>
                  </div>

                  <p className="text-text/80 max-w-2xl mb-6">{user.bio}</p>

                  {/* Social Links */}
                  {(user.socialLinks?.github || user.socialLinks?.linkedin || user.socialLinks?.twitter || user.socialLinks?.website) && (
                    <div className="flex gap-3 justify-center md:justify-start">
                      {user.socialLinks?.github && (
                        <SocialLink
                          href={user.socialLinks.github}
                          icon={Github}
                          label="GitHub Profile"
                        />
                      )}
                      {user.socialLinks?.linkedin && (
                        <SocialLink
                          href={user.socialLinks.linkedin}
                          icon={Linkedin}
                          label="LinkedIn Profile"
                        />
                      )}
                      {user.socialLinks?.twitter && (
                        <SocialLink
                          href={user.socialLinks.twitter}
                          icon={Twitter}
                          label="Twitter Profile"
                        />
                      )}
                      {user.socialLinks?.website && (
                        <SocialLink
                          href={user.socialLinks.website}
                          icon={Globe}
                          label="Personal Website"
                        />
                      )}
                    </div>
                  )}
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
              Connect & Collaborate
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {user.hasCV && (
                <button
                  onClick={handleDownloadCV}
                  className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Download size={20} className="text-primary" />
                    <span className="font-medium text-text">Download CV</span>
                  </div>
                  <p className="text-xs text-text/60">
                    Get resume • Updated {user.cvLastUpdated}
                  </p>
                </button>
              )}

              <button
                onClick={handleShareProfile}
                className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Share2 size={20} className="text-primary" />
                  <span className="font-medium text-text">Share Profile</span>
                </div>
                <p className="text-xs text-text/60">Share this profile with others</p>
              </button>

              <button
                onClick={handleContact}
                className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Mail size={20} className="text-primary" />
                  <span className="font-medium text-text">Contact</span>
                </div>
                <p className="text-xs text-text/60">Get in touch via email</p>
              </button>
            </div>
          </motion.div>

          <div className="gap-8">
            {/* Study Topics */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
                <BookOpen className="text-primary" />
                Study Focus Areas
              </h2>
              <div className="p-6 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm">
                <div className="space-y-6">
                  {/* Ongoing Topics */}
                  {user.studyTopics.ongoing.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                        <Clock size={20} className="text-primary" />
                        Currently Learning
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {user.studyTopics.ongoing.map((topic) => (
                          <span
                            key={`ongoing-${topic}`}
                            className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-2"
                          >
                            <BookOpen size={16} />
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Topics */}
                  {user.studyTopics.completed.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                        <Trophy size={20} className="text-green-500" />
                        Completed
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {user.studyTopics.completed.map((topic) => (
                          <span
                            key={`completed-${topic}`}
                            className="px-4 py-2 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-medium flex items-center gap-2"
                          >
                            <Trophy size={16} />
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {user.studyTopics.ongoing.length === 0 && user.studyTopics.completed.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen size={48} className="mx-auto text-text/30 mb-3" />
                      <p className="text-text/60">No study topics yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
