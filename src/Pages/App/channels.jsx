import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Hash, Users, Lock, Trash2, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';
import channelService from '../../services/channelService';

/**
 * Channels Page
 * Manage study channels - create, view, edit, delete
 */
export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await channelService.getMyChannels();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setMessage({ type: 'error', text: 'Failed to load channels' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (channelData) => {
    try {
      const newChannel = await channelService.createChannel(channelData);
      setChannels(prev => [newChannel, ...prev]);
      setShowCreateModal(false);
      setMessage({ type: 'success', text: 'Channel created successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to create channel:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create channel' });
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;

    try {
      await channelService.deleteChannel(channelId);
      setChannels(prev => prev.filter(ch => ch._id !== channelId));
      setMessage({ type: 'success', text: 'Channel deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to delete channel:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete channel' });
    }
  };

  return (
    <div className="h-screen w-full bg-transparent text-white overflow-y-auto">
      <main className="max-w-6xl mx-auto p-4 sm:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--color-text)]">Channels</h1>
            <p className="text-[var(--color-text)]/70 mt-2">
              Organize your study materials in dedicated channels
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-lg"
          >
            <Plus size={20} />
            New Channel
          </motion.button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : channels.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Hash size={64} className="mx-auto text-[var(--color-text)]/30 mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              No channels yet
            </h3>
            <p className="text-[var(--color-text)]/70 mb-6">
              Create your first channel to start organizing your study materials
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-lg"
            >
              Create Channel
            </motion.button>
          </motion.div>
        ) : (
          /* Channels Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel, index) => (
              <ChannelCard
                key={channel._id}
                channel={channel}
                index={index}
                onDelete={handleDeleteChannel}
                onSelect={setSelectedChannel}
              />
            ))}
          </div>
        )}

        {/* Create Channel Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateChannelModal
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateChannel}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/**
 * Channel Card Component
 */
function ChannelCard({ channel, index, onDelete, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
      onClick={() => onSelect(channel)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
            {channel.isPrivate ? (
              <Lock size={24} className="text-[var(--color-primary)]" />
            ) : (
              <Hash size={24} className="text-[var(--color-primary)]" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              {channel.name}
            </h3>
            <span className="text-xs text-[var(--color-text)]/50">
              {channel.isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
        </div>
      </div>

      {channel.description && (
        <p className="text-sm text-[var(--color-text)]/70 mb-4 line-clamp-2">
          {channel.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-[var(--color-text)]/50">
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{channel.members?.length || 0} members</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(channel._id);
          }}
          className="p-2 hover:bg-red-500/20 rounded transition-colors"
        >
          <Trash2 size={16} className="text-red-400" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/**
 * Create Channel Modal Component
 */
function CreateChannelModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreate(formData);
    } catch (err) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[var(--color-background)] border border-white/10 rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text)]">Create Channel</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-[var(--color-text)]" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
                Channel Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., JavaScript Study Group"
                className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this channel about?"
                rows="3"
                className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="w-4 h-4 rounded border-white/10 bg-black/20 text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <label htmlFor="isPrivate" className="text-sm text-[var(--color-text)]/90">
                Make this channel private
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                className="flex-1 bg-[var(--color-primary)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Channel'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
