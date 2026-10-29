import React from 'react';
import { X, Trash2, Plus, Minus, Clock, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem, StoreSettings } from '../types';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  selectedSchedule: string;
  onScheduleChange: (slot: string) => void;
  onProceedToCheckout: () => void;
  settings: StoreSettings;
}

export const DELIVERY_TIME_SLOTS = [
  'ASAP (Within 45 mins)',
  'Today 2:00 PM - 4:00 PM',
  'Today 4:00 PM - 6:00 PM',
  'Today 6:00 PM - 8:00 PM',
  'Today 8:00 PM - 10:00 PM',
  'Today Late Night (10:00 PM - Midnight)',
];

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedSchedule,
  onScheduleChange,
  onProceedToCheckout,
  settings,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#111218] border-l border-[#d4af37]/30 shadow-2xl flex flex-col text-left">
          {/* Drawer Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-[#151620]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-lg font-serif font-bold text-white">Your Drinks Basket</h2>
              <span className="text-xs text-[#fae59e] font-mono px-2 py-0.5 rounded-full bg-[#201d14] border border-[#d4af37]/30">
                {items.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {items.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-base font-serif font-medium text-neutral-300">
                  Your basket is empty
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Browse our local spirits, fine whiskies, gins, and ice-cold beers to add items.
                </p>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3.5 rounded-xl bg-[#171922] border border-neutral-800 flex gap-3.5 items-center justify-between"
                    >
                      <div className="w-14 h-14 rounded-lg bg-[#0e0f14] border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <ProductImage
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          category={item.product.category}
                          name={item.product.name}
                          width={60}
                          height={60}
                          className="w-full h-full rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {item.product.volume} · {item.product.category}
                        </p>
                        <p className="text-xs font-mono font-bold text-[#fae59e] mt-1">
                          KES {item.product.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-[#0e0f14] border border-neutral-700/80 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-neutral-400 hover:text-white transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 text-neutral-400 hover:text-white transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Same-day Delivery Schedule Picker */}
                <div className="p-4 rounded-xl bg-[#171922] border border-[#d4af37]/30">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2.5">
                    <Clock className="w-4 h-4 text-[#d4af37]" />
                    <span>Schedule Same-Day Delivery</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-3">
                    Choose when you want your chilled bottles delivered to your doorstep today:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DELIVERY_TIME_SLOTS.map((slot) => (
                      <label
                        key={slot}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          selectedSchedule === slot
                            ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#fae59e] font-semibold'
                            : 'bg-[#0e0f14] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="deliverySchedule"
                            value={slot}
                            checked={selectedSchedule === slot}
                            onChange={() => onScheduleChange(slot)}
                            className="text-[#d4af37] focus:ring-[#d4af37]"
                          />
                          <span>{slot}</span>
                        </span>
                        {slot.includes('ASAP') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            Fastest
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-neutral-800 bg-[#151620] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Drinks Subtotal</span>
                  <span className="font-mono text-neutral-200">
                    KES {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span>Express Delivery (Nairobi)</span>
                  </span>
                  <span className="font-mono text-neutral-200">
                    KES {deliveryFee.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between text-sm font-bold text-white">
                  <span>Total Due (Pay on Delivery)</span>
                  <span className="font-mono text-[#fae59e] text-base">
                    KES {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Pay upon delivery via Kopo Kopo / M-PESA Till</span>
              </div>

              <button
                type="button"
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-[#d4af37] to-amber-500 text-black font-serif font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:brightness-110 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Enter Name & Location →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
