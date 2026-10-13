import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Plus, X, Copy, Link, Check } from "lucide-react";
import { getDuoStatus, getDuoShareLink, connectDuo, disconnectDuo } from "../../../../api/duo";
import { getCurrentUser, getInitials } from "../../../../utils/user";

// Null-safe: a partner record can carry an empty/missing name, and the old
// `name.split(" ")[0].toUpperCase()` threw on that.
// Both live in utils/user now so the sidebar can read the same session the duo
// card does — previously it could not, and showed a generic icon for everyone.

const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-yellow-500", "bg-indigo-500"];

const StudyDuo = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [partner, setPartner] = useState(null);
  const [mutualStreak, setMutualStreak] = useState(0);

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [pastedLink, setPastedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, connecting, connected, error
  const [errorMessage, setErrorMessage] = useState('');

  // Every deferred setState below is tracked so unmount can't fire one.
  const timersRef = useRef([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const setLater = (fn, ms) => {
    const timer = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== timer);
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.push(timer);
  };

  // Load duo status from backend on mount
  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await getDuoStatus();
        if (cancelled) return;
        if (res.user) {
          setUser(prev => ({
            ...prev,
            id: res.user.id,
            name: res.user.name,
            // The API returns the learner's own photo here; it was dropped, so the
            // duo card rendered initials for them while showing a real picture
            // for their partner.
            avatarUrl: res.user.avatarUrl || prev?.avatarUrl || "",
            initials: getInitials(res.user.name),
            studiedToday: res.user.studiedToday
          }));
        }
        if (res.hasPartner && res.partner) {
          setPartner({
            id: res.partner.id,
            name: res.partner.name,
            avatarUrl: res.partner.avatarUrl || "",
            initials: getInitials(res.partner.name),
            color: colors[0],
            online: res.partner.online,
            studying: res.partner.studying || "Focused Learning",
            studiedToday: res.partner.studiedToday
          });
          setMutualStreak(res.mutualStreak || 0);
        } else {
          setPartner(null);
          setMutualStreak(0);
        }
        if (res.shareLink) {
          setShareLink(res.shareLink);
        }
      } catch (err) {
        console.warn("[Duo] Could not fetch remote duo status:", err);
      }
    }
    loadStatus();
    return () => { cancelled = true; };
  }, []);

  // A duo is a TWO-WAY BINDING, so the pair can change without this side acting.
  // When one person disconnects, the server unbinds both, but this card was only
  // ever loaded on mount — so the remaining partner kept seeing a duo card for
  // someone who had left until they reloaded the page.
  //
  // Refetching when the tab regains focus costs nothing and closes that window.
  // A poll is deliberately NOT used: it would keep hammering the endpoint on every
  // open tab, and the case that matters (you switch away, they leave, you come
  // back) is exactly the one focus handles.
  useEffect(() => {
    const onFocus = () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      getDuoStatus()
        .then(res => {
          if (res.hasPartner && res.partner) {
            setPartner(prev => ({
              id: res.partner.id,
              name: res.partner.name,
              avatarUrl: res.partner.avatarUrl || "",
              initials: getInitials(res.partner.name),
              color: prev?.color || colors[0],
              online: res.partner.online,
              studying: res.partner.studying || "Focused Learning",
              studiedToday: res.partner.studiedToday
            }));
            setMutualStreak(res.mutualStreak || 0);
          } else {
            setPartner(null);
            setMutualStreak(0);
          }
        })
        .catch(() => {});
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // `colors` is a module-level constant, so it cannot change between renders.
  }, []);

  // Listen for storage events (e.g. profile photo uploaded in Settings)
  useEffect(() => {
    const handleStorage = () => {
      const u = getCurrentUser();
      if (u) {
        setUser(prev => ({
          ...prev,
          ...u,
          avatarUrl: u.avatarUrl || prev?.avatarUrl || ""
        }));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Ask the backend for the invite link. The old fallback fabricated
  // `${origin}/connect/duo-partner`, a link that connects to nobody.
  const handleAddPartner = async () => {
    setShowConnectionModal(true);
    try {
      const res = await getDuoShareLink();
      if (!mountedRef.current) return;
      setShareLink(res?.shareUrl || res?.shareLink || "");
    } catch (err) {
      if (!mountedRef.current) return;
      console.warn("[Duo] Could not create invite link:", err?.message);
      setShareLink("");
      setErrorMessage("Could not create an invite link. Please try again.");
    }
  };

  // Copy share link to clipboard
  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      if (!mountedRef.current) return;
      setLinkCopied(true);
      setLater(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Connect using pasted link
  const connectWithLink = async () => {
    if (!pastedLink.trim()) return;
    
    setConnectionStatus('connecting');
    setErrorMessage('');
    
    try {
      await connectDuo(pastedLink.trim());
      if (!mountedRef.current) return;
      setConnectionStatus('connected');
      
      // Refresh status
      const res = await getDuoStatus();
      if (!mountedRef.current) return;
      if (res.partner) {
        setPartner({
          id: res.partner.id,
          name: res.partner.name,
          // Same omission as before: this refresh path rebuilt the partner
          // WITHOUT the avatar, so pairing through this modal replaced the photo
          // with initials while the mount path showed it correctly.
          avatarUrl: res.partner.avatarUrl || "",
          initials: getInitials(res.partner.name),
          color: colors[0],
          online: res.partner.online,
          studying: res.partner.studying || "Focused Learning",
          studiedToday: res.partner.studiedToday
        });
        setMutualStreak(res.mutualStreak || 0);
      }
      
      setLater(() => {
        setShowConnectionModal(false);
        setConnectionStatus('idle');
        setPastedLink('');
      }, 1200);
    } catch (error) {
      if (!mountedRef.current) return;
      setConnectionStatus('error');
      setErrorMessage(error.message || "Failed to pair with partner");
      setLater(() => setConnectionStatus('idle'), 3000);
    }
  };

  const removePartner = async () => {
    try {
      await disconnectDuo();
    } catch (err) {
      console.warn("Disconnect error:", err);
    }
    if (!mountedRef.current) return;
    setPartner(null);
    setMutualStreak(0);
  };

  const closeModal = () => {
    setShowConnectionModal(false);
    setPastedLink('');
    setErrorMessage('');
    setLinkCopied(false);
    setConnectionStatus('idle');
  };

  return (
    <>
      <div className="p-4 rounded-2xl border border-primary/30 bg-background/50 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary flex-shrink-0" />
            <h3 className="text-sm font-medium text-primary">Study Duo</h3>
          </div>
          {partner && mutualStreak > 0 && (
            <div className="text-xs text-primary font-bold flex items-center gap-1">
              🔥 {mutualStreak} day streak!
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative ${user.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer`}
            title={`${user.name} - Studying ${user.studying}`}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover"
                onError={() => {
                  // Fall back to initials via React state rather than display: none
                  setUser(prev => ({ ...prev, avatarUrl: "" }));
                }}
              />
            ) : (
              user.initials
            )}
            
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-green-400" />
            
            {user.studiedToday && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
            )}
          </motion.div>

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
          {partner ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`relative group ${partner.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer`}
              title={`${partner.name} - ${partner.online ? `Studying ${partner.studying}` : 'Offline'}`}
            >
              {partner.avatarUrl ? (
                <img
                  src={partner.avatarUrl}
                  alt={partner.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={() => {
                    setPartner(prev => (prev ? { ...prev, avatarUrl: "" } : null));
                  }}
                />
              ) : (
                partner.initials
              )}
              
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                partner.online ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              
              {partner.studiedToday && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={removePartner}
                className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={12} />
              </motion.button>
            </motion.div>
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
          {partner ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-text/80">
                  You & <span className="font-medium">{partner.name}</span>
                </span>
                <span className="text-text/60">
                  {partner.online ? `📚 ${partner.studying}` : '💤 Offline'}
                </span>
              </div>
              <div className="text-text/60 text-center">
                {user.studiedToday && partner.studiedToday 
                  ? "✅ Both studied today!" 
                  : user.studiedToday 
                  ? "⏳ Waiting for partner to study" 
                  : partner.studiedToday 
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

            {/* Share Your Link */}
            <div className="space-y-3">
              <h4 className="font-medium text-text flex items-center gap-2">
                <Copy size={16} className="text-primary" />
                Share Your Link
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  placeholder={shareLink ? "" : "No invite link available"}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-text/20 bg-background/50 text-text"
                />
                <motion.button
                  whileHover={shareLink ? { scale: 1.02 } : {}}
                  whileTap={shareLink ? { scale: 0.98 } : {}}
                  onClick={copyShareLink}
                  disabled={!shareLink}
                  className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </motion.button>
              </div>
              {!shareLink && (
                <button
                  onClick={handleAddPartner}
                  className="text-xs text-primary underline"
                >
                  Try generating a new invite link
                </button>
              )}
              <p className="text-xs text-text/60">Share this link with your study partner. Once they use it, the connection will be locked.</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-text/20" />
              <span className="text-xs text-text/50 font-medium">OR</span>
              <div className="flex-1 h-px bg-text/20" />
            </div>

            {/* Paste Friend's Link */}
            <div className="space-y-3">
              <h4 className="font-medium text-text flex items-center gap-2">
                <Link size={16} className="text-primary" />
                Paste Friend's Link
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Paste your friend's share link here..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-text/20 bg-background/50 text-text placeholder-text/50 focus:outline-none focus:border-primary/50"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connectWithLink}
                  disabled={!pastedLink.trim() || connectionStatus === 'connecting'}
                  className="w-full py-2 px-4 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {connectionStatus === 'connecting' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                  )}
                  {connectionStatus === 'connecting' ? 'Connecting...' : 
                   connectionStatus === 'connected' ? '✅ Connected!' :
                   connectionStatus === 'error' ? '❌ Invalid Link' :
                   'Connect 🤝'}
                </motion.button>
                {connectionStatus === 'error' && errorMessage && (
                  <p className="text-xs text-red-500 mt-2">{errorMessage}</p>
                )}
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
