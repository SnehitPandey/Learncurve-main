import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import profileService from '../../../services/profileService';

const AccountSecuritySettings = () => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePasswordChange = (field, value) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      setLoading(true);
      await profileService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await profileService.deleteAccount(passwords.current);
      // Redirect to login or home
      window.location.href = '/';
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Success/Error Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Change Password */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-6">Change Password</h4>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={passwords.current}
            onChange={(e) => handlePasswordChange('current', e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwords.new}
            onChange={(e) => handlePasswordChange('new', e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwords.confirm}
            onChange={(e) => handlePasswordChange('confirm', e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-6 border border-red-500/30">
        <h4 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h4>
        <p className="text-sm text-[var(--color-text)]/70 mb-6">
          These actions are permanent and cannot be undone.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text)]">Delete your account</span>
          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>

        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/40"
          >
            <p className="text-red-400 mb-3">
              Are you sure? This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[var(--color-text)] rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AccountSecuritySettings;