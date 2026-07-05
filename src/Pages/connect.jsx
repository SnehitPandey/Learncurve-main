import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, X, Link } from 'lucide-react';
import { apiClient } from '../services/api';

const ConnectPage = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Connecting...');

  useEffect(() => {
    const redeem = async () => {
      try {
        // Try server redeem first
        try {
          const res = await apiClient.post('/api/share/redeem', { token: linkId });
          if (res && res.success && res.link) {
            const partnerInfo = {
              id: res.link.ownerId,
              name: res.link.ownerName || 'Study Partner',
              initials: (res.link.ownerName || 'SP').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
              avatarUrl: null,
              online: true,
              studying: null,
              studiedToday: false,
            };
            localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));
            setStatus('success');
            setMessage(`Connected with ${partnerInfo.name}! Redirecting to Home...`);
            setTimeout(() => navigate('/home'), 1200);
            return;
          }
        } catch (err) {
          console.warn('Server redeem failed, falling back to local redeem', err);
        }

        // Local fallback redeem (for legacy/local-only links)
        const storeKey = 'focuskami_share_links';
        const existing = JSON.parse(localStorage.getItem(storeKey) || '{}');
        const entry = existing[linkId];

        if (!entry) {
          setStatus('error');
          setMessage('This link is invalid or has expired.');
          return;
        }

        if (entry.used) {
          setStatus('error');
          setMessage('This link has already been used.');
          return;
        }

        // Prevent self-connecting if user stored in localStorage is same as entry.userId
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user && String(user.id) === String(entry.userId)) {
          setStatus('error');
          setMessage("You can't connect to your own share link.");
          return;
        }

        // Mark used
        existing[linkId].used = true;
        existing[linkId].usedAt = new Date().toISOString();
        localStorage.setItem(storeKey, JSON.stringify(existing));

        // Set partner info for the current user
        const partnerInfo = {
          id: entry.userId,
          name: entry.name || 'Study Partner',
          initials: entry.initials || 'SP',
          avatarUrl: entry.avatarUrl || null,
          online: true,
          studying: null,
          studiedToday: false,
        };

        localStorage.setItem('focuskami_study_partner', JSON.stringify(partnerInfo));

        setStatus('success');
        setMessage(`Connected with ${partnerInfo.name}! Redirecting to Home...`);

        setTimeout(() => {
          navigate('/home');
        }, 1200);
      } catch (err) {
        console.error('Connect redeem error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to redeem link');
      }
    };

    redeem();
  }, [linkId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl p-8 border border-text/10 shadow-lg max-w-md w-full text-center"
      >
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Link size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold">Connecting...</h2>
        </div>

        <p className="text-text/70 mb-6">{message}</p>

        {status === 'success' && (
          <div className="text-green-500 mb-2 flex items-center justify-center gap-2">
            <CheckCircle /> Connected
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-400 mb-2 flex items-center justify-center gap-2">
            <X /> {message}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
          >
            Go to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConnectPage;
