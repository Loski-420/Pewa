import React, { useState } from 'react';
import { X, Download, Smartphone, CheckCircle, Share2, Sparkles, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { PewaAppIcon } from './PewaAppIcon';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [hasTriggeredInstall, setHasTriggeredInstall] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setHasTriggeredInstall(true);
      }
    } else {
      // Trigger download of standalone web app launcher file with embedded icon
      const appUrl = window.location.href;
      const iconUrl = `${window.location.origin}/favicon.ico`;
      const fileContent = `[InternetShortcut]\nURL=${appUrl}\nIconFile=${iconUrl}\nIconIndex=0\nHotKey=0\n[{000214A0-0000-0000-C000-000000000046}]\nProp3=19,11\n`;
      const blob = new Blob([fileContent], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'Pewa-Online-Liquor-Delivery.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      setHasTriggeredInstall(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#121319] border border-[#d4af37]/40 shadow-[0_0_50px_rgba(212,175,55,0.25)] text-left">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Icon Banner */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-neutral-800">
          <div className="w-18 h-18 rounded-full overflow-hidden shrink-0 flex items-center justify-center drop-shadow-lg">
            <img
              src="/pwa-512x512.png"
              alt="Pewa Official App Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif font-bold text-white">
                Download Pewa App
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                PWA Web App
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              Install Pewa on your phone or computer for instant access, live GPS order tracking, and 20 points per order (20 points = 20 Ksh, redeemable anytime).
            </p>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0e1017] border border-neutral-800 mb-5">
          <button
            type="button"
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer text-center ${
              activePlatform === 'android'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Android / Chrome
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer text-center ${
              activePlatform === 'ios'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            iPhone / iPad (iOS)
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('desktop')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer text-center ${
              activePlatform === 'desktop'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            PC / Mac Desktop
          </button>
        </div>

        {/* Platform-specific Instructions */}
        {activePlatform === 'android' && (
          <div className="p-4 rounded-xl bg-[#161822] border border-neutral-800 space-y-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Smartphone className="w-4 h-4 text-[#d4af37]" />
              <span>Install to Android Home Screen</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Install Pewa as a native-like app directly from your browser. No Play Store download needed, zero battery drain, and opens in full screen!
            </p>
            <div className="text-[11px] text-neutral-400 space-y-1 pt-1">
              <p>1. Tap the <strong>Install App</strong> button below</p>
              <p>2. Or tap the browser menu (⋮) &gt; select <strong>Add to Home screen</strong></p>
              <p>3. Tap <strong>Install</strong> to add the Pewa icon to your apps</p>
            </div>
          </div>
        )}

        {activePlatform === 'ios' && (
          <div className="p-4 rounded-xl bg-[#161822] border border-neutral-800 space-y-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Share2 className="w-4 h-4 text-[#d4af37]" />
              <span>Add to iPhone / iPad Home Screen</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Safari supports 1-tap installation directly onto your iOS home screen:
            </p>
            <div className="p-3 rounded-lg bg-[#0c0d12] border border-neutral-800 text-xs text-neutral-300 space-y-2">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[10px]">1</span>
                <span>Tap the <strong>Share</strong> icon at the bottom of Safari</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[10px]">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[10px]">3</span>
                <span>Tap <strong>Add</strong> at top right to launch with the Pewa icon</span>
              </p>
            </div>
          </div>
        )}

        {activePlatform === 'desktop' && (
          <div className="p-4 rounded-xl bg-[#161822] border border-neutral-800 space-y-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>Install Pewa on Chrome / Edge / macOS</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Look for the <strong>Install Pewa</strong> icon on the right side of your browser address bar, or download our instant desktop web launcher.
            </p>
          </div>
        )}

        {/* Benefits Strip */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300 mb-6">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0e1017]">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <span>Fast 300px image loading</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e1017]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Real-time GPS rider map</span>
          </div>
        </div>

        {/* Action Button */}
        {hasTriggeredInstall ? (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center text-xs text-emerald-300">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="font-semibold text-white">Web App Installation Initiated!</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              Check your home screen or desktop for the Pewa App Icon.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
          >
            <Download className="w-4 h-4" />
            <span>Install / Download Pewa Web App</span>
          </button>
        )}

        <div className="mt-3.5 pt-3 border-t border-neutral-800/80 text-center flex items-center justify-center">
          <a
            href="/pewa-logo.jpg"
            download="Pewa-App-Logo-Icon.jpg"
            className="inline-flex items-center gap-1.5 text-xs text-[#fae59e] hover:text-white transition font-medium cursor-pointer py-1 px-2.5 rounded-lg hover:bg-neutral-800/60"
            title="Download the official 1400x1400 high-res Pewa courier logo"
          >
            <Download className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Download Official Logo Image (1400×1400)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
