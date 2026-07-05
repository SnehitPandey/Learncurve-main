import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, X, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../../services/api";
import { getUserAvatarUrl } from "../../../../utils/imageUtils";
import { usePresence } from "../../../../hooks/usePresence";
import { useDiscordPresence } from "../../../../hooks/useDiscordPresence";
import { useStreak } from "../../../../hooks/useStreak";

// Helper functions
const getInitials = (name) => {
  if (!name) return "??";
  return name.split(" ")
    .map((n) => n[0].toUpperCase())
    .join("")
    .slice(0, 2);
};

const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-yellow-500", "bg-indigo-500"];

const calculateMutualStreak = (userStudiedToday, partnerStudiedToday, lastStreak) => {
  if (userStudiedToday && partnerStudiedToday) {
    return lastStreak + 1;
  } else if (!userStudiedToday || !partnerStudiedToday) {
    return 0;
  }
  return lastStreak;
};



// Get current user from localStorage/auth
const getCurrentUser = () => {
  const userData = apiClient.getUser();
  if (userData) {
    return {
      id: userData.id,
      name: userData.name || "Anonymous User",
      initials: getInitials(userData.name || "Anonymous User"),
      color: colors[Math.floor(Math.random() * colors.length)],
      avatarUrl: getUserAvatarUrl(userData),
      studiedToday: false // This could be fetched from backend
    };
  }
  
  // Fallback if no user data
  return {
    id: 0,
    name: "Guest User",
    initials: "GU",
    color: "bg-gray-500",
    avatarUrl: null,
    online: true,
    studying: "General Studies",
    studiedToday: false
  };
};

const StudyDuo = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  
  const [partner, setPartner] = useState(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);

  // ✨ NEW: Use real-time shared streak system
  const { streak: mutualStreak, calendar: streakCalendar, loading: streakLoading, checkStreak } = useStreak(partner?.id);

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, sending, sent, accepting, error
  const [inviteError, setInviteError] = useState('');
  const [pendingInviteFrom, setPendingInviteFrom] = useState(null);
  const [userImgError, setUserImgError] = useState(false);
  const [partnerImgError, setPartnerImgError] = useState(false);

  // Real-time presence hook - pass initial states including activity (Legacy)
  const { 
    userActivity, 
    partnerActivity, 
    updateActivity, 
    isConnected,
    subscribeToPartnerConnected,
    subscribeToShareRedeem,
    subscribeToPartnerDisconnect
  } = usePresence(
    user?.id, 
    partner?.id, 
    true, // user is always online (they're viewing this page)
    partner ? {
      isOnline: partner.online || false,
      studying: partner.studying || null,
      topicName: partner.topicName || null,
    } : null
  );

  // Discord-style presence system (New)
  const {
    presenceMap,
    isUserOnline: isUserOnlineDiscord,
    getUserPresence: getDiscordPresence,
    getStatusColor,
    getStatusEmoji,
  } = useDiscordPresence(user);

  // Fetch partner from server on mount
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setIsLoadingPartner(true);
        const res = await apiClient.get('/api/users/partner');
        const partnerPayload = res?.partner || res?.data?.partner;
        if (res?.success && partnerPayload) {
          const p = partnerPayload;
          const partnerInfo = {
            id: p.id || p._id,
            name: p.name || 'Study Partner',
            username: p.username || null,
            initials: getInitials(p.name || 'Study Partner'),
            avatarUrl: getUserAvatarUrl(p) || null,
            online: p.isOnline !== undefined ? p.isOnline : false,
            studying: p.studying || null,
            topicName: p.topicName || null,
            studiedToday: false,
          };
          setPartner(partnerInfo);
          localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));
        } else {
          // No partner - check localStorage as fallback
          const stored = localStorage.getItem('focuskami_study_partner');
          if (stored) {
            setPartner(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch partner, falling back to localStorage', err);
        // Fallback to localStorage
        const stored = localStorage.getItem('focuskami_study_partner');
        if (stored) {
          setPartner(JSON.parse(stored));
        }
      } finally {
        setIsLoadingPartner(false);
      }
    };

    fetchPartner();
  }, []);

  // Update user data when localStorage changes (e.g., after login)
  useEffect(() => {
    const updateUserData = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };

    // Update immediately
    updateUserData();

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', updateUserData);
    
    // Also check periodically in case data updated in same tab
    const interval = setInterval(updateUserData, 5000);

    return () => {
      window.removeEventListener('storage', updateUserData);
      clearInterval(interval);
    };
  }, []);

  // Merge real-time activity with user state
  // Compute activity-enriched user object
  const userWithActivity = {
    ...user,
    online: userActivity.isOnline,
    studying: userActivity.studying,
    topicName: userActivity.topicName,
  };

  // Compute activity-enriched partner object (computed every render to ensure freshness)
  const partnerWithActivity = partner ? {
    ...partner,
    online: partnerActivity.isOnline,
    studying: partnerActivity.studying,
    topicName: partnerActivity.topicName,
  } : null;

  // Reset image error flags if avatar URLs change
  useEffect(() => {
    setUserImgError(false);
  }, [userWithActivity.avatarUrl]);

  useEffect(() => {
    setPartnerImgError(false);
  }, [partnerWithActivity?.avatarUrl]);

  useEffect(() => {
    if (partner) {
      localStorage.setItem('focuskami_study_partner', JSON.stringify(partner));
    }
    // ✅ Note: mutualStreak is now managed by useStreak hook (no localStorage needed)
  }, [partner]);

  // Listen for partner connected event (PRIMARY - real-time partner connection)
  useEffect(() => {
    if (!subscribeToPartnerConnected) return;
    
    const unsub = subscribeToPartnerConnected((partnerData) => {
      // partnerData contains { id, name, email, username, avatarUrl, online, studying, topicName }
      const partnerInfo = {
        id: partnerData.id || partnerData._id,
        name: partnerData.name || 'Study Partner',
        username: partnerData.username || null,
        initials: (partnerData.name || 'SP').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase(),
        avatarUrl: partnerData.avatarUrl || null,
        email: partnerData.email,
        online: partnerData.online !== undefined ? partnerData.online : false,
        studying: partnerData.studying || null,
        topicName: partnerData.topicName || null,
        studiedToday: false,
      };

      setPartner(partnerInfo);
      setConnectionStatus('connected');
      localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));
    });

    return unsub;
  }, [subscribeToPartnerConnected]);

  // Listen for partner disconnected event
  useEffect(() => {
    if (!subscribeToPartnerDisconnect) return;
    
    const unsub = subscribeToPartnerDisconnect(() => {
      setPartner(null);
      localStorage.removeItem('focuskami_study_partner');
      // ✅ Note: mutualStreak is managed by useStreak hook (resets automatically)
    });

    return unsub;
  }, [subscribeToPartnerDisconnect]);

  // LEGACY: If someone redeems this user's share link, the server will emit 'shareLinkRedeemed' to the owner.
  useEffect(() => {
    if (!subscribeToShareRedeem) return;
    const unsub = subscribeToShareRedeem((data) => {
      try {
        console.log('🟢 Owner UI received shareLinkRedeemed:', data);
        // Data contains { token, redeemedBy, redeemedByName, usedAt }
    const unsub = subscribeToShareRedeem((data) => {
      try {
        // Data contains { token, redeemedBy, redeemedByName, usedAt }dBy}`);
            if (res && res.user) {
              const u = res.user;
              const partnerInfo = {
                id: u.id || u._id || data.redeemedBy,
                name: u.name || data.redeemedByName || 'Study Partner',
                initials: (u.name || data.redeemedByName || 'SP').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase(),
                avatarUrl: getUserAvatarUrl(u) || null,
                online: true,
                studying: null,
                studiedToday: false,
              };

              setPartner(partnerInfo);
              setConnectionStatus('connected');
              localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));
                  return;
            }
          } catch (err) {
            console.warn('Failed to fetch redeemer profile, falling back to provided data', err);
          }

          // Fallback: use provided data
          const partnerInfo = {
            id: data.redeemedBy,
            name: data.redeemedByName || 'Study Partner',
            initials: data.redeemedByName ? data.redeemedByName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'SP',
            avatarUrl: null,
            online: true,
            studying: null,
            studiedToday: false,
          };

          setPartner(partnerInfo);
          setConnectionStatus('connected');
          localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));
        })();
      } catch (err) {
        console.error('Error handling shareLinkRedeemed in UI', err);
      }
    });

    return () => unsub && unsub();
  }, [subscribeToShareRedeem]);

  // ✅ Removed old streak calculation - now handled by useStreak hook with real-time Socket.IO updates

  // Check for pending invites on mount and when modal opens
  const checkPendingInvites = async () => {
    try {
      const res = await apiClient.get('/api/users/partner');
      if (res?.success && res?.partnerStatus === 'pending' && res?.partner) {
        setPendingInviteFrom(res.partner);
      } else {
        setPendingInviteFrom(null);
      }
    } catch (err) {
      console.warn('Failed to check pending invites', err);
    }
  };

  useEffect(() => {
    if (!partner) {
      checkPendingInvites();
    }
  }, [partner]);

  const handleAddPartner = async () => {
    setConnectionStatus('idle');
    setInviteError('');
    setInviteEmail('');
    setShowConnectionModal(true);
    await checkPendingInvites();
  };

  // Send partner invite by email
  const sendPartnerInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setConnectionStatus('sending');
    setInviteError('');
    
    try {
      const res = await apiClient.post('/api/users/partner/invite', { email: inviteEmail.trim() });
      if (res?.success) {
        setConnectionStatus('sent');
        setTimeout(() => {
          setConnectionStatus('idle');
          setShowConnectionModal(false);
        }, 2000);
      } else {
        setInviteError(res?.message || 'Failed to send invite');
        setConnectionStatus('error');
        setTimeout(() => setConnectionStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to send partner invite:', err);
      setInviteError(err.message || 'Failed to send invite. Check the email and try again.');
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus('idle'), 2000);
    }
  };

  // Accept a pending partner invite
  const acceptPartnerInvite = async () => {
    setConnectionStatus('accepting');
    setInviteError('');
    
    try {
      const res = await apiClient.post('/api/users/partner/accept');
      if (res?.success) {
        // Re-fetch partner info after accepting
        const partnerRes = await apiClient.get('/api/users/partner');
        if (partnerRes?.success && partnerRes?.partner) {
          const p = partnerRes.partner;
          const partnerInfo = {
            id: p.id || p._id,
            name: p.name || 'Study Partner',
            username: p.username || null,
            initials: getInitials(p.name || 'Study Partner'),
            avatarUrl: getUserAvatarUrl(p) || null,
            online: p.isOnline || false,
            studying: null,
            studiedToday: false,
          };
          setPartner(partnerInfo);
          localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));
        }
        setConnectionStatus('idle');
        setShowConnectionModal(false);
        setPendingInviteFrom(null);
      } else {
        setInviteError(res?.message || 'Failed to accept invite');
        setConnectionStatus('error');
        setTimeout(() => setConnectionStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to accept partner invite:', err);
      setInviteError(err.message || 'Failed to accept invite.');
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus('idle'), 2000);
    }
  };

  const removePartner = async () => {
    try {
      await apiClient.delete('/api/users/partner');
    } catch (err) {
      console.warn('Failed to dissolve partnership on server:', err);
    }
    setPartner(null);
    localStorage.removeItem('focuskami_study_partner');
  };

  const handlePartnerClick = () => {
    if (partner && partner.username) {
      const username = partner.username.startsWith('@') ? partner.username.slice(1) : partner.username;
      navigate(`/user/${username}`);
    }
  };

  const closeModal = () => {
    setShowConnectionModal(false);
    setInviteEmail('');
    setInviteError('');
    setConnectionStatus('idle');
  };

  return (
    <>
      <div 
        className="p-4 rounded-2xl border border-primary/40 bg-background/50 backdrop-blur-sm min-w-0"
        style={{
          boxShadow: '0 0 20px rgba(var(--color-primary-rgb), 0.15)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary flex-shrink-0" />
            <h3 className="text-base font-semibold text-primary">Study Duo</h3>
          </div>
          {partner && mutualStreak > 0 && (
            <div className="text-xs text-primary font-bold flex items-center gap-1">
              🔥 {mutualStreak} day streak!
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          {/* User Avatar with Tooltip */}
          <div className="relative group" style={{ overflow: 'visible' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`relative ${userWithActivity.avatarUrl ? 'overflow-hidden' : userWithActivity.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer`}
              style={{ overflow: 'hidden' }}
            >
              {userWithActivity.avatarUrl && !userImgError ? (
                <img 
                  src={userWithActivity.avatarUrl} 
                  alt={userWithActivity.name}
                  className="w-full h-full object-cover"
                  onError={() => setUserImgError(true)}
                />
              ) : (
                userWithActivity.initials
              )}
            </motion.div>
            
            {/* Online Status Indicator with Real-time Updates - OUTSIDE avatar */}
            {userWithActivity.online ? (
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background bg-green-500 z-10">
                <div className="w-full h-full rounded-full bg-green-500 animate-pulse" />
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background bg-gray-400 z-10" />
            )}
            
            {userWithActivity.studiedToday && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center z-10">
                <span className="text-xs">✓</span>
              </div>
            )}
            
            {/* Enhanced Tooltip with Real-time Activity */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-10">
              <p className="text-xs font-medium">
                <span className="text-text">{userWithActivity.name}</span>
                <span className="mx-1.5">–</span>
                {userWithActivity.online ? (
                  userWithActivity.studying ? (
                    <span className="text-green-400">studying {userWithActivity.topicName || userWithActivity.studying}</span>
                  ) : (
                    <span className="text-yellow-400">idle</span>
                  )
                ) : (
                  <span className="text-gray-400">offline</span>
                )}
              </p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-background/95" />
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex flex-col items-center gap-1">
            <div className={`h-1 w-12 rounded-full ${
              partner ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gray-300'
            }`} />
            {mutualStreak > 0 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full font-bold"
              >
                🔥 {mutualStreak}
              </motion.div>
            )}
          </div>

          {/* Partner Avatar or Add Button */}
          {partnerWithActivity ? (
            <div className="relative group" style={{ overflow: 'visible' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={handlePartnerClick}
                className={`relative ${partnerWithActivity.avatarUrl ? 'overflow-hidden' : partnerWithActivity.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer`}
                style={{ overflow: 'hidden' }}
                title="View partner's profile"
              >
                {partnerWithActivity.avatarUrl && !partnerImgError ? (
                  <img 
                    src={partnerWithActivity.avatarUrl} 
                    alt={partnerWithActivity.name}
                    className="w-full h-full object-cover"
                    onError={() => setPartnerImgError(true)}
                  />
                ) : (
                  partnerWithActivity.initials
                )}
              </motion.div>
              
              {/* Partner Online Status Indicator with Real-time Updates - OUTSIDE avatar */}
              {(getDiscordPresence(partnerWithActivity.id)?.status === 'online' || getDiscordPresence(partnerWithActivity.id)?.status === 'idle' || partnerWithActivity.online) ? (
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background bg-green-500 z-10">
                  <div className="w-full h-full rounded-full bg-green-500 animate-pulse" />
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background bg-gray-400 z-10" />
              )}
              
              {partnerWithActivity.studiedToday && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center z-10">
                  <span className="text-xs">✓</span>
                </div>
              )}

              {/* Remove Button - OUTSIDE avatar, always visible on hover */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={removePartner}
                className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                title="Remove Study Partner"
              >
                <X size={14} strokeWidth={2.5} />
              </motion.button>
              
              {/* Enhanced Partner Tooltip with Real-time Activity */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-10">
                <p className="text-xs font-medium">
                  <span className="text-text">{partnerWithActivity.name}</span>
                  <span className="mx-1.5">–</span>
                  {(getDiscordPresence(partnerWithActivity.id)?.status === 'online' || getDiscordPresence(partnerWithActivity.id)?.status === 'idle' || partnerWithActivity.online) ? (
                    (getDiscordPresence(partnerWithActivity.id)?.activity || partnerWithActivity.studying) ? (
                      <span className="text-green-400">
                        {getDiscordPresence(partnerWithActivity.id)?.activity || `studying ${partnerWithActivity.topicName || partnerWithActivity.studying}`}
                      </span>
                    ) : (
                      <span className="text-yellow-400">idle</span>
                    )
                  ) : (
                    <span className="text-gray-400">offline</span>
                  )}
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-background/95" />
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, borderColor: "rgba(var(--color-primary-rgb), 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddPartner}
              className="w-16 h-16 rounded-full border-2 border-dashed border-text/30 hover:border-primary/50 bg-background/20 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Plus size={20} className="text-primary/60" />
            </motion.button>
          )}
        </div>

        {/* Status Display */}
        <div className="space-y-2 text-xs">
          {partnerWithActivity ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-text/80">
                  You & <span className="font-medium">{partnerWithActivity.name}</span>
                </span>
                {/* Color-coded status badge */}
                <div className="flex items-center gap-1.5">
                  {partnerWithActivity.online ? (
                    partnerWithActivity.studying ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 font-medium">
                          Studying {partnerWithActivity.topicName || partnerWithActivity.studying}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-yellow-400 font-medium">Idle</span>
                      </>
                    )
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-400 font-medium">Offline</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-text/60 text-center">
                {user.studiedToday && partnerWithActivity.studiedToday 
                  ? "✅ Both studied today!" 
                  : user.studiedToday 
                  ? "⏳ Waiting for partner to study" 
                  : partnerWithActivity.studiedToday 
                  ? "⏳ Your turn to study!" 
                  : "❌ Neither studied today"}
              </div>
            </>
          ) : (
            <div className="text-center text-text/50">
              Connect with a study partner to start your streak journey! 🚀
            </div>
          )}
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-background rounded-2xl border border-primary/20 p-6 max-w-md w-full space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Connect Study Partner</h3>
              <p className="text-sm text-text/70">Share your link or paste a friend's link to connect</p>
            </div>

            {/* Pending Invite Section */}
            {pendingInviteFrom && (
              <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  🔔 Pending Invite
                </h4>
                <p className="text-sm text-text/80">
                  <span className="font-semibold text-text">{pendingInviteFrom.name || pendingInviteFrom.email}</span> wants to be your study partner!
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={acceptPartnerInvite}
                  disabled={connectionStatus === 'accepting'}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary text-alt font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connectionStatus === 'accepting' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-4 h-4 border-2 border-alt border-t-transparent rounded-full"
                      />
                      Accepting...
                    </>
                  ) : (
                    <>✅ Accept Partner Invite</>
                  )}
                </motion.button>
              </div>
            )}

            {/* Divider if both sections show */}
            {pendingInviteFrom && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-text/20" />
                <span className="text-xs text-text/50 font-medium">OR</span>
                <div className="flex-1 h-px bg-text/20" />
              </div>
            )}

            {/* Invite by Email */}
            <div className="space-y-3">
              <h4 className="font-medium text-text flex items-center gap-2">
                <Link size={16} className="text-primary" />
                Invite by Email
              </h4>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your friend's email address..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendPartnerInvite()}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-text/20 bg-background/50 text-text placeholder-text/50 focus:outline-none focus:border-primary/50"
                />
                {inviteError && (
                  <p className="text-xs text-red-400">{inviteError}</p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={sendPartnerInvite}
                  disabled={!inviteEmail.trim() || connectionStatus === 'sending'}
                  className="w-full py-2 px-4 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {connectionStatus === 'sending' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                  )}
                  {connectionStatus === 'sending' ? 'Sending Invite...' : 
                   connectionStatus === 'sent' ? '✅ Invite Sent!' :
                   connectionStatus === 'error' ? '❌ Try Again' :
                   'Send Invite 🤝'}
                </motion.button>
                <p className="text-xs text-text/60">Your partner must have a LearnCurve account. They'll see the invite on their dashboard.</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-text/10 transition-colors"
            >
              <X size={16} className="text-text/70" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default StudyDuo;
