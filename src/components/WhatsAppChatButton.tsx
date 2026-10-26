import React, { useState } from 'react';
import { MessageCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types';
import { getDirectWhatsAppUrl } from '../utils/whatsapp';

interface WhatsAppChatButtonProps {
  settings: StoreSettings;
}

export const WhatsAppChatButton: React.FC<WhatsAppChatButtonProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const directPhone = settings.ownerWhatsAppPhone || '254712610337';
  const displayPhone = '0712610337';
  const whatsappUrl = getDirectWhatsAppUrl(directPhone, 'Hello Pewa! I would like to order drinks & munchies / have an inquiry.');

  return (
    <aside aria-label="WhatsApp Support and Quick Order" className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Expandable Quick WhatsApp Card */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 rounded-2xl bg-[#0f1118]/95 border border-emerald-500/40 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-md animate-fade-in text-left">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">Pewa WhatsApp Direct</h4>
                <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                  {displayPhone}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-white transition rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-neutral-300 space-y-2">
            <p className="leading-relaxed">
              Order premium spirits, chilled beers & munchies directly or track your rider.
            </p>
            <div className="p-2 rounded-lg bg-[#08090d] border border-neutral-800/80 text-[11px] text-[#fae59e] flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Official Kopo Kopo Till: <strong>{settings.kopoKopoTillNumber}</strong></span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Chat on WhatsApp ({displayPhone})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Floating Pill / Trigger Button */}
      <div className="flex items-center gap-2">
        {!isOpen && (
          <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-[#0d0f14]/90 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-lg backdrop-blur pointer-events-none">
            WhatsApp: <strong className="font-mono text-white">{displayPhone}</strong>
          </span>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Open WhatsApp chat with Pewa at ${displayPhone}`}
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-500 text-white flex items-center justify-center shadow-[0_4px_25px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-emerald-300/40"
          title={`Order on WhatsApp (${displayPhone})`}
        >
          <MessageCircle className="w-7 h-7 fill-white text-white drop-shadow" />
          {/* Active Status Pulse Indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-300 border-2 border-[#0c0d12]"></span>
          </span>
        </button>
      </div>
    </aside>
  );
};
