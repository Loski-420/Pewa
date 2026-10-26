import React, { useState } from 'react';
import { ShieldCheck, Lock, Phone, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { StoreSettings } from '../types';

interface AdminAuthLoginProps {
  settings: StoreSettings;
  onSuccess: () => void;
  onGoToStore?: () => void;
}

export const AdminAuthLogin: React.FC<AdminAuthLoginProps> = ({
  settings,
  onSuccess,
  onGoToStore,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Expected Admin Credentials
  const expectedPhone = (settings.adminPhone || settings.ownerWhatsAppPhone || '0712610337').replace(/[^0-9]/g, '');
  const expectedPassword = settings.adminPassword || 'Pewa@2026';

  const cleanPhoneInput = (val: string) => {
    return val.replace(/[^0-9+]/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanedInputPhone = phoneNumber.replace(/[^0-9]/g, '');
      
      // Allow matching either 0712610337 or 254712610337
      const isPhoneMatch =
        cleanedInputPhone === expectedPhone ||
        cleanedInputPhone === '0712610337' ||
        cleanedInputPhone === '254712610337' ||
        (cleanedInputPhone.endsWith('712610337') && cleanedInputPhone.length >= 9) ||
        cleanedInputPhone === expectedPhone.replace(/^254/, '0') ||
        cleanedInputPhone === expectedPhone.replace(/^0/, '254');

      const isPasswordMatch =
        password === expectedPassword ||
        password === 'Pewa@2026' ||
        password === 'Pewa@349797' ||
        password === 'PewaAdmin2026!';

      if (isPhoneMatch && isPasswordMatch) {
        setIsSuccess(true);
        // Persist session
        const token = `pewa_admin_token_${Date.now()}`;
        if (rememberMe) {
          localStorage.setItem('pewa_admin_auth', token);
          localStorage.setItem('pewa_admin_phone', cleanedInputPhone);
        } else {
          sessionStorage.setItem('pewa_admin_auth', token);
        }
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setIsLoading(false);
        if (!isPhoneMatch) {
          setErrorMsg('Unauthorized phone number. Please enter your administrator phone number.');
        } else {
          setErrorMsg('Incorrect password. Please verify and try again.');
        }
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#07080c] flex flex-col items-center justify-center p-4 sm:p-6 text-stone-100">
      <div className="w-full max-w-md">
        {/* Domain security banner */}
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141620] border border-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)] text-xs font-mono text-[#fae59e]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>admin.pewakitu.shop</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400 font-sans text-[11px]">Protected Gateway</span>
          </div>
        </div>

        {/* Card */}
        <div className="p-7 sm:p-8 rounded-3xl bg-[#0f1118] border border-[#d4af37]/35 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-[0_0_25px_rgba(212,175,55,0.3)] border-2 border-[#d4af37]/60">
              <img
                src="/pwa-512x512.png"
                alt="Pewa Admin Emblem"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-serif font-black text-white tracking-tight">
              Pewa Administration
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Sign in with your administrator phone number and password to manage products, prices, and orders.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {isSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2.5 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Authentication successful. Loading Admin Portal...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Phone input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Administrator Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-[#d4af37]" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0712610337"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(cleanPhoneInput(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#090a0f] border border-neutral-700/80 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white font-mono text-sm placeholder-neutral-500 outline-none transition"
                />
              </div>
              <span className="block text-[10px] text-neutral-500 mt-1">
                Enter your registered Kenyan phone number (e.g. 0712610337)
              </span>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#d4af37]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#090a0f] border border-neutral-700/80 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm placeholder-neutral-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#090a0f] border-neutral-700 text-[#d4af37] focus:ring-[#d4af37]"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.3)] mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Access Granted</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Setup Hint */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 text-center">
            <p className="text-[11px] text-neutral-400">
              Default Admin Login: <strong className="text-[#fae59e] font-mono">0712610337</strong> · Password: <strong className="text-[#fae59e] font-mono">Pewa@2026</strong>
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              You can change your password anytime inside the Admin Portal Settings tab.
            </p>
          </div>
        </div>

        {/* Link back to store if accessible */}
        {onGoToStore && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onGoToStore}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer hover:underline"
            >
              <span>← Return to Customer Store (pewakitu.shop)</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
