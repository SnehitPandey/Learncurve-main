import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  BookOpen,
  Trophy,
  Target,
  Edit3,
  Settings,
  Award,
  Users,
  Camera,
  Github,
  Linkedin,
  Twitter,
  Globe,
  ExternalLink,
  Upload,
  Share2,
} from "lucide-react";
import { getUserProfileAndSync, updateUserProfile, uploadAvatar, uploadCV, getUserAchievements } from "../../api/users";
import { getMyRooms } from "../../api/rooms";
import AchievementIcon from "../../Components/elements/AchievementIcon";

// Null-safe: an empty or double-spaced name used to yield an empty segment and
// then throw on `n[0]`.
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
    style={{ boxShadow: "0 4px 20px rgba(var(--color-primary-rgb), 0.1)" }}
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
      <Icon size={20} className="text-text/70 group-hover:text-primary transition-colors" />
    </a>
  );
};

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", bio: "", location: "" });
  const avatarInputRef = React.useRef(null);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        return {
          name: u.name || "Learner",
          email: u.email || "",
          username: u.username ? `@${u.username}` : "@learner",
          initials: getInitials(u.name || "LE"),
          avatarUrl: u.avatarUrl || u.avatar_url || "",
          avatarColor: "bg-primary",
          online: true,
          joinedDate: "",
          bio: u.bio || "",
          location: u.education || "",
          currentStreak: u.currentStreak || 0,
          longestStreak: u.longestStreak || 0,
          completedLessons: u.completedLessons || 0,
          // getProfile does not return interests — keep this empty rather than
          // showing a fabricated topic list.
          studyTopics: Array.isArray(u.interests) ? u.interests : [],
          socialLinks: {
            github: u.github || "",
            linkedin: u.linkedin || "",
            twitter: u.twitter || "",
            website: u.website || "",
          },
          achievements: []
        };
      }
    } catch {
      // Corrupt/absent localStorage — fall through to the default identity.
    }
    return {
      name: "Learner",
      email: "",
      username: "@learner",
      initials: "LE",
      avatarUrl: "",
      avatarColor: "bg-primary",
      online: true,
      joinedDate: "",
      bio: "",
      location: "",
      currentStreak: 0,
      longestStreak: 0,
      completedLessons: 0,
      // The rooms the learner is actually enrolled in, loaded from /rooms/my.
      // This used to hold `interests` — the tags picked during onboarding — so
      // the section was empty for anyone who had joined a room but never edited
      // their profile, which is exactly backwards for a heading called "Study
      // Topics".
      studyTopics: [],
      socialLinks: {},
      achievements: []
    };
  });

  useEffect(() => {
    let cancelled = false;
    getUserProfileAndSync()
      .then(res => {
        if (cancelled || !res?.user) return;
        const u = res.user;
        setUser(prev => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          username: u.username ? `@${u.username}` : prev.username,
          initials: getInitials(u.name || prev.name),
          avatarUrl: u.avatarUrl || u.avatar_url || prev.avatarUrl || "",
          bio: u.bio ?? prev.bio,
          location: u.education || prev.location,
          currentStreak: u.currentStreak ?? prev.currentStreak,
          longestStreak: u.longestStreak ?? prev.longestStreak,
          completedLessons: u.completedLessons ?? prev.completedLessons,
          // Rooms take precedence; interests are only the starting value, and the
          // /rooms/my load below overwrites them once that request resolves.
          studyTopics: Array.isArray(prev.studyTopics) && prev.studyTopics.length > 0
            ? prev.studyTopics
            : (Array.isArray(u.interests) ? u.interests : []),
        }));
        setEditFormData({
          name: u.name || "",
          bio: u.bio || "",
          location: u.education || "",
        });
      })
      .catch(() => {});

    // Study Topics = the rooms this learner is currently in. Falls back to the
    // declared interests only when there are no rooms yet, so the section is
    // never blank for someone who has actually joined something.
    getMyRooms()
      .then(res => {
        if (cancelled) return;
        const rooms = Array.isArray(res?.rooms) ? res.rooms : [];
        if (rooms.length === 0) return;
        setUser(prev => ({
          ...prev,
          studyTopics: rooms
            .map(r => (typeof r === "string" ? r : (r?.skill || r?.name || r?.category)))
            .filter(Boolean)
        }));
      })
      .catch(() => {});

    getUserAchievements()
      .then(res => {
        if (cancelled) return;
        if (res?.achievements && Array.isArray(res.achievements)) {
          setUser(prev => ({ ...prev, achievements: res.achievements }));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // Listen for storage events (e.g. from Settings or other components updating avatar)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          const freshUrl = parsed.avatarUrl || parsed.avatar_url || "";
          if (freshUrl) {
            setUser(prev => ({ ...prev, avatarUrl: freshUrl }));
          }
        }
      } catch {
        /* ignore parse errors */
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);


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

  const handleUploadCV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const res = await uploadCV(file);
          if (res?.success || res?.cvUrl) {
            alert(`CV "${file.name}" uploaded successfully!`);
          } else {
            alert(res?.error || "Failed to upload CV");
          }
        } catch (err) {
          alert("CV upload note: " + (err?.message || "Check storage configuration"));
        }
      }
    };
    input.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadAvatar(file);
      if (res?.avatarUrl) {
        setUser(prev => ({ ...prev, avatarUrl: res.avatarUrl }));
        alert("Avatar uploaded successfully!");
      } else {
        alert("Avatar updated!");
      }
    } catch (err) {
      alert("Avatar upload note: " + (err?.message || "Check storage configuration"));
    }
  };

  const handleSaveProfile = async () => {
    try {
      // `interests` is NOT in the backend updateProfileSchema — Zod strips it,
      // so posting it silently discarded the value. Only send accepted fields.
      const res = await updateUserProfile({
        name: editFormData.name,
        bio: editFormData.bio,
        education: editFormData.location
      });
      if (res?.success) {
        setUser(prev => ({
          ...prev,
          name: editFormData.name || prev.name,
          bio: editFormData.bio || prev.bio,
          location: editFormData.location || prev.location
        }));
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update profile: " + (err?.message || "Unknown error"));
    }
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

              {/* Inline Edit Form */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 rounded-2xl border border-primary/30 bg-background/90 backdrop-blur-md space-y-4 relative z-10"
                >
                  <h3 className="text-lg font-bold text-primary">Edit Profile</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-text/70 block mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-text/20 bg-text/5 text-text focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text/70 block mb-1">Education / Location</label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-text/20 bg-text/5 text-text focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-text/70 block mb-1">Bio</label>
                      <textarea
                        rows={2}
                        value={editFormData.bio}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-text/20 bg-text/5 text-text focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-text/60">
                        Study interests can&rsquo;t be edited yet &mdash; the profile API
                        doesn&rsquo;t accept them.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-sm border border-text/20 hover:bg-text/5 text-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-alt hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="relative flex flex-col md:flex-row items-center gap-8">

                {/* Avatar */}
                <div className="relative group">
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

                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Change Avatar"
                  >
                    <Camera size={24} className="text-white" />
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>


                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                    <h1 className="text-4xl font-bold text-text">
                      {user.name}
                    </h1>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200"
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
                  </div>

                  {user.bio && (
                    <p className="text-text/80 max-w-2xl mb-6">{user.bio}</p>
                  )}

                  {/* Social Links — the profile API exposes no handles today, so
                      these render nothing until it does (no dead <a href="">). */}
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

          {/* Study Topics & Achievements Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <BookOpen className="text-primary" />
                Study Topics
              </h2>
              <div className="p-6 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm">
                <div className="flex flex-wrap gap-3">
                  {(user.studyTopics || []).length > 0 ? (
                    user.studyTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/30 transition-all duration-200 flex items-center gap-2"
                      >
                        <BookOpen size={16} />
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-text/60">
                      No study interests saved yet.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <Award className="text-primary" />
                Achievements
              </h2>
              <div className="p-6 rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm">
                {user.achievements && user.achievements.length > 0 ? (
                  // Icon grid. The full card list showed every achievement's title
                  // and description at once, which pushed everything else down the
                  // page and made the badges read as a list of sentences rather
                  // than as achievements. Details now appear on hover/focus.
                  <div className="flex flex-wrap gap-3">
                    {user.achievements.map((ach) => {
                      // The API returns the whole catalogue now. `earned` is
                      // absent on older payloads, so treat "no flag" as earned
                      // rather than locking down a real badge.
                      const locked = ach.earned === false;
                      return (
                        <div
                          key={ach.id || ach.key || ach.title}
                          tabIndex={0}
                          title={ach.title}
                          aria-label={`${ach.title}${locked ? " (locked)" : " (earned)"}${
                            ach.description ? `: ${ach.description}` : ""
                          }`}
                          className={`group relative flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            locked
                              ? "border-text/10 bg-text/[0.02] opacity-50 hover:opacity-80"
                              : "border-primary/30 bg-primary/10 text-primary hover:scale-110 hover:border-primary hover:shadow-lg"
                          }`}
                        >
                          <AchievementIcon icon={ach.icon} size={26} locked={locked} />

                          {locked ? (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-text/20 border border-text/30" />
                          ) : null}

                          {/* Tooltip — hover AND keyboard focus, so the label is
                              not mouse-only. */}
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-text text-background text-xs shadow-xl opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 z-20">
                            <span className="block font-semibold">{ach.title}</span>
                            {ach.description ? (
                              <span className="block opacity-80 mt-0.5 leading-snug">{ach.description}</span>
                            ) : null}
                            <span className="block mt-1 opacity-60 uppercase tracking-wide text-[10px]">
                              {locked ? "Locked" : "Earned"}
                              {ach.date ? ` · ${ach.date}` : ""}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text/50">Complete lessons and study streaks to earn badges!</p>
                )}
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
