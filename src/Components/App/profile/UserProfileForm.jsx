import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  Camera,
  User,
  Mail,
  Edit3,
  Trash2
} from 'lucide-react';
import profileService from '../../../services/profileService';
import { apiClient } from '../../../services/api';
import { getUserAvatarUrl, getCacheBustedImageUrl } from '../../../utils/imageUtils';

/**
 * Reusable User Profile Form Component
 * Can be used in Settings page or Profile page
 */
const UserProfileForm = ({ onSuccess, onCancel, showCancel = true }) => {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    socialLinks: {
      github: '',
      linkedin: '',
      twitter: '',
      website: ''
    },
    avatarUrl: ''
  });

  // Fetch current profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const user = await profileService.getCurrentProfile();
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        socialLinks: user.socialLinks || {
          github: '',
          linkedin: '',
          twitter: '',
          website: ''
        },
        avatarUrl: getUserAvatarUrl(user) || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      showMessage('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    // Validate URLs
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    if (formData.socialLinks.github && !urlPattern.test(formData.socialLinks.github)) {
      newErrors.github = 'Invalid URL format';
    }
    if (formData.socialLinks.linkedin && !urlPattern.test(formData.socialLinks.linkedin)) {
      newErrors.linkedin = 'Invalid URL format';
    }
    if (formData.socialLinks.twitter && !urlPattern.test(formData.socialLinks.twitter)) {
      newErrors.twitter = 'Invalid URL format';
    }
    if (formData.socialLinks.website && !urlPattern.test(formData.socialLinks.website)) {
      newErrors.website = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
    // Clear error for this field
    if (errors[platform]) {
      setErrors(prev => ({ ...prev, [platform]: undefined }));
    }
  };

  const handleAvatarChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Avatar file size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Avatar must be an image file');
        return;
      }

      try {
        setAvatarLoading(true);
        const updatedUser = await profileService.uploadAvatar(file);
        
        // Debug logging
        console.log('🖼️ Frontend Avatar Upload Debug:');
        console.log('  - Received updatedUser:', updatedUser);
        console.log('  - customAvatarURL:', updatedUser.customAvatarURL);
        console.log('  - isCustomAvatar:', updatedUser.isCustomAvatar);
        console.log('  - profilePic:', updatedUser.profilePic);
        
        // Get the appropriate avatar URL using priority logic
        const avatarUrl = getUserAvatarUrl(updatedUser);
        console.log('  - Computed avatarUrl:', avatarUrl);
        
        // Cache-bust the avatar URL to avoid showing a stale cached image
        const cacheBustedAvatar = getCacheBustedImageUrl(avatarUrl);
        
        console.log('  - Cache-busted avatarUrl:', cacheBustedAvatar);

        setFormData(prev => ({ 
          ...prev, 
          avatarUrl: cacheBustedAvatar,
          username: updatedUser.username || prev.username,
          bio: updatedUser.bio || prev.bio,
          socialLinks: updatedUser.socialLinks || prev.socialLinks
        }));
        
        console.log('  - Updated formData.avatarUrl:', cacheBustedAvatar);
        
        // Update localStorage user data with ALL fields from response
        const currentUser = apiClient.getUser();
        const newUserData = {
          ...currentUser,
          ...updatedUser, // Includes customAvatarURL, isCustomAvatar, profilePic
        };
        apiClient.setUser(newUserData);
        
        console.log('  - Stored in localStorage:', newUserData);
        
        showMessage('success', 'Avatar uploaded successfully!');
        
        // Trigger storage event for other components
        window.dispatchEvent(new Event('storage'));
      } catch (error) {
        console.error('❌ Avatar upload failed:', error);
        showMessage('error', error.message || 'Failed to upload avatar');
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    // Validate form
    if (!validateForm()) {
      showMessage('error', 'Please fix the errors before saving');
      return;
    }

    try {
      setSaveLoading(true);
      setMessage({ type: '', text: '' });
      
      const updatedUser = await profileService.updateProfile({
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        socialLinks: formData.socialLinks
      });
      
      // Update form data with response
      setFormData(prev => ({
        ...prev,
        ...updatedUser
      }));
      
      // Update localStorage user data with ALL fields from response
      const currentUser = apiClient.getUser();
      apiClient.setUser({ 
        ...currentUser,
        ...updatedUser
      });
      
      showMessage('success', 'Profile updated successfully!');
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'));
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(updatedUser);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      showMessage('error', error.message || 'Failed to save changes');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
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

      {/* Avatar Upload */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-4">Profile Picture</h4>
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-2 border-white/20 overflow-hidden">
              {formData.avatarUrl ? (
                <img 
                  src={formData.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('✅ Avatar image loaded successfully:', formData.avatarUrl);
                  }}
                  onError={(e) => {
                    console.error('❌ Avatar image failed to load:', formData.avatarUrl);
                    console.error('   Error event:', e);
                    // If image fails to load, clear avatarUrl so placeholder is shown
                    try { e.currentTarget.onerror = null; } catch (err) {}
                    setFormData(prev => ({ ...prev, avatarUrl: '' }));
                  }}
                />
              ) : (
                <User className="text-gray-400" size={32} />
              )}
            </div>
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                <Loader className="animate-spin text-white" size={24} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-1">Avatar</label>
            </div>
            <motion.label 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white rounded-md cursor-pointer transition-colors"
            >
              <Camera size={16} />
              <span>Change Avatar</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
              />
            </motion.label>
            <p className="text-sm text-[var(--color-text)]/50 mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-4">Basic Information</h4>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Display Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="text"
                placeholder="Your display name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full bg-black/20 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
              />
            </div>
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Username
            </label>
            <div className="relative">
              <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="text"
                placeholder="your_username"
                value={formData.username}
                className={`w-full bg-black/20 border border-white/10 rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                disabled
              />
            </div>
            <p className="text-xs text-[var(--color-text)]/40 mt-1">Username is set from your login credentials</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full bg-black/20 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                disabled
              />
            </div>
            <p className="text-xs text-[var(--color-text)]/40 mt-1">Email cannot be changed</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Bio
            </label>
            <textarea
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className={`w-full bg-black/20 border ${errors.bio ? 'border-red-500' : 'border-white/10'} rounded-md py-2 px-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.bio && <p className="text-red-400 text-sm">{errors.bio}</p>}
              <p className={`text-xs ${formData.bio.length > 450 ? 'text-yellow-400' : 'text-[var(--color-text)]/40'} ml-auto`}>
                {formData.bio.length}/500
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-[var(--color-text)] mb-4">Social Links</h4>
        <div className="space-y-4">
          {/* GitHub */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              GitHub
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="text"
                placeholder="https://github.com/username"
                value={formData.socialLinks.github}
                onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                className={`w-full bg-black/20 border ${errors.github ? 'border-red-500' : 'border-white/10'} rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
              />
            </div>
            {errors.github && <p className="text-red-400 text-sm mt-1">{errors.github}</p>}
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              LinkedIn
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={formData.socialLinks.linkedin}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                className={`w-full bg-black/20 border ${errors.linkedin ? 'border-red-500' : 'border-white/10'} rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
              />
            </div>
            {errors.linkedin && <p className="text-red-400 text-sm mt-1">{errors.linkedin}</p>}
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Twitter
            </label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="text"
                placeholder="https://twitter.com/username"
                value={formData.socialLinks.twitter}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                className={`w-full bg-black/20 border ${errors.twitter ? 'border-red-500' : 'border-white/10'} rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
              />
            </div>
            {errors.twitter && <p className="text-red-400 text-sm mt-1">{errors.twitter}</p>}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input
                type="text"
                placeholder="https://yourwebsite.com"
                value={formData.socialLinks.website}
                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                className={`w-full bg-black/20 border ${errors.website ? 'border-red-500' : 'border-white/10'} rounded-md py-2 pl-10 pr-3 text-[var(--color-text)] placeholder-[var(--color-text)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
              />
            </div>
            {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website}</p>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveChanges}
          disabled={saveLoading}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveLoading ? (
            <>
              <Loader className="animate-spin" size={18} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              <span>Save Changes</span>
            </>
          )}
        </motion.button>

        {showCancel && onCancel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            disabled={saveLoading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-[var(--color-text)] rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default UserProfileForm;
