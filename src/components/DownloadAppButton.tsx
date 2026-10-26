import React from 'react';
import { Download } from 'lucide-react';
import { PewaAppIcon } from './PewaAppIcon';

interface DownloadAppButtonProps {
  onClick: () => void;
  variant?: 'nav' | 'banner';
  className?: string;
}

export const DownloadAppButton: React.FC<DownloadAppButtonProps> = ({
  onClick,
  variant = 'nav',
  className = '',
}) => {
  if (variant === 'nav') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Download / Install Pewa Web App on your phone"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1a1d28] to-[#12141f] border border-[#d4af37]/50 text-white hover:border-[#d4af37] text-xs font-semibold tracking-wide transition cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] whitespace-nowrap shrink-0 ${className}`}
      >
        <PewaAppIcon size={18} />
        <span className="hidden sm:inline">Download App</span>
        <span className="sm:hidden">App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-5 rounded-xl bg-gradient-to-r from-[#1e2230] to-[#141622] border border-[#d4af37]/60 text-white font-semibold text-xs tracking-wider uppercase hover:border-[#d4af37] hover:brightness-110 active:scale-95 transition cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2.5 ${className}`}
    >
      <PewaAppIcon size={22} />
      <span>Download Pewa Web App</span>
      <Download className="w-3.5 h-3.5 text-[#d4af37]" />
    </button>
  );
};
