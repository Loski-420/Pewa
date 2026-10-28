import React, { useState } from 'react';
import { X, MapPin, Phone, User, Clock, ShieldCheck, CheckCircle2, MessageSquare, ArrowRight, ExternalLink, AlertCircle, Award, Gift } from 'lucide-react';
import { CartItem, Order, StoreSettings } from '../types';
import { NAIROBI_ESTATES } from '../data/initialData';
import { DeliveryMap } from './DeliveryMap';
import { generateWhatsAppLink, triggerWhatsAppNotification } from '../utils/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  deliverySchedule: string;
  settings: StoreSettings;
  customerPoints: number;
  onOrderPlaced: (order: Order, pointsRedeemed: number) => void;
  onOpenTracking: (orderId: string) => void;
  onOpenKopoKopo: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  deliverySchedule,
  settings,
  customerPoints,
  onOrderPlaced,
  onOpenTracking,
  onOpenKopoKopo,
}) => {
  const [customerName, setCustomerName] = useState(() => {
    try {
      return localStorage.getItem('pewa_customer_name') || '';
    } catch {
      return '';
    }
  });
  const [safaricomPhone, setSafaricomPhone] = useState(() => {
    try {
      return localStorage.getItem('pewa_customer_phone') || '';
    } catch {
      return '';
    }
  });
  const [address, setAddress] = useState(() => {
    try {
      return localStorage.getItem('pewa_customer_address') || '';
    } catch {
      return '';
    }
  });
  const [estate, setEstate] = useState(() => {
    try {
      return localStorage.getItem('pewa_customer_estate') || 'Kilimani / Hurlingham';
    } catch {
      return 'Kilimani / Hurlingham';
    }
  });
  const [buildingOrHouse, setBuildingOrHouse] = useState(() => {
    try {
      return localStorage.getItem('pewa_customer_building') || '';
    } catch {
      return '';
    }
  });
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState(-1.2950);
  const [lng, setLng] = useState(36.7910);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Points Redemption State (20 points = 20 Ksh, redeemable anytime)
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [customPointsInput, setCustomPointsInput] = useState<number>(20);

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const pointRate = settings.pointValueInKes || 1; // 1 pt = 1 Ksh (20 pts = 20 Ksh)
  const maxRedeemablePoints = Math.min(
    customerPoints,
    Math.floor(subtotal / pointRate)
  );
  const pointsToRedeem = redeemPoints
    ? Math.min(maxRedeemablePoints, Math.max(1, customPointsInput || 20))
    : 0;
  const pointsDiscount = pointsToRedeem * pointRate;

  if (!isOpen) return null;

  const deliveryFee = settings.deliveryFee;
  const total = Math.max(0, subtotal - pointsDiscount) + deliveryFee;

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/[\s-+()]/g, '');
    const kenyaMobile = /^(?:254|0)?(7|1)[0-9]{8}$/;

    if (!clean || !kenyaMobile.test(clean)) {
      setPhoneError('Please enter a valid Kenyan WhatsApp number (e.g. 0712 345 678 or 07...)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleLocationChange = (newLat: number, newLng: number, estateName?: string) => {
    setLat(newLat);
    setLng(newLng);
    if (estateName) {
      setEstate(estateName);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setNameError('Please enter your full name');
      return;
    }
    setNameError('');

    if (!validatePhone(safaricomPhone)) {
      return;
    }

    if (!address.trim()) {
      setAddressError('Please provide your street or landmark');
      return;
    }
    setAddressError('');

    setIsSubmitting(true);

    // Save contact & location in localStorage so customer doesn't have to retype next time
    try {
      localStorage.setItem('pewa_customer_name', customerName.trim());
      localStorage.setItem('pewa_customer_phone', safaricomPhone.trim());
      localStorage.setItem('pewa_customer_address', address.trim());
      localStorage.setItem('pewa_customer_estate', estate);
      localStorage.setItem('pewa_customer_building', buildingOrHouse.trim());
    } catch (_) {}

    const orderNumber = `PEWA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      safaricomPhone: safaricomPhone.trim(),
      items: [...items],
      subtotal,
      deliveryFee,
      pointsEarned: settings.pointsPerOrder || 20, // 20 points earned per order
      pointsRedeemed: pointsToRedeem,
      discountAmount: pointsDiscount,
      total,
      deliverySchedule,
      location: {
        address: address.trim(),
        estate,
        buildingOrHouse: buildingOrHouse.trim(),
        lat,
        lng,
        notes: notes.trim(),
      },
      paymentMethod: 'kopokopo_on_delivery',
      paymentStatus: 'pending_on_delivery',
      status: 'confirmed',
      assignedRiderId: 'rider-1',
      riderEtaMinutes: 25,
      riderCurrentLocation: {
        lat: lat + 0.012,
        lng: lng + 0.010,
      },
      whatsappNotified: true,
      notes: notes.trim(),
    };

    // Trigger WhatsApp notification immediately to 0712610337
    triggerWhatsAppNotification(newOrder, settings);

    onOrderPlaced(newOrder, pointsToRedeem);
    setPlacedOrder(newOrder);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 p-5 sm:p-7 rounded-2xl bg-[#121319] border border-[#d4af37]/40 shadow-[0_0_45px_rgba(212,175,55,0.2)] text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {placedOrder ? (
          /* Success Screen */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#1e1c14] border border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#fae59e] font-semibold">
                Order Placed Successfully
              </span>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">
                {placedOrder.orderNumber}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Your order was dispatched to the Pewa store team and assigned to a delivery rider.
              </p>
            </div>

            {/* Points Awarded Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#201d12] via-[#2a2416] to-[#201d12] border border-[#d4af37]/50 text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#3d3319] border border-[#d4af37] flex items-center justify-center text-[#fae59e]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    +{placedOrder.pointsEarned || 20} Pewa Points Added to Your Profile!
                  </h4>
                  <p className="text-[11px] text-[#fae59e]/90 mt-0.5">
                    Points are redeemable anytime for cash discounts on future orders.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#d4af37] text-black font-mono font-bold text-xs shrink-0">
                +{placedOrder.pointsEarned || 20} PTS
              </span>
            </div>

            {/* WhatsApp Notification Notice Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#062416] via-[#093520] to-[#062416] border-2 border-emerald-500/70 text-left shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center shrink-0 text-emerald-400 shadow-md">
                  <MessageSquare className="w-6 h-6 fill-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span>WhatsApp Order & Location Dispatched to 0712610337</span>
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-500/50 font-mono font-bold">
                      Target: 0712610337
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
                    Customer WhatsApp: <strong className="text-white font-mono">{placedOrder.safaricomPhone}</strong> · Location: <strong className="text-white">{placedOrder.location.estate} · {placedOrder.location.address}</strong> · Total Cash: <strong className="text-[#fae59e] font-mono">KES {placedOrder.total.toLocaleString()}</strong>.
                  </p>
                </div>
              </div>

              {/* Big Direct Send Button */}
              <a
                href={generateWhatsAppLink(placedOrder, settings)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-black" />
                <span>Open WhatsApp & Send Order to 0712610337</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Order Summary Receipt Box */}
            <div className="p-4 rounded-xl bg-[#0e0f15] border border-neutral-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-neutral-400 pb-2 border-b border-neutral-800">
                <span>Customer</span>
                <span className="text-white font-medium">{placedOrder.customerName} ({placedOrder.safaricomPhone})</span>
              </div>
              <div className="flex justify-between text-neutral-400 pb-2 border-b border-neutral-800">
                <span>Destination</span>
                <span className="text-white font-medium text-right max-w-xs truncate">{placedOrder.location.estate} · {placedOrder.location.address}</span>
              </div>
              {placedOrder.pointsRedeemed && placedOrder.pointsRedeemed > 0 && (
                <div className="flex justify-between text-emerald-400 pb-2 border-b border-neutral-800">
                  <span>Points Discount Applied</span>
                  <span className="font-mono font-semibold">-KES {placedOrder.discountAmount} ({placedOrder.pointsRedeemed} pts)</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-400 pb-2 border-b border-neutral-800">
                <span>Payment Method</span>
                <span className="text-emerald-400 font-medium">Pay upon delivery via Kopo Kopo (Till: {settings.kopoKopoTillNumber})</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-white pt-1">
                <span>Total Amount to Pay</span>
                <span className="text-base font-mono text-[#fae59e]">KES {placedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTracking(placedOrder.id);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <span>Track Rider On Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenKopoKopo(placedOrder);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#171922] border border-[#d4af37]/40 text-[#f3e5ab] hover:bg-[#1e202d] text-xs font-semibold tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Kopo Kopo Till / Pay Prompt</span>
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmitOrder} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest text-[#fae59e] font-semibold">
                  Express Same-Day Checkout
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1c14] border border-[#d4af37]/40 text-[#fae59e] font-mono">
                  +{settings.pointsPerOrder || 20} Points On This Order
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white">
                Delivery Details & Contact
              </h3>
              <p className="text-xs text-neutral-400">
                Enter your WhatsApp number & delivery location. Your order details, total cash to pay, and GPS location link will be sent immediately to <strong className="text-emerald-400 font-mono">0712610337</strong>.
              </p>
            </div>

            {/* Direct WhatsApp Notice Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#0a2318] to-[#0e0f15] border border-emerald-500/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 fill-emerald-400" />
              </div>
              <div className="text-xs text-neutral-300 leading-snug">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span>Direct WhatsApp Dispatch</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 font-mono">
                    Target: 0712610337
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 mt-0.5">
                  Your WhatsApp phone, complete delivery location with Google Maps link, and total cash will be sent straight to <strong>0712610337</strong> for rapid rider departure.
                </p>
              </div>
            </div>

            {/* Customer Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Amani Wanjiku"
                    className="w-full pl-9 pr-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                {nameError && <p className="text-[11px] text-red-400 mt-1">{nameError}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                  <span>Customer WhatsApp Number *</span>
                  <span className="text-[10px] text-emerald-400 font-mono">To: 0712610337</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={safaricomPhone}
                    onChange={(e) => {
                      setSafaricomPhone(e.target.value);
                      if (phoneError) validatePhone(e.target.value);
                    }}
                    placeholder="e.g. 0712 345 678 or 07... / 01..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
                {phoneError ? (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-emerald-400/90 mt-1">
                    Your WhatsApp number will be received by <strong>0712610337</strong> for rider coordination
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Location Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Delivery Location (Estate & GPS Coordinates) *</span>
                </label>
                <span className="text-[11px] text-[#fae59e] font-mono bg-[#1e1c14] px-2 py-0.5 rounded border border-[#d4af37]/40">
                  📍 {estate}
                </span>
              </div>

              {/* Estate Selector Dropdown + Custom Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Nairobi Estate / Area *
                  </label>
                  <select
                    value={NAIROBI_ESTATES.some((e) => e.name === estate) ? estate : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'custom') {
                        const found = NAIROBI_ESTATES.find((item) => item.name === val);
                        if (found) {
                          setEstate(found.name);
                          setLat(found.lat);
                          setLng(found.lng);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  >
                    {NAIROBI_ESTATES.map((est) => (
                      <option key={est.name} value={est.name} className="bg-[#121319] text-white">
                        {est.name}
                      </option>
                    ))}
                    <option value="custom" className="bg-[#121319] text-[#fae59e]">
                      ✍️ Other / Custom Area (Type on right)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Estate / Neighborhood Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={estate}
                    onChange={(e) => setEstate(e.target.value)}
                    placeholder="e.g. Kilimani, Westlands, Kileleshwa, Karen..."
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Map Picker Component */}
              <DeliveryMap
                mode="picker"
                lat={lat}
                lng={lng}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Detailed Street & Apartment Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Street / Road / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Wood Avenue, near Yaya Centre"
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Apartment / House / Gate Notes
                </label>
                <input
                  type="text"
                  value={buildingOrHouse}
                  onChange={(e) => setBuildingOrHouse(e.target.value)}
                  placeholder="e.g. Wood Avenue Court, 3rd Floor, Apt 3B"
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Points Redemption Option (20 points = 20 Ksh. Redeemable anytime.) */}
            {customerPoints > 0 && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#171924] to-[#121319] border border-[#d4af37]/35 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-5 h-5 text-[#d4af37]" />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Redeem Pewa Gold Loyalty Points
                      </span>
                      <span className="text-[11px] text-[#fae59e]">
                        Rate: <strong>20 points = 20 Ksh</strong> · Redeemable anytime!
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.checked)}
                      className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37] bg-[#0c0d12] border-neutral-700 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#fae59e]">Redeem Now</span>
                  </label>
                </div>

                {redeemPoints && (
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-neutral-300">
                      Balance: <strong className="text-white font-mono">{customerPoints} pts</strong>
                      {maxRedeemablePoints < customerPoints && (
                        <span className="text-[10px] text-neutral-400 block">
                          (Order max: {maxRedeemablePoints} pts)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomPointsInput(Math.min(20, maxRedeemablePoints))}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                          pointsToRedeem === Math.min(20, maxRedeemablePoints)
                            ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold'
                            : 'bg-[#0f1118] text-neutral-300 border-neutral-700 hover:border-[#d4af37]'
                        }`}
                      >
                        20 pts (KES 20 off)
                      </button>
                      {maxRedeemablePoints > 20 && (
                        <button
                          type="button"
                          onClick={() => setCustomPointsInput(maxRedeemablePoints)}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                            pointsToRedeem === maxRedeemablePoints
                              ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold'
                              : 'bg-[#0f1118] text-neutral-300 border-neutral-700 hover:border-[#d4af37]'
                          }`}
                        >
                          All ({maxRedeemablePoints} pts)
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={maxRedeemablePoints}
                          value={customPointsInput}
                          onChange={(e) =>
                            setCustomPointsInput(
                              Math.min(maxRedeemablePoints, Math.max(0, Number(e.target.value)))
                            )
                          }
                          className="w-16 px-2 py-1 bg-[#0c0d12] border border-neutral-700 rounded text-right text-xs font-mono text-white focus:outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-[10px] text-neutral-400 font-mono">pts</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment & Schedule summary card */}
            <div className="p-4 rounded-xl bg-[#171922] border border-[#d4af37]/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Scheduled Delivery Window:</span>
                </span>
                <span className="text-[#fae59e] font-semibold">{deliverySchedule}</span>
              </div>

              {pointsDiscount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Redeemed Points Discount ({pointsToRedeem} pts):</span>
                  </span>
                  <span className="font-mono font-bold">-KES {pointsDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payment Method:</span>
                </span>
                <span className="text-emerald-400 font-semibold">
                  Pay Upon Delivery (Kopo Kopo Till {settings.kopoKopoTillNumber})
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400">Total Due Upon Delivery</span>
                  <p className="text-[10px] text-neutral-500">
                    Includes drinks & snacks + KES {deliveryFee} delivery · (+{settings.pointsPerOrder || 20} pts will be awarded)
                  </p>
                </div>
                <span className="text-xl font-bold font-mono text-[#fae59e]">
                  KES {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-[#d4af37] text-black font-serif font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5 fill-black text-black" />
              <span>
                {isSubmitting
                  ? 'Dispatching Order to WhatsApp...'
                  : `Confirm & Send to WhatsApp (0712610337) · KES ${total.toLocaleString()}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
