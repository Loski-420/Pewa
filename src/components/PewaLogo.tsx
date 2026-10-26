import React from 'react';
import { PewaAppIcon } from './PewaAppIcon';

interface PewaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const PewaLogo: React.FC<PewaLogoProps> = ({
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const iconPixelSizes = {
    sm: 36,
    md: 48,
    lg: 64,
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3.5xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Pewa Courier Emblem */}
      <div className="shrink-0 transition-transform hover:scale-105 duration-200 rounded-full overflow-hidden shadow-md">
        <PewaAppIcon size={iconPixelSizes[size]} className="rounded-full" />
      </div>

      {/* Official Pewa Typographic Brand Wordmark */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center">
          <span
            className={`font-black tracking-tight text-[#f8fafc] ${textSizes[size]}`}
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            <span className="text-white">P</span>
            <span className="text-white">e</span>
            <span className="text-white">w</span>
            <span className="text-[#fae59e]">a</span>
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`text-neutral-300 font-medium tracking-wide mt-0.5 whitespace-nowrap hidden xs:inline sm:inline ${subSizes[size]}`}
            style={{ letterSpacing: '0.04em' }}
          >
            Liquor &amp; Munchies Delivery
          </span>
        )}
      </div>
    </div>
  );
};
