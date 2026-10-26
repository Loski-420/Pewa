import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ isOpen, onVerify }) => {
  const [birthYear, setBirthYear] = useState<string>('2000');
  const [underageError, setUnderageError] = useState(false);
  const currentYear = new Date().getFullYear();

  if (!isOpen) return null;

  const handleVerifyByYear = (e: React.FormEvent) => {
    e.preventDefault();
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || currentYear - year < 18) {
      setUnderageError(true);
      return;
    }
    setUnderageError(false);
    onVerify();
  };

  const handleQuickConfirm = () => {
    setUnderageError(false);
    onVerify();
  };

  const handleReject = () => {
    setUnderageError(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#121319] border border-[#d4af37]/30 shadow-[0_0_40px_rgba(212,175,55,0.18)] text-center">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-[#1e1d16] border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Legal Age Verification Portal</span>
        </div>

        <h2 className="text-2xl font-serif font-bold text-white mb-2">
          Are you 18 or older?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
          In accordance with the laws of Kenya (Alcoholic Drinks Control Act), alcohol may only be purchased and consumed by individuals aged 18 and above.
        </p>

        {underageError ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm mb-6 text-left flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Access Restricted</p>
              <p className="text-xs text-red-300/90 mt-1">
                You must be 18 years of age or older to enter Pewa Spirits Store. Please revisit once you meet the legal drinking age in Kenya.
              </p>
              <button
                type="button"
                onClick={() => setUnderageError(false)}
                className="mt-3 text-xs underline text-neutral-300 hover:text-white"
              >
                Change birth year
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleVerifyByYear} className="p-3.5 rounded-xl bg-[#171922] border border-neutral-800 text-left">
              <label className="block text-xs text-neutral-300 font-medium mb-1.5">
                Confirm your Birth Year:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1920"
                  max={currentYear}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                  placeholder="YYYY"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-sm hover:brightness-110 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  Confirm Year
                </button>
              </div>
            </form>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-[#121319] px-3 text-[11px] text-neutral-500 uppercase tracking-widest absolute">
                or
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-800 bg-[#171922] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 text-sm font-medium transition cursor-pointer"
              >
                I am under 18
              </button>
              <button
                type="button"
                onClick={handleQuickConfirm}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-stone-950 font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
              >
                I am 18 or older
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <Sparkles className="w-3 h-3 text-[#d4af37]/70" />
          <span>Drink responsibly. Not for sale to persons under the age of 18.</span>
        </div>
      </div>
    </div>
  );
};
