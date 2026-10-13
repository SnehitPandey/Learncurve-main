import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link, Github, Linkedin, Twitter, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { applyAccent, isValidAccent, DEFAULT_ACCENT } from '../../theme';
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadCV,
  getCVDownloadUrl,
  deleteCV,
  updateUserSettings,
  changeUserPassword,
  deleteUserAccount,
} from '../../api/users';

// Reusable Components
// ===================================================================

function SettingsCard({ title, description, children, variants, action }) {
  return (
    <motion.div 
      className="bg-black/20 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/10 mb-8"
      variants={variants}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[var(--color-text)]">{title}</h3>
          {description && <p className="text-[var(--color-text)]/70 mt-1 mb-6">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function ToggleSwitch({ enabled, onChange, label, disabled }) {
  const [isEnabled, setIsEnabled] = useState(!!enabled);

  // Keep in sync when parent reloads settings from backend
  useEffect(() => { setIsEnabled(!!enabled); }, [enabled]);

  const handleToggle = () => {
    if (disabled) return;
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  return (
    <label className={`flex items-center justify-between ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className="text-[var(--color-text)]/90">{label}</span>
      <div
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out ${
          isEnabled ? 'bg-[var(--color-primary)]' : 'bg-black/30'
        }`}
        onClick={handleToggle}
      >
        <motion.span
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
          animate={{ left: isEnabled ? '1.75rem' : '0.25rem' }}
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
        />
      </div>
    </label>
  );
}

function useSaveMessage() {
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);
  const flash = (text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2500);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return { msg, setMsg: flash, saving, setSaving };
}

// Declared at module scope on purpose. When these lived inside ProfileSettings'
// render body every keystroke created a NEW component type, so React remounted
// the subtree and replaced the focused <input> (losing focus after one character).
function ProfileInput({ label, value, type, placeholder, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </div>
  );
}

function SocialInput({ icon, placeholder, value, onChange, disabled }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-black/20 border border-white/10 rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function ThemeButton({ theme, label, activeTheme, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(theme)}
      className={`w-full rounded-md py-3 font-semibold transition-all ${
        activeTheme === theme
          ? 'bg-[var(--color-primary)] text-white ring-2 ring-offset-2 ring-offset-black/20 ring-[var(--color-primary)]'
          : 'bg-black/20 hover:bg-black/40 text-[var(--color-text)]'
      }`}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}


// Settings Section Components
// ===================================================================

function ProfileSettings() {
  const [profile, setProfile] = useState({ name: "", bio: "", location: "", education: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [cvUrl, setCvUrl] = useState("");
  // Social links are persisted by `PUT /api/users/profile`.
  const [socialLinks, setSocialLinks] = useState({ github: "", linkedin: "", twitter: "", website: "" });
  // Renders the "Loading profile..." state until getUserProfile resolves.
  const [loading, setLoading] = useState(true);

  const profileSave = useSaveMessage();
  const socialSave = useSaveMessage();
  const avatarSave = useSaveMessage();
  const cvSave = useSaveMessage();
  // Guard for every setState-after-await below.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);


  useEffect(() => {
    let mounted = true;
    getUserProfile()
      .then(res => {
        if (!mounted) return;
        const u = res?.user;
        if (u) {
          setProfile({ name: u.name || "", bio: u.bio || "", location: u.location || "", education: u.education || "" });
          setSocialLinks({
            github: u.github || "",
            linkedin: u.linkedin || "",
            twitter: u.twitter || "",
            website: u.website || ""
          });
          setAvatarUrl(u.avatarUrl || "");
          setCvUrl(u.cvUrl || "");
        }

      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      // Clear the input so choosing the SAME file again still fires `change`.
      // Without this, a user who picked the wrong file and retries the identical
      // path gets no event at all and the button stays dead.
      e.target.value = "";
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarSave.setSaving(true);
    try {
      const res = await uploadAvatar(file);
      if (!mountedRef.current) return;
      const url = res?.avatarUrl || res?.user?.avatarUrl || "";
      if (url) setAvatarUrl(url);
      avatarSave.setMsg("Avatar updated");
    } catch (err) {
      if (mountedRef.current) avatarSave.setMsg(err?.message || "Upload failed");
    } finally {
      if (mountedRef.current) avatarSave.setSaving(false);
    }
  };

  const handleCvUpload = async () => {
    if (!cvFile) return;
    cvSave.setSaving(true);
    try {
      const res = await uploadCV(cvFile);
      const url = res?.cvUrl || res?.user?.cvUrl || "";
      if (url) setCvUrl(url);
      setCvFile(null);
      cvSave.setMsg("CV uploaded");
    } catch (err) {
      cvSave.setMsg(err?.message || "Upload failed");
    } finally {
      cvSave.setSaving(false);
    }
  };

  /**
 * Open the stored CV.
 *
 * The page deliberately does NOT link `cvUrl` directly. `cvUrl` is the storage
 * OBJECT KEY (e.g. `<id>_resume.pdf`), not a URL — it only becomes addressable
 * through a short-lived Supabase signed link. Rendering it in an href produced
 * a link to a relative path that resolves against the FRONTEND origin and 404s,
 * which looks exactly like "the upload did not work".
 *
 * `GET /users/cv` is the availability-aware descriptor: it returns
 * `{ available, downloadUrl, message }`, so this can tell the user the truth
 * when storage cannot serve the file (the same fallback state that made avatars
 * unopenable) instead of opening a dead link.
 */
const handleCvView = async () => {
    cvSave.setSaving(true);
    try {
      const res = await getCVDownloadUrl();
      if (!res?.available || !res?.downloadUrl) {
        cvSave.setMsg(res?.message || "The CV is stored but cannot be downloaded right now.");
        return;
      }
      window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
      cvSave.setMsg("");
    } catch (err) {
      cvSave.setMsg(err?.message || "Could not open the CV");
    } finally {
      cvSave.setSaving(false);
    }
  };

  const handleCvDelete = async () => {
    cvSave.setSaving(true);
    try {
      await deleteCV();
      setCvUrl("");
      cvSave.setMsg("CV removed");
    } catch (err) {
      cvSave.setMsg(err?.message || "Delete failed");
    } finally {
      cvSave.setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    profileSave.setSaving(true);
    try {
      await updateUserProfile({ name: profile.name, bio: profile.bio, location: profile.location, education: profile.education });
      profileSave.setMsg("Profile saved");
    } catch (err) {
      profileSave.setMsg(err?.message || "Save failed");
    } finally {
      profileSave.setSaving(false);
    }
  };

  const handleSocialSave = async () => {
    socialSave.setSaving(true);
    try {
      await updateUserProfile({
        github: socialLinks.github,
        linkedin: socialLinks.linkedin,
        twitter: socialLinks.twitter,
        website: socialLinks.website
      });
      socialSave.setMsg("Social links saved");
    } catch (err) {
      socialSave.setMsg(err?.message || "Save failed");
    } finally {
      socialSave.setSaving(false);
    }
  };

  return (
    loading ? (
      <p className="text-sm text-[var(--color-text)]/60 p-8 text-center">Loading profile settings…</p>
    ) : (
    <motion.section initial="hidden" animate="visible" variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
    }}>
      <SettingsCard title="Public Profile" description="This information will be displayed publicly." variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }} action={profileSave.msg ? <span className="text-xs text-[var(--color-primary)] flex items-center gap-1"><Check size={14}/>{profileSave.msg}</span> : null}>
        <div className="flex items-center space-x-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover"
              onError={() => setAvatarUrl("")}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xl font-bold text-[var(--color-primary)]">
              {(profile.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <label className="bg-[var(--color-primary)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition-opacity cursor-pointer">
            {avatarSave.saving ? "Uploading…" : "Upload Image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          {avatarSave.msg && <span className="text-xs text-[var(--color-text)]/70">{avatarSave.msg}</span>}
        </div>
        <ProfileInput
          label="Display Name"
          type="text"
          placeholder="Enter your display name"
          value={profile.name}
          onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
        />
        <ProfileInput
          label="Education"
          type="text"
          placeholder="University / School"
          value={profile.education}
          onChange={(e) => setProfile(p => ({ ...p, education: e.target.value }))}
        />
        <ProfileInput
          label="Location"
          type="text"
          placeholder="City, Country"
          value={profile.location}
          onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
        />
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">Bio</label>
          <textarea
            rows="3"
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder="Tell us a little about yourself"
            value={profile.bio || ""}
            onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
          ></textarea>
        </div>
        <div className="flex justify-end">
          <motion.button onClick={handleProfileSave} disabled={profileSave.saving} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[var(--color-primary)] text-white font-bold py-2 px-5 rounded-md disabled:opacity-50">
            {profileSave.saving ? "Saving…" : "Save Profile"}
          </motion.button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Social Links"
        description="Linked profiles shown on your public profile."
        variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
      >
        <SocialInput
          icon={<Github size={18} className="text-[var(--color-text)]/50" />}
          placeholder="https://github.com/username"
          value={socialLinks.github}
          onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
        />
        <SocialInput
          icon={<Linkedin size={18} className="text-[var(--color-text)]/50" />}
          placeholder="https://linkedin.com/in/username"
          value={socialLinks.linkedin}
          onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
        />
        <SocialInput
          icon={<Twitter size={18} className="text-[var(--color-text)]/50" />}
          placeholder="https://twitter.com/username"
          value={socialLinks.twitter}
          onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
        />
        <SocialInput
          icon={<Link size={18} className="text-[var(--color-text)]/50" />}
          placeholder="https://your-website.com"
          value={socialLinks.website}
          onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
        />

        <div className="flex justify-end mt-4">
          <motion.button onClick={handleSocialSave} disabled={socialSave.saving} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[var(--color-primary)] text-white font-bold py-2 px-5 rounded-md disabled:opacity-50">
            {socialSave.saving ? "Saving…" : "Save Social Links"}
          </motion.button>
        </div>
      </SettingsCard>


      <SettingsCard title="Resume / CV" description="Upload your latest resume. This will be visible on your public profile." variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }} action={cvSave.msg ? <span className="text-xs text-[var(--color-primary)]">{cvSave.msg}</span> : null}>
        {cvUrl && (
          <p className="text-xs text-[var(--color-text)]/70">
            Current CV:{" "}
            <button
              type="button"
              onClick={handleCvView}
              disabled={cvSave.saving}
              className="text-[var(--color-primary)] underline disabled:opacity-50"
            >
              View uploaded CV
            </button>
          </p>
        )}
        <div className="relative w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-center hover:border-white/40 transition-colors">
            <Upload size={32} className="text-[var(--color-text)]/50 mb-2" />
            {cvFile ? (
                 <p className="text-sm text-[var(--color-primary)]">{cvFile.name}</p>
            ) : (
                <p className="text-sm text-[var(--color-text)]/70">
                    <span className="font-semibold text-[var(--color-primary)]">Click to upload</span> or drag and drop
                </p>
            )}
            <p className="text-xs text-[var(--color-text)]/50 mt-1">PDF, DOC, DOCX (MAX. 5MB)</p>
            <input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
        </div>
        <div className="flex justify-end gap-3">
          {cvUrl && (
            <motion.button onClick={handleCvDelete} disabled={cvSave.saving} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border border-red-500/40 text-red-400 font-bold py-2 px-5 rounded-md disabled:opacity-50">
              Remove CV
            </motion.button>
          )}
          <motion.button onClick={handleCvUpload} disabled={!cvFile || cvSave.saving} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[var(--color-primary)] text-white font-bold py-2 px-5 rounded-md disabled:opacity-50">
            {cvSave.saving ? "Uploading…" : "Upload CV"}
          </motion.button>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <p className="text-xs text-[var(--color-text)]/50 self-center mr-4">Profile & CV save individually above</p>
      </div>
    </motion.section>
    )
  );
}

function AccountSecuritySettings() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const pw = useSaveMessage();
    const del = useSaveMessage();

    const handlePasswordUpdate = async () => {
      if (!currentPassword || !newPassword) { pw.setMsg("Fill all fields"); return; }
      if (newPassword !== confirmPassword) { pw.setMsg("Passwords do not match"); return; }
      if (newPassword.length < 6) { pw.setMsg("Min 6 characters"); return; }
      pw.setSaving(true);
      try {
        await changeUserPassword({ currentPassword, newPassword });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        pw.setMsg("Password updated");
      } catch (err) {
        pw.setMsg(err?.message || "Update failed");
      } finally {
        pw.setSaving(false);
      }
    };

    const handleDelete = async () => {
      if (!confirmDelete) { setConfirmDelete(true); return; }
      if (!deletePassword) {
        del.setMsg("Enter your current password to confirm deletion");
        return;
      }
      del.setSaving(true);
      try {
        await deleteUserAccount(deletePassword);
        localStorage.clear();
        window.location.href = "/";
      } catch (err) {
        del.setMsg(err?.message || "Delete failed");
        del.setSaving(false);
      }
    };

    return (
        <motion.section initial="hidden" animate="visible" variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {},
        }}>
            <SettingsCard title="Change Password" variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }} action={pw.msg ? <span className="text-xs text-[var(--color-primary)]">{pw.msg}</span> : null}>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                 <div className="pt-4 border-t border-white/10 flex justify-end">
                    <motion.button onClick={handlePasswordUpdate} disabled={pw.saving} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[var(--color-primary)] text-white font-bold py-2 px-5 rounded-md disabled:opacity-50">
                        {pw.saving ? "Updating…" : "Update Password"}
                    </motion.button>
                </div>
            </SettingsCard>
            <SettingsCard title="Danger Zone" description="These actions are permanent and cannot be undone." variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
                {confirmDelete && (
                    <div className="mb-4">
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            placeholder="Enter your current password to confirm"
                            autoComplete="current-password"
                            className="w-full bg-black/20 border border-red-500/40 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                )}
                <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-[var(--color-text)]/90 font-medium">Delete your account</p>
                      {del.msg && <p className="text-xs text-red-400 mt-1">{del.msg}</p>}
                    </div>
                    <motion.button onClick={handleDelete} disabled={del.saving} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {del.saving ? "Deleting…" : confirmDelete ? "Click again to confirm" : "Delete Account"}
                    </motion.button>
                </div>
            </SettingsCard>
        </motion.section>
    );
}

function AppearanceSettings() {
  // localStorage is the single source of truth for the theme — the same key the
  // ThemeToggle in elements/toggletheme.jsx writes.
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => {
    const stored = localStorage.getItem('accentColor');
    return isValidAccent(stored) ? stored : DEFAULT_ACCENT;
  });
  const themeSave = useSaveMessage();

  const ACCENTS = [
    { key: 'teal', class: 'bg-teal-500' },
    { key: 'sky', class: 'bg-sky-500' },
    { key: 'indigo', class: 'bg-indigo-500' },
    { key: 'rose', class: 'bg-rose-500' },
  ];

  // Load persisted prefs from backend
  useEffect(() => {
    let cancelled = false;
    getUserProfile().then(res => {
      if (cancelled) return;
      const u = res?.user;
      if (u?.theme) { setActiveTheme(u.theme); }
      // A stored server value may predate an accent being added or removed;
      // only apply one we actually ship CSS for.
      if (isValidAccent(u?.accentColor)) { setAccentColor(u.accentColor); }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Apply the accent to <html data-accent> whenever it changes — this is what
  // the CSS in index.css keys off. It is deliberately NOT gated on `persist`
  // succeeding: the swatch should respond instantly, and a failed save is
  // reported separately without making the click look inert.
  useEffect(() => {
    applyAccent(accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('theme', activeTheme);
  }, [activeTheme]);

  const persist = async (theme, accent) => {
    themeSave.setSaving(true);
    try {
      await updateUserSettings({ theme, accentColor: accent });
      localStorage.setItem('accentColor', accent);
      themeSave.setMsg("Saved");
    } catch (err) {
      themeSave.setMsg(err?.message || "Save failed");
    } finally {
      themeSave.setSaving(false);
    }
  };

  const handleTheme = (theme) => {
    setActiveTheme(theme);
    persist(theme, accentColor);
  };

  const handleAccent = (accent) => {
    setAccentColor(accent);
    persist(activeTheme, accent);
  };

  return (
    <motion.section initial="hidden" animate="visible" variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
    }}>
      <SettingsCard title="Theme" description="Customize the look and feel of the application." variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
        <div className="flex space-x-4">
          <ThemeButton theme="light" label="Light" activeTheme={activeTheme} onSelect={handleTheme} />
          <ThemeButton theme="dark" label="Dark" activeTheme={activeTheme} onSelect={handleTheme} />
        </div>
      </SettingsCard>
       <SettingsCard title="Accent Color" description="Choose a primary color for the interface." variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }} action={themeSave.msg ? <span className="text-xs text-[var(--color-primary)]">{themeSave.msg}</span> : null}>
        <div className="flex space-x-3">
            {ACCENTS.map(a => (
              <div key={a.key} onClick={() => handleAccent(a.key)} className={`w-10 h-10 rounded-full ${a.class} cursor-pointer ${accentColor === a.key ? 'ring-2 ring-white' : ''}`}></div>
            ))}
        </div>
      </SettingsCard>
    </motion.section>
  );
}

function NotificationsSettings() {
     const [settings, setSettings] = useState({ newsletter: true, productUpdates: true, securityAlerts: false, chatMentions: true, newMessages: false });
     const [loading, setLoading] = useState(true);
     const save = useSaveMessage();

     useEffect(() => {
       let mounted = true;
       getUserProfile().then(res => {
         if (!mounted) return;
         const n = res?.user?.notificationSettings;
         if (n) {
           setSettings({
             newsletter: n.newsletter ?? true,
             productUpdates: n.product_updates ?? n.productUpdates ?? true,
             securityAlerts: n.security_alerts ?? n.securityAlerts ?? false,
             chatMentions: n.chat_mentions ?? n.chatMentions ?? true,
             newMessages: n.new_messages ?? n.newMessages ?? false,
           });
         }
       }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
       return () => { mounted = false; };
     }, []);

     const handleToggle = async (key, value) => {
       const next = { ...settings, [key]: value };
       setSettings(next);
       save.setSaving(true);
       try {
         await updateUserSettings(next);
         save.setMsg("Saved");
       } catch (err) {
         save.setMsg(err?.message || "Save failed");
       } finally {
         save.setSaving(false);
       }
     };

     return (
        <motion.section initial="hidden" animate="visible" variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {},
        }}>
            <SettingsCard title="Email Notifications" variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }} action={save.msg ? <span className="text-xs text-[var(--color-primary)]">{save.msg}</span> : null}>
                 <ToggleSwitch label="Weekly Newsletter" enabled={settings.newsletter} disabled={loading || save.saving} onChange={v => handleToggle("newsletter", v)} />
                 <hr className="border-white/10" />
                 <ToggleSwitch label="Product Updates & Announcements" enabled={settings.productUpdates} disabled={loading || save.saving} onChange={v => handleToggle("productUpdates", v)} />
                 <hr className="border-white/10" />
                 <ToggleSwitch label="Security & Account Alerts" enabled={settings.securityAlerts} disabled={loading || save.saving} onChange={v => handleToggle("securityAlerts", v)} />
            </SettingsCard>
            <SettingsCard title="Push Notifications" variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
                 <ToggleSwitch label="Mentions & Replies" enabled={settings.chatMentions} disabled={loading || save.saving} onChange={v => handleToggle("chatMentions", v)} />
                 <hr className="border-white/10" />
                 <ToggleSwitch label="New Messages" enabled={settings.newMessages} disabled={loading || save.saving} onChange={v => handleToggle("newMessages", v)} />
            </SettingsCard>
        </motion.section>
    );
}

// Main Settings Page Component with Tabs
// ===================================================================

// Store component TYPES, not pre-created element instances. Holding JSX meant
// every tab's stateful subtree was built once at module load, and the page only
// worked because `motion.div key={activeTab}` forced a remount.
const TABS = {
  profile: { label: 'Profile', component: ProfileSettings },
  appearance: { label: 'Appearance', component: AppearanceSettings },
  notifications: { label: 'Notifications', component: NotificationsSettings },
  security: { label: 'Security', component: AccountSecuritySettings },
};

// Other pages navigate here with e.g. `navigate('/settings', { state: { tab: 'preferences' } })`.
const TAB_ALIASES = {
  preferences: 'appearance',
  account: 'profile',
  notifications_settings: 'notifications',
};

const resolveTab = (requested) => {
  const key = TAB_ALIASES[requested] || requested;
  return key && Object.prototype.hasOwnProperty.call(TABS, key) ? key : 'profile';
};

export default function SettingsPage() {
  const location = useLocation();
  const requestedTab = location?.state?.tab;
  const [activeTab, setActiveTab] = useState(() => resolveTab(requestedTab));

  // Honour a redirect that arrives after the page is already mounted.
  useEffect(() => {
    if (requestedTab) setActiveTab(resolveTab(requestedTab));
  }, [requestedTab]);

  const ActiveComponent = TABS[activeTab].component;

  return (
    <div className="h-screen w-full bg-transparent text-white overflow-y-auto">
      <main className="max-w-4xl mx-auto p-4 sm:p-10">
        <h1 className="text-4xl font-bold text-[var(--color-text)] mb-4">Settings</h1>
        <p className="text-[var(--color-text)]/70 mb-8">Manage your account settings and preferences.</p>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {Object.keys(TABS).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tabKey
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:border-white/30'
                }`}
              >
                {TABS[tabKey].label}
                {activeTab === tabKey && (
                    <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--color-primary)]" layoutId="underline" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
