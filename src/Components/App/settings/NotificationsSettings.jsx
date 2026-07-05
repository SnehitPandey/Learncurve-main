import React, { useState } from 'react';
import { motion } from 'framer-motion';

const NotificationsSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState({
    newsletter: true,
    productUpdates: true,
    securityAlerts: false
  });

  const [pushNotifications, setPushNotifications] = useState({
    mentions: true,
    newMessages: false
  });

  const ToggleSwitch = ({ enabled, onChange, label }) => {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-[var(--color-text)]">{label}</span>
        <button
          onClick={() => onChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
            enabled ? 'bg-[var(--color-primary)]' : 'bg-white/20'
          }`}
        >
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
            animate={{ x: enabled ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Email Notifications */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-6">Email Notifications</h4>
        <div className="space-y-2">
          <ToggleSwitch
            enabled={emailNotifications.newsletter}
            onChange={(value) => setEmailNotifications({ ...emailNotifications, newsletter: value })}
            label="Weekly Newsletter"
          />
          <ToggleSwitch
            enabled={emailNotifications.productUpdates}
            onChange={(value) => setEmailNotifications({ ...emailNotifications, productUpdates: value })}
            label="Product Updates & Announcements"
          />
          <ToggleSwitch
            enabled={emailNotifications.securityAlerts}
            onChange={(value) => setEmailNotifications({ ...emailNotifications, securityAlerts: value })}
            label="Security & Account Alerts"
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-6">Push Notifications</h4>
        <div className="space-y-2">
          <ToggleSwitch
            enabled={pushNotifications.mentions}
            onChange={(value) => setPushNotifications({ ...pushNotifications, mentions: value })}
            label="Mentions & Replies"
          />
          <ToggleSwitch
            enabled={pushNotifications.newMessages}
            onChange={(value) => setPushNotifications({ ...pushNotifications, newMessages: value })}
            label="New Messages"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationsSettings;