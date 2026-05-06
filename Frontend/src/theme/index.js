/**
 * Theme Configuration Export
 * Import this file to use centralized theme colors
 */

import themeColors, { userTheme, vendorTheme, workerTheme } from './colors';

// Re-export all themes
export { themeColors, userTheme, vendorTheme, workerTheme };

// Helper functions for common theme usage
export const getThemeColor = (colorPath) => {
  const paths = colorPath.split('.');
  let value = themeColors;

  for (const path of paths) {
    value = value[path];
    if (value === undefined) {
      console.warn(`Theme color path "${colorPath}" not found`);
      return '#000000'; // Fallback to black
    }
  }

  return value;
};

/**
 * Get a theme color with specific opacity
 * @param {string} colorName 'teal', 'yellow', or 'orange'
 * @param {number} opacity 0 to 1
 * @returns {string} rgba color string
 */
export const getColorWithOpacity = (colorName, opacity) => {
  return `rgba(var(--brand-${colorName}-rgb), ${opacity})`;
};

// Common theme utilities
export const theme = {
  colors: themeColors,
  getColor: getThemeColor,
  getOpacity: getColorWithOpacity,
};

export default theme;

