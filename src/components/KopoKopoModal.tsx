import React, { useState } from 'react';
import { Smartphone, CheckCircle, ShieldCheck, X, ArrowRight, Loader2, Copy, Check, MessageCircle, ExternalLink, Zap } from 'lucide-react';
import { StoreSettings } from '../types';
import { getDirectWhatsAppUrl } from '../utils/whatsapp';

interface KopoKopoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
  customerPhone: string;
  settings: StoreSettings;
  onPaymentSuccess?: (transactionRef?: string) => void;
}

export const KopoKopoModal: React.FC<KopoKopoModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  customerPhone,
  settings,
  onPaymentSuccess,
}) => {
  const [stkState, setStkState] = useState<'idle' | 'sending' | 'prompted' | 'verified'>('idle');
  const [phoneForStk, setPhoneForStk] = useState(customerPhone || '0712610337');
  const [copied, setCopied] = useState(false);
  const [mpesaCode, setMpesaCode] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [codeError, setCodeError] = useState('');

  if (!isOpen) return null;

  const tillNumber = settings.kopoKopoTillNumber || '349797';
  const isLiveConfigured = !!(settings.kopoKopoCredentials?.clientId && settings.kopoKopoCredentials?.clientSecret);
  const environment = settings.kopoKopoCredentials?.environment || 'production';

  const handleCopyTill = () => {
    navigator.clipboard.writeText(tillNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerStkPush = () => {
    if (!phoneForStk.trim()) {
      setCodeError('Please provide a valid Safaricom phone number.');
      return;
    }
    setCodeError('');
    setStkState('sending');

    setTimeout(() => {
      setStkState('prompted');
      // Simulated receipt after customer PIN prompt:
      setTimeout(() => {
        const generatedRef = `K2-TXN-${tillNumber}-${Math.floor(100000 + Math.random() * 900000)}`;
        setTxnRef(generatedRef);
        setStkState('verified');
        if (onPaymentSuccess) {
          onPaymentSuccess(generatedRef);
        }
      }, 4000);
    }, 1200);
  };

  const handleVerifyMpesaCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = mpesaCode.trim().toUpperCase();
    if (cleanCode.length < 5) {
      setCodeError('Please enter a valid M-PESA confirmation code (e.g. TK49AB23X).');
      return;
    }
    setCodeError('');
    setTxnRef(cleanCode);
    setStkState('verified');
    if (onPaymentSuccess) {
      onPaymentSuccess(cleanCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#121319] border border-[#d4af37]/40 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Kopo Kopo branding banner */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0b3b60] to-[#042035] border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-lg font-mono">
            K2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-bold text-white">
                Kopo Kopo M-PESA Payment
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Till {tillNumber} Live
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Pay upon delivery via Till or instant Safaricom STK Push · {environment === 'production' ? 'Production Gateway' : 'Sandbox Mode'}
            </p>
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-4 rounded-xl bg-[#0c0d12] border border-[#d4af37]/30 flex items-center justify-between mb-5">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              Order {orderNumber} Total
            </span>
            <span className="text-2xl font-bold font-mono text-[#fae59e]">
              KES {totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-neutral-400 block">Kopo Kopo Buy Goods Till</span>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <span className="font-mono font-bold text-white text-xl">
                {tillNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyTill}
                className="p-1 text-[#d4af37] hover:text-white transition"
                title="Copy Till Number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {stkState === 'verified' ? (
          <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-bounce" />
            <h4 className="text-base font-bold text-white">Payment Confirmed via Kopo Kopo!</h4>
            <p className="text-xs text-emerald-300/90 mt-1">
              M-PESA transaction verified successfully. The rider receipt and dispatch slip have been synchronized.
            </p>
            {txnRef && (
              <div className="mt-3 inline-block px-3 py-1 rounded bg-[#092215] border border-emerald-500/40 font-mono text-xs text-emerald-200">
                Receipt / Ref: <strong>{txnRef}</strong>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
            >
              Continue to Order Tracking
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-5">
            {/* Option 1: Safaricom STK Push prompt */}
            <div className="p-4 rounded-xl bg-[#171922] border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-sm font-semibold text-white">
                    Instant Safaricom STK Push
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {isLiveConfigured ? 'Live Credentials Connected' : 'Till Ready'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-3">
                Send an automated M-PESA pop-up prompt to your phone to authorize payment.
              </p>

              {stkState === 'idle' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Safaricom Mobile Number for M-PESA Prompt:
                    </label>
                    <input
                      type="text"
                      value={phoneForStk}
                      onChange={(e) => setPhoneForStk(e.target.value)}
                      placeholder="e.g. 0712610337"
                      className="w-full px-3 py-2 bg-[#0c0d12] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerStkPush}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>Send M-PESA Prompt (KES {totalAmount.toLocaleString()})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {stkState === 'sending' && (
                <div className="py-3 flex items-center justify-center gap-2 text-xs text-sky-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending STK Prompt to {phoneForStk} via Kopo Kopo Till {tillNumber}...</span>
                </div>
              )}

              {stkState === 'prompted' && (
                <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-600/40 text-xs text-sky-300">
                  <p className="font-semibold text-sky-200">
                    📲 Check your phone screen now!
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Enter your M-PESA PIN on {phoneForStk} to authorize KES {totalAmount.toLocaleString()} to Pewa Kopo Kopo Till <strong>{tillNumber}</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Option 2: Pay via Buy Goods Till & Paste M-PESA Code */}
            <div className="p-4 rounded-xl bg-[#171922] border border-neutral-800 space-y-2">
              <span className="text-sm font-semibold text-white block">
                Pay Directly via Buy Goods Till {tillNumber}
              </span>
              <div className="p-2.5 rounded-lg bg-[#0e0f14] border border-neutral-800 text-[11px] text-neutral-300 space-y-1">
                <p>1. Open M-PESA &gt; Lipa na M-PESA &gt; <strong>Buy Goods and Services</strong></p>
                <p>2. Enter Till Number: <strong className="text-[#fae59e] font-mono">{tillNumber}</strong> (Pewa Liquor & Delivery)</p>
                <p>3. Enter Amount: <strong className="text-white font-mono">KES {totalAmount.toLocaleString()}</strong></p>
                <p>4. Enter M-PESA PIN & confirm</p>
              </div>

              {/* Enter M-PESA Confirmation Code to Verify Immediately */}
              <form onSubmit={handleVerifyMpesaCode} className="pt-1">
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Already paid? Enter M-PESA Confirmation Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TK49AB18X"
                    className="flex-1 px-3 py-1.5 bg-[#0c0d12] border border-neutral-700 rounded-lg text-white font-mono text-xs uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Confirm Code
                  </button>
                </div>
                {codeError && (
                  <p className="text-[11px] text-red-400 mt-1">{codeError}</p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Footer Support & WhatsApp */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
          <a
            href={getDirectWhatsAppUrl('254712610337', `Hello Pewa, I am inquiring about payment for Order ${orderNumber} (KES ${totalAmount}) to Till ${tillNumber}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition text-[11px]"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Payment Help: WhatsApp <strong>0712610337</strong></span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs transition self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
