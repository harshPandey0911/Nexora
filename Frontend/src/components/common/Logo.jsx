import React, { forwardRef } from 'react';

/**
 * Centralized Logo Component
 * Usage: <Logo className="h-8 w-auto" />
 * Supports ref for animations
 */
const Logo = forwardRef(({ className = "h-8 w-auto", ...props }, ref) => {
  return (
    <img
      ref={ref}
      src="https://res.cloudinary.com/dcl98vsqm/image/upload/v1715424754/Homster/Home/nexora_icon_n.png"
      alt="Nexora"
      className={`${className} object-contain`}
      {...props}
      onError={(e) => {
        // Fallback to a stable placeholder if the custom one fails
        e.target.src = "https://img.icons8.com/color/96/n.png";
      }}
    />
  );
});

Logo.displayName = 'Logo';

export default Logo;
