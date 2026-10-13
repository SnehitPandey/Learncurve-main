import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Calendar, Trophy, Target, Github, Linkedin, Twitter, Globe, Download, Share2, MapPin, Link2, Users, Loader2, Eye } from "lucide-react";
import Toggletheme from "../../Components/elements/toggletheme";
import AchievementIcon from "../../Components/elements/AchievementIcon";
import { getPublicUserProfile, getUserProfile, getCVDownloadUrl } from "../../api/users";

// Null-safe: a blank or double-spaced name used to produce an empty segment.
const getInitials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

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

// Only rendered for links the API actually returned — an empty href produced a
// dead <a href=""> that reloaded the current page.
const SocialLink = ({ href, icon: Icon, label }) => {
  if (!href) return null;
  return (
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
};

const PublicProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        // If route is /profile (own page) username param may be undefined → show own profile
        const res = username
          ? await getPublicUserProfile(username.replace(/^@/, ""))
          : await getUserProfile();
        const u = res?.user || res?.profile || res;
        if (!mounted) return;
        if (!u || (!u.name && !u.username)) {
          setLoadError("Profile not found.");
          setUser(null);
        } else {
          const clean = (username || u.username || "learner").replace(/^@/, "");
          // getPublicProfile returns: id, username, name, bio, location, avatarUrl,
          // currentStreak, longestStreak, totalHours, completedLessons, hasCv,
          // cvLastUpdated, isCvPublic, totalRooms, createdAt. It does NOT return
          // interests or any social handles.
          const createdAt = u.createdAt || u.created_at;
          const hasCv = u.hasCv ?? Boolean(u.cvUrl || u.cv_url);
          const cvUpdated = u.cvLastUpdated || u.cv_last_updated;
          setUser({
            name: u.name || "Learner",
            username: `@${clean}`,
            initials: getInitials(u.name || "LE"),
            avatarColor: "bg-primary",
            avatarUrl: u.avatarUrl || "",
            online: true,
            joinedDate: createdAt
              ? new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : "",
            bio: u.bio || "",
            location: u.location || "",
            currentStreak: u.currentStreak ?? 0,
            longestStreak: u.longestStreak ?? 0,
            completedLessons: u.completedLessons ?? 0,
            totalStudyHours: Math.round(u.totalHours ?? 0),
            totalRooms: u.totalRooms ?? 0,
            studyTopics: Array.isArray(u.interests) ? u.interests : [],
            socialLinks: {
              github: u.github || "",
              linkedin: u.linkedin || "",
              twitter: u.twitter || "",
              website: u.website || "",
            },
            achievements: (res?.achievements || u.achievements || []).map((a, i) => ({
              id: a.id || i,
              title: a.achievement?.title || a.title || "Achievement",
              description: a.achievement?.description || a.description || "",
              icon: a.achievement?.icon || a.icon || "🏆",
              date: a.earned_at ? new Date(a.earned_at).toLocaleDateString() : "",
              public: true,
            })),
            hasCV: hasCv,
            cvLastUpdated: cvUpdated ? new Date(cvUpdated).toLocaleDateString() : "",
            rawUsername: clean,
          });
        }
      } catch (err) {
        if (mounted) { setLoadError(err?.message || "Could not load profile."); setUser(null); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center md:ml-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 md:ml-20 text-center px-6">
        <p className="text-text text-lg font-semibold">{loadError || "Profile not found."}</p>
        <button onClick={() => navigate("/home")} className="px-4 py-2 rounded-xl bg-primary text-background text-sm font-medium">Back Home</button>
      </div>
    );
  }

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

  const handleDownloadCV = async () => {
    try {
      const data = await getCVDownloadUrl(user.rawUsername);
      const url = data?.url || data?.downloadUrl || data?.cvUrl;
      if (url) {
        window.open(url, "_blank", "noopener");
      } else {
        alert("No public CV available for this profile.");
      }
    } catch (err) {
      alert(err?.message || "CV download unavailable.");
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.name}'s Study Profile`,
        text: `Check out ${user.name}'s learning progress!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

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
                      referrerPolicy="no-referrer"
                      className="w-32 h-32 rounded-full object-cover shadow-xl border-2 border-primary/40"
                      onError={() => {
                        setUser(prev => ({ ...prev, avatarUrl: "" }));
                      }}
                    />
                  ) : (
                    <div
                      className={`w-32 h-32 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-4xl font-bold shadow-xl`}
                    >
                      {user.initials}
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-background" />
                    </div>
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
                    {user.joinedDate && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Joined {user.joinedDate}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-text/80 max-w-2xl mb-6">{user.bio}</p>
                  )}

                  {/* Only render handles the user actually set — an <a href=""> is a dead link. */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    {user.socialLinks.github && (
                      <SocialLink
                        href={user.socialLinks.github}
                        icon={Github}
                        label="GitHub Profile"
                      />
                    )}
                    {user.socialLinks.linkedin && (
                      <SocialLink
                        href={user.socialLinks.linkedin}
                        icon={Linkedin}
                        label="LinkedIn Profile"
                      />
                    )}
                    {user.socialLinks.twitter && (
                      <SocialLink
                        href={user.socialLinks.twitter}
                        icon={Twitter}
                        label="Twitter Profile"
                      />
                    )}
                    {user.socialLinks.website && (
                      <SocialLink
                        href={user.socialLinks.website}
                        icon={Globe}
                        label="Personal Website"
                      />
                    )}
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
                    {user.cvLastUpdated
                      ? `Get resume • Updated ${user.cvLastUpdated}`
                      : "Get resume"}
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
                onClick={handleShareProfile}
                className="p-4 rounded-xl border border-text/20 hover:border-primary/30 bg-background/40 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Link2 size={20} className="text-primary" />
                  <span className="font-medium text-text">Share Link</span>
                </div>
                <p className="text-xs text-text/60">Copy this learner's profile link</p>
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
                <div className="flex flex-wrap gap-3">
                  {user.studyTopics.length > 0 ? (
                    user.studyTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-2"
                      >
                        <BookOpen size={16} />
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-text/60">
                      This learner has not published any focus areas yet.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Achievements — this section did not exist at all. The page already
                fetched and mapped the user's achievements into state (with their
                icon names intact) and then rendered none of them, so the public
                profile had no badges on it despite holding the data. */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <Trophy className="text-primary" />
                Achievements
              </h2>
              <div className="p-6 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm">
                {(user.achievements || []).length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {user.achievements.map((ach) => (
                      <div
                        key={ach.id || ach.key || ach.title}
                        className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5"
                      >
                        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <AchievementIcon icon={ach.icon} size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text text-sm">{ach.title}</p>
                          {ach.description ? (
                            <p className="text-xs text-text/60">{ach.description}</p>
                          ) : null}
                          {ach.date ? (
                            <p className="text-[11px] text-text/40 mt-0.5">
                              Earned {ach.date}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text/60">
                    No achievements unlocked yet.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
