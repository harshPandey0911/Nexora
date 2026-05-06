import React, { useEffect } from 'react';

/**
 * ThemeManager component to apply module-specific themes
 * It adds a CSS class to the root element to enable CSS variable overrides
 */
const ThemeManager = ({ children, theme = 'user' }) => {
  useEffect(() => {
    // List of all possible theme classes
    const themeClasses = ['theme-user', 'theme-vendor', 'theme-worker'];
    
    // Remove existing theme classes
    themeClasses.forEach(cls => document.documentElement.classList.remove(cls));
    
    // Add the new theme class
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Cleanup function to remove the class when component unmounts
    // (Optional: depending on if you want the theme to persist or not)
    // return () => {
    //   document.documentElement.classList.remove(`theme-${theme}`);
    // };
  }, [theme]);

  return <>{children}</>;
};

export default ThemeManager;
