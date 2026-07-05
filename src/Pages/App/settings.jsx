import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ProfileSettings from '../../Components/App/settings/ProfileSettings';
import AppearanceSettings from '../../Components/App/settings/AppearanceSettings';
import NotificationsSettings from '../../Components/App/settings/NotificationsSettings';
import AccountSecuritySettings from '../../Components/App/settings/AccountSecuritySettings';

// Main Settings Page Component with Tabs
// ===================================================================

const TABS = {
  profile: { label: 'Profile', component: ProfileSettings },
  appearance: { label: 'Appearance', component: AppearanceSettings },
  notifications: { label: 'Notifications', component: NotificationsSettings },
  security: { label: 'Security', component: AccountSecuritySettings },
};

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && TABS[tabFromUrl] ? tabFromUrl : 'profile'
  );

  // Update URL when tab changes
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Sync with URL changes
  useEffect(() => {
    if (tabFromUrl && TABS[tabFromUrl] && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
                onClick={() => handleTabChange(tabKey)}
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
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={activeTab}
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
