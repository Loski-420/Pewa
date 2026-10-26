import React from 'react';
import { ShoppingBag, ShieldCheck, Award, MessageCircle } from 'lucide-react';
import { Logo } from './Logo';
import { CartItem, StoreSettings } from '../types';
import { DownloadAppButton } from './DownloadAppButton';
import { getDirectWhatsAppUrl } from '../utils/whatsapp';

interface NavbarProps {
  currentView: 'store' | 'tracking' | 'rider' | 'admin';
  onNavigate: (view: 'store' | 'tracking' | 'rider' | 'admin') => void;
  cartItems: CartItem[];
  onOpenCart: () => void;
  orderCount: number;
  customerPoints: number;
  isAgeVerified: boolean;
  onResetAgeVerification: () => void;
  onOpenDownloadApp: () => void;
  settings?: StoreSettings;
  isAdminDomain?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  cartItems,
  onOpenCart,
  orderCount,
  customerPoints,
  isAgeVerified,
  onResetAgeVerification,
  onOpenDownloadApp,
  settings,
  isAdminDomain = false,
}) => {
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const whatsappUrl = getDirectWhatsAppUrl(settings?.ownerWhatsAppPhone || '254712610337');

  return (
    <header className="sticky top-0 z-40 bg-[#0c0d12]/95 backdrop-blur-md border-b border-[#d4af37]/25 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: Brand Logo with Official Delivery Van & Wordmark */}
        <div
          onClick={() => onNavigate('store')}
          className="cursor-pointer shrink-0"
        >
          <Logo size="md" />
        </div>

        {/* Zone 2: 4 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => onNavigate('store')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentView === 'store'
                ? 'text-[#fae59e] border-b-2 border-[#d4af37] pb-1'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Spirits & Munchies
          </button>

          <button
            type="button"
            onClick={() => onNavigate('tracking')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentView === 'tracking'
                ? 'text-[#fae59e] border-b-2 border-[#d4af37] pb-1'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Orders & Points</span>
            {customerPoints > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#201d14] border border-[#d4af37]/40 text-[#fae59e] text-[10px] font-mono flex items-center gap-0.5">
                <Award className="w-2.5 h-2.5 text-[#d4af37]" />
                <span>{customerPoints}</span>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('rider')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentView === 'rider'
                ? 'text-[#fae59e] border-b-2 border-[#d4af37] pb-1'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Rider Hub
          </button>

          {isAdminDomain && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                currentView === 'admin'
                  ? 'bg-[#d4af37] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-[#181a24] text-[#fae59e] border border-[#d4af37]/60 hover:border-[#d4af37] hover:bg-[#222536]'
              }`}
              title="Open Admin Panel: Edit/Delete Products, Update Prices & Manage Orders"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action, WhatsApp & Download App Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Direct WhatsApp Option */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat directly on WhatsApp (0712610337)"
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition cursor-pointer shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span className="hidden sm:inline font-mono text-[11px] text-emerald-200">0712610337</span>
          </a>

          {/* Download App Button with Pewa Icon */}
          <DownloadAppButton onClick={onOpenDownloadApp} variant="nav" />

          {/* Customer Redeemable Points Tag */}
          <button
            type="button"
            onClick={() => onNavigate('tracking')}
            title="Redeemable Pewa Gold Points. Click to view profile."
            className="hidden lg:flex items-center gap-1 text-[11px] text-[#fae59e] px-2.5 py-1.5 rounded-xl bg-[#1b1810] border border-[#d4af37]/40 hover:brightness-110 transition cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="font-mono font-bold">{customerPoints} Pts</span>
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-2 hover:brightness-110 active:scale-95 transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)] whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">Basket</span>
            <span className="w-5 h-5 rounded-full bg-black text-[#fae59e] font-mono text-[11px] font-bold flex items-center justify-center">
              {totalCartCount}
            </span>
            {cartSubtotal > 0 && (
              <span className="hidden md:inline font-mono text-[11px] font-bold border-l border-black/30 pl-2">
                KES {cartSubtotal.toLocaleString()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row for Small Screens */}
      <div className="md:hidden flex items-center justify-around py-2 bg-[#0e1017] border-t border-neutral-800/80 text-[11px] font-medium uppercase tracking-wider">
        <button
          onClick={() => onNavigate('store')}
          className={`py-1 px-2 ${currentView === 'store' ? 'text-[#fae59e] font-bold' : 'text-neutral-400'}`}
        >
          Store
        </button>
        <button
          onClick={() => onNavigate('tracking')}
          className={`py-1 px-2 flex items-center gap-1 ${currentView === 'tracking' ? 'text-[#fae59e] font-bold' : 'text-neutral-400'}`}
        >
          <span>Orders</span>
          <span className="text-[9px] font-mono text-[#fae59e]">({customerPoints}p)</span>
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1 px-2 text-emerald-400 font-semibold flex items-center gap-1"
        >
          <MessageCircle className="w-3 h-3 fill-emerald-400" />
          <span>WhatsApp</span>
        </a>
        <button
          onClick={() => onNavigate('rider')}
          className={`py-1 px-2 ${currentView === 'rider' ? 'text-[#fae59e] font-bold' : 'text-neutral-400'}`}
        >
          Riders
        </button>
        {isAdminDomain && (
          <button
            onClick={() => onNavigate('admin')}
            className={`py-1 px-3 rounded-lg flex items-center gap-1 font-bold ${
              currentView === 'admin'
                ? 'bg-[#d4af37] text-black shadow'
                : 'text-[#fae59e] bg-[#1a1c28] border border-[#d4af37]/60'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
