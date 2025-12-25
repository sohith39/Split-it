import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const SplitItLogo: React.FC<LogoProps> = ({ className = '', size = 64 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crescent Base */}
      <path 
        d="M28 55C28 72.1208 41.8792 86 59 86C67.5604 86 75.2448 82.5204 80.8284 76.9368C83.9112 73.854 78.4112 71.354 74 74C69.5888 76.646 64.4448 78 59 78C46.2975 78 36 67.7025 36 55C36 51.5552 36.754 48.2724 38.12 45.3284C39.6156 42.3844 35.1156 39.8844 33.0632 41.9368C29.9368 45.0632 28 49.8284 28 55Z" 
        fill="#FFD1E8"
        fillOpacity="0.8"
      />
      
      {/* Layered Bill 1 (Back) */}
      <path 
        d="M55 12L70 30V65C70 67.2091 68.2091 69 66 69H44C41.7909 69 40 67.2091 40 65V30L55 12Z" 
        fill="url(#grad_back)" 
        stroke="#831843" 
        strokeWidth="1.5"
      />
      
      {/* Layered Bill 2 (Middle) */}
      <path 
        d="M45 22L60 40V75C60 77.2091 58.2091 79 56 79H34C31.7909 79 30 77.2091 30 75V40L45 22Z" 
        fill="url(#grad_mid)" 
        stroke="#831843" 
        strokeWidth="1.5"
      />
      
      {/* Layered Bill 3 (Front) */}
      <path 
        d="M35 35L48 50V82C48 84.2091 46.2091 86 44 86H24C21.7909 86 20 84.2091 20 82V50L35 35Z" 
        fill="url(#grad_front)" 
        stroke="#831843" 
        strokeWidth="1.5"
      />

      <defs>
        <linearGradient id="grad_back" x1="55" y1="12" x2="55" y2="69" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ec4899" />
          <stop offset="1" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="grad_mid" x1="45" y1="22" x2="45" y2="79" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="grad_front" x1="34" y1="35" x2="34" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};