/**
 * Theme Utility
 * Handles theme and accent color initialization and application
 */

const accentColors = [
  { id: 'teal', color: 'rgb(29, 211, 193)', rgb: '29, 211, 193' },
  { id: 'sky', color: 'rgb(14, 165, 233)', rgb: '14, 165, 233' },
  { id: 'indigo', color: 'rgb(99, 102, 241)', rgb: '99, 102, 241' },
  { id: 'rose', color: 'rgb(244, 63, 94)', rgb: '244, 63, 94' }
];

/**
 * Initialize theme from localStorage
 */
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
};

/**
 * Get storage key for user-specific accent color
 */
const getAccentColorKey = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return `accentColor_${userData._id || userData.id}`;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  return 'accentColor'; // Fallback for non-logged-in users
};

/**
 * Initialize accent color from localStorage
 */
export const initializeAccentColor = () => {
  const colorKey = getAccentColorKey();
  const savedColorId = localStorage.getItem(colorKey);
  
  if (savedColorId) {
    const color = accentColors.find(c => c.id === savedColorId);
    if (color) {
      applyAccentColor(color);
    }
  } else {
    // Apply default (teal)
    applyAccentColor(accentColors[0]);
  }
};

/**
 * Apply accent color to CSS variables
 */
export const applyAccentColor = (colorConfig) => {
  document.documentElement.style.setProperty('--color-primary', colorConfig.color);
  document.documentElement.style.setProperty('--color-primary-rgb', colorConfig.rgb);
};

/**
 * Initialize all theme settings
 * Should be called once when the app loads
 */
export const initializeThemeSettings = () => {
  initializeTheme();
  initializeAccentColor();
};

export { accentColors, getAccentColorKey };
