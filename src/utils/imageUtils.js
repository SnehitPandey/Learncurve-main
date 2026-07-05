/**
 * Image utility functions
 * Handles image URL transformations for proper loading through proxy
 */

/**
 * Converts absolute backend URLs to relative URLs for proxy compatibility
 * @param {string} url - The URL from the backend (can be absolute or relative)
 * @returns {string} - Relative URL that works with Vite proxy
 */
export const getProxiedImageUrl = (url) => {
  if (!url) return '';
  
  // If it's already a relative URL, return as-is
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it's an absolute URL from backend (localhost or devtunnels), extract the path
  if (url.includes('/uploads/')) {
    const match = url.match(/\/uploads\/.+$/);
    return match ? match[0] : url;
  }

  // If it's a Gravatar URL or external image (https://), return as-is
  if ((url.startsWith('https://') || url.startsWith('http://')) && !url.includes('localhost') && !url.includes('.devtunnels.ms')) {
    return url;
  }

  if (url.startsWith('data:')) {
    return url;
  }
  
  // Return as-is for any other external URL
  return url;
};

/**
 * Get the appropriate avatar URL for a user based on priority
 * Priority: Custom Avatar > Profile Pic (Google/Gravatar) > Default
 * @param {object} user - User object
 * @returns {string} - Avatar URL
 */
export const getUserAvatarUrl = (user) => {
  if (!user) return '';
  
  // Priority 1: Custom uploaded avatar
  if (user.isCustomAvatar && user.customAvatarURL) {
    return getProxiedImageUrl(user.customAvatarURL);
  }
  
  // Priority 2: Profile picture (Google/Gravatar)
  if (user.profilePic) {
    return getProxiedImageUrl(user.profilePic);
  }
  
  // Priority 3: Avatar field (Google Standard)
  if (user.avatar) {
    return getProxiedImageUrl(user.avatar);
  }
  
  // Priority 4: Legacy avatarUrl field
  if (user.avatarUrl) {
    return getProxiedImageUrl(user.avatarUrl);
  }
  
  return '';
};

/**
 * Gets a cache-busted version of an image URL
 * @param {string} url - The image URL
 * @returns {string} - URL with cache-busting query parameter
 */
export const getCacheBustedImageUrl = (url) => {
  if (!url) return '';
  
  const proxiedUrl = getProxiedImageUrl(url);
  const separator = proxiedUrl.includes('?') ? '&' : '?';
  return `${proxiedUrl}${separator}_=${Date.now()}`;
};
