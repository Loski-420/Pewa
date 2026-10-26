import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Phone, MapPin, Clock, Download, MessageCircle, ExternalLink } from 'lucide-react';
import { StoreSettings } from '../types';
import { getDirectWhatsAppUrl } from '../utils/whatsapp';

interface FooterProps {
  settings: StoreSettings;
  onNavigate: (view: 'store' | 'tracking' | 'rider' | 'admin') => void;
  onOpenDownloadApp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate, onOpenDownloadApp }) => {
  const whatsappUrl = getDirectWhatsAppUrl(settings.ownerWhatsAppPhone || '254712610337');

  return (
    <footer className="bg-[#08090d] border-t border-neutral-900 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-3">
            <Logo size="md" />
            <p className="text-xs text-neutral-400 leading-relaxed">
              Kenya’s premier digital spirits & munchies delivery service. Delivering fine single malts, botanical gins, aged cognacs, wines, chilled beers, and fresh snacks in 45 minutes.
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-[#fae59e]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Kopo Kopo Buy Goods Till: <strong className="font-mono text-white">{settings.kopoKopoTillNumber}</strong></span>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-white transition text-xs font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>WhatsApp: <strong className="font-mono">0712610337</strong></span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>

          {/* Col 2: Delivery Zones */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Nairobi Same-Day Zones
            </h4>
            <ul className="text-xs space-y-1 text-neutral-400">
              <li>• Kilimani, Kileleshwa & Lavington</li>
              <li>• Westlands, Spring Valley & Parklands</li>
              <li>• Karen, Langata & Hardy</li>
              <li>• South B, South C & Nairobi CBD</li>
              <li>• Roysambu, Garden Estate & Thika Rd</li>
            </ul>
          </div>

          {/* Col 3: Portal Navigation & App Download */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Operations & Portals
            </h4>
            <ul className="text-xs space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('store')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Browse Store & Munchies
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tracking')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Live Order & Rider GPS Tracking
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('rider')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Rider Operations Hub
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Admin Inventory & Price Management
                </button>
              </li>
              {onOpenDownloadApp && (
                <li>
                  <button
                    onClick={onOpenDownloadApp}
                    className="text-[#fae59e] hover:underline font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Download Pewa Web App</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Legal 18+ Warning */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Responsible Drinking (18+)
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Under the Alcoholic Drinks Control Act of Kenya, it is an offence to sell or supply alcohol to anyone under 18 years. Please drink responsibly.
            </p>
            <div className="pt-2 text-[11px] text-neutral-500 font-mono">
              Operating Hours: 10:00 AM – Midnight Daily
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} Pewa Spirits & Delivery Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Kopo Kopo Lipa na M-PESA</span>
            <span>·</span>
            <span>WhatsApp Express Dispatch</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
