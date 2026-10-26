import React, { useState } from 'react';

interface PewaAppIconProps {
  size?: number | string;
  className?: string;
  withBackground?: boolean;
}

export const PewaAppIcon: React.FC<PewaAppIconProps> = ({
  size = 48,
  className = '',
  withBackground = false,
}) => {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-full ${
        withBackground
          ? 'bg-white border-2 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] p-0.5'
          : ''
      } ${className}`}
    >
      {!useFallback ? (
        <img
          src="/pwa-512x512.png"
          alt="Pewa App Logo"
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.includes('pewa-logo.jpg')) {
              target.src = '/pwa-512x512.png';
            } else if (target.src.includes('pwa-512x512.png')) {
              target.src = '/images/pewa_app_logo.jpg';
            } else {
              setUseFallback(true);
            }
          }}
        />
      ) : (
        <svg
          viewBox="0 0 200 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
        <defs>
          <linearGradient id="truckBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="truckOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Speed Streaks behind truck */}
        {/* Blue streaks */}
        <path d="M15 48 H65" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M8 58 H55" stroke="#0ea5e9" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M22 68 H48" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
        {/* Orange streaks */}
        <path d="M5 76 H70" stroke="#fb923c" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M18 86 H60" stroke="#f97316" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M12 96 H45" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />

        {/* Delivery Truck Body */}
        {/* Blue Cargo Body */}
        <path
          d="M55 42 H125 V95 H55 C52 95 50 93 50 90 V47 C50 44 52 42 55 42 Z"
          fill="url(#truckBlue)"
        />
        <path
          d="M50 82 H125 V98 H55 C52 98 50 96 50 93 Z"
          fill="#0369a1"
        />

        {/* Orange Cab / Front */}
        <path
          d="M125 52 L142 52 C146 52 150 56 153 62 L163 80 C165 84 165 88 165 92 V98 H125 V52 Z"
          fill="url(#truckOrange)"
        />
        {/* Cab Window */}
        <path
          d="M130 58 H141 C143 58 146 60 148 65 L154 77 C155 79 154 81 152 81 H130 V58 Z"
          fill="#1e293b"
          opacity="0.9"
        />
        {/* Door handle */}
        <rect x="133" y="87" width="9" height="3" rx="1.5" fill="#ffffff" opacity="0.8" />

        {/* Truck Wheels */}
        {/* Front Wheel */}
        <circle cx="145" cy="98" r="14" fill="#0f172a" stroke="#0284c7" strokeWidth="3" />
        <circle cx="145" cy="98" r="6" fill="#38bdf8" />
        {/* Rear Wheel */}
        <circle cx="80" cy="98" r="14" fill="#0f172a" stroke="#0284c7" strokeWidth="3" />
        <circle cx="80" cy="98" r="6" fill="#38bdf8" />

        {/* Center Shield with Gold Border */}
        <g transform="translate(72, 18)">
          {/* Shield Outline & Glow */}
          <path
            d="M28 2 C44 2 56 12 56 26 C56 50 28 66 28 66 C28 66 0 50 0 26 C0 12 12 2 28 2 Z"
            fill="#0f172a"
            stroke="url(#shieldGold)"
            strokeWidth="4.5"
          />
          {/* Inner Shield rim */}
          <path
            d="M28 6 C40 6 51 15 51 26 C51 46 28 60 28 60 C28 60 5 46 5 26 C5 15 16 6 28 6 Z"
            fill="#181e2b"
          />

          {/* Wine Bottle inside Shield */}
          {/* Bottle Neck */}
          <rect x="25.5" y="12" width="5" height="10" rx="1" fill="#f8fafc" />
          <rect x="24.5" y="10" width="7" height="3" rx="1" fill="#f59e0b" />
          {/* Bottle Body */}
          <path
            d="M24 22 C24 20 25 18 28 18 C31 18 32 20 32 22 L33 46 C33 48 31 50 28 50 C25 50 23 48 23 46 Z"
            fill="#f8fafc"
          />
          {/* Orange Bottle Label with 'P' */}
          <rect x="23.5" y="27" width="9" height="12" rx="1.5" fill="#f97316" />
          <text
            x="28"
            y="36"
            fill="#ffffff"
            fontSize="7"
            fontFamily="sans-serif"
            fontWeight="900"
            textAnchor="middle"
          >
            P
          </text>

          {/* Wine Glass next to Bottle */}
          <path
            d="M37 28 C37 28 36 36 41 36 C46 36 45 28 45 28"
            stroke="#f59e0b"
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d="M38 30 C39 33 43 33 44 30"
            fill="#f97316"
          />
          <line x1="41" y1="36" x2="41" y2="44" stroke="#f59e0b" strokeWidth="1.6" />
          <line x1="38" y1="44" x2="44" y2="44" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
      )}
    </div>
  );
};
