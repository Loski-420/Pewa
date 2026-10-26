import React from 'react';
import { Package, Clock, MapPin, Bike, Phone, MessageSquare, CheckCircle, ExternalLink, Award, Gift, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Order, Rider, StoreSettings } from '../types';
import { DeliveryMap } from './DeliveryMap';
import { ProductImage } from './ProductImage';
import { generateWhatsAppLink } from '../utils/whatsapp';

interface CustomerDashboardProps {
  orders: Order[];
  riders: Rider[];
  selectedOrderId?: string;
  onSelectOrder: (orderId: string) => void;
  onOpenKopoKopo: (order: Order) => void;
  settings: StoreSettings;
  customerPoints: number;
  onNavigateToStore?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  orders,
  riders,
  selectedOrderId,
  onSelectOrder,
  onOpenKopoKopo,
  settings,
  customerPoints,
  onNavigateToStore,
}) => {
  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  const assignedRider = riders.find((r) => r.id === activeOrder?.assignedRiderId) || riders[0];

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'confirmed':
        return 2;
      case 'rider_assigned':
        return 3;
      case 'out_for_delivery':
        return 4;
      case 'arrived':
        return 5;
      case 'delivered':
        return 6;
      default:
        return 1;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'confirmed':
        return 'Confirmed by Store';
      case 'rider_assigned':
        return 'Rider Assigned';
      case 'out_for_delivery':
        return 'En Route with Rider';
      case 'arrived':
        return 'Rider Arrived at Gate';
      case 'delivered':
        return 'Delivered & Completed';
      default:
        return status;
    }
  };

  // Calculate total points earned across all orders
  const totalLifetimePoints = orders.reduce((sum, o) => sum + (o.pointsEarned || 20), 0);
  const totalPointsRedeemed = orders.reduce((sum, o) => sum + (o.pointsRedeemed || 0), 0);
  const pointsWorthInKes = customerPoints * (settings.pointValueInKes || 1);

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500 mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-2">
          No Orders Placed Yet
        </h3>
        <p className="text-xs text-neutral-400 mb-6">
          When you place an order for spirits, cold beers, or munchies, you will earn <strong>20 redeemable points</strong> per order and track the live rider GPS progress right here.
        </p>
        {onNavigateToStore && (
          <button
            onClick={onNavigateToStore}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase cursor-pointer"
          >
            Browse Drinks & Munchies
          </button>
        )}
      </div>
    );
  }

  const currentStep = activeOrder ? getStatusStep(activeOrder.status) : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#fae59e] font-semibold">
            Customer Profile & Tracking Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Order Status, Live Rider & Redeemable Points
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Every order earns 20 Pewa Gold Points. Rate: <strong>20 points = 20 Ksh</strong>, redeemable anytime.
          </p>
        </div>

        {/* Customer Profile Points Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#1a1811] to-[#121319] border border-[#d4af37]/40 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#262112] border border-[#d4af37] flex items-center justify-center text-[#fae59e]">
            <Award className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-medium">
              Available Points Balance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-[#fae59e]">
                {customerPoints} Pts
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                (Worth KES {pointsWorthInKes.toLocaleString()} · 20 pts = 20 Ksh)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Points Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#14151e] via-[#161724] to-[#14151e] border border-[#d4af37]/35 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <h3 className="text-base font-serif font-bold text-white">
                Pewa Gold Rewards Member
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                20 Points = 20 Ksh · Redeemable Anytime
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
              You automatically earn <strong>20 reward points</strong> on every drink and munchies order. Redeem points anytime directly at checkout to enjoy discounts (<strong>20 points = 20 Ksh</strong>, 1 point = 1 Ksh).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="p-3 rounded-xl bg-[#0e1017] border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block uppercase">Redeemable</span>
              <span className="text-base font-mono font-bold text-[#fae59e]">
                {customerPoints} Pts
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0e1017] border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block uppercase">Lifetime Earned</span>
              <span className="text-base font-mono font-bold text-white">
                {totalLifetimePoints} Pts
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0e1017] border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block uppercase">Total Redeemed</span>
              <span className="text-base font-mono font-bold text-neutral-400">
                {totalPointsRedeemed} Pts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Previous Orders Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">
            Order History ({orders.length})
          </h3>

          <div className="space-y-2.5">
            {orders.map((ord) => {
              const isSelected = ord.id === activeOrder?.id;
              const isDelivered = ord.status === 'delivered';
              return (
                <button
                  key={ord.id}
                  onClick={() => onSelectOrder(ord.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#151722] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                      : 'bg-[#0f1016] border-neutral-800 hover:border-neutral-700 hover:bg-[#12131c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white">
                      {ord.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isDelivered
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-[#2b2210] text-[#f3e5ab] border border-[#d4af37]/40'
                      }`}
                    >
                      {getStatusLabel(ord.status)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 truncate">
                    {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/60 text-[11px]">
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#d4af37]" />
                      <span>+{ord.pointsEarned || 10} Pts Earned</span>
                    </span>
                    <span className="font-mono font-bold text-[#fae59e]">
                      KES {ord.total.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Tracking for Active Order */}
        {activeOrder && (
          <div className="lg:col-span-8 space-y-6">
            {/* Main Tracking Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#121319] border border-[#d4af37]/30 shadow-xl space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-serif font-bold text-white">
                      Order {activeOrder.orderNumber}
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] rounded bg-[#201d14] text-[#fae59e] border border-[#d4af37]/40 font-mono">
                      {activeOrder.deliverySchedule}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Customer: <strong className="text-white">{activeOrder.customerName}</strong> ({activeOrder.safaricomPhone}) ·{' '}
                    {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenKopoKopo(activeOrder)}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1b24] hover:bg-[#222432] border border-[#d4af37]/40 text-xs font-semibold text-[#f3e5ab] transition cursor-pointer"
                  >
                    Kopo Kopo Till Pay
                  </button>

                  <a
                    href={generateWhatsAppLink(activeOrder, settings)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Store WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Points banner for this order */}
              <div className="p-3 rounded-xl bg-[#1a1811] border border-[#d4af37]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-neutral-300">
                    Points Credited to Profile:
                  </span>
                  <span className="font-mono font-bold text-[#fae59e]">
                    +{activeOrder.pointsEarned || 10} Points
                  </span>
                </div>
                {activeOrder.pointsRedeemed && activeOrder.pointsRedeemed > 0 ? (
                  <span className="text-emerald-400 font-mono">
                    {activeOrder.pointsRedeemed} Pts Redeemed (-KES {activeOrder.discountAmount})
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400">
                    Redeemable on next order
                  </span>
                )}
              </div>

              {/* Delivery Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-neutral-400 font-medium">Delivery Progress</span>
                  <span className="text-[#fae59e] font-semibold">
                    {getStatusLabel(activeOrder.status)}
                  </span>
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-800 rounded-full" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#d4af37] to-[#e6c25a] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (currentStep / 5) * 100)}%` }}
                  />

                  {[
                    { label: 'Confirmed', step: 2 },
                    { label: 'Rider Assigned', step: 3 },
                    { label: 'En Route', step: 4 },
                    { label: 'Arrived', step: 5 },
                    { label: 'Delivered', step: 6 },
                  ].map((s) => {
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.step} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                            isDone
                              ? 'bg-[#d4af37] border-white text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                              : 'bg-[#151720] border-neutral-700 text-neutral-500'
                          } ${isCurrent ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-black' : ''}`}
                        >
                          {isDone ? '✓' : s.step - 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 whitespace-nowrap hidden sm:block ${
                            isDone ? 'text-white font-medium' : 'text-neutral-500'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Interactive Map with Rider Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Live Rider GPS Tracking on Map</span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Est. Arrival:{' '}
                    <strong className="text-[#fae59e] font-mono">
                      {activeOrder.riderEtaMinutes || 15} mins
                    </strong>
                  </span>
                </div>

                <DeliveryMap
                  mode="tracking"
                  lat={activeOrder.location.lat}
                  lng={activeOrder.location.lng}
                  riderLat={activeOrder.riderCurrentLocation?.lat}
                  riderLng={activeOrder.riderCurrentLocation?.lng}
                  riderName={assignedRider?.name}
                  riderPlate={assignedRider?.vehiclePlate}
                  etaMinutes={activeOrder.riderEtaMinutes || 15}
                  deliveryAddress={`${activeOrder.location.estate} · ${activeOrder.location.address}`}
                />
              </div>

              {/* Rider Contact Card */}
              {assignedRider && (
                <div className="p-4 rounded-xl bg-[#161822] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#201d14] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-sm">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          {assignedRider.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                          {assignedRider.vehiclePlate}
                        </span>
                        {assignedRider.zone && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            · {assignedRider.zone}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span>⭐ {assignedRider.rating} Rating</span>
                        <span>·</span>
                        <span>{assignedRider.completedDeliveries} Trips</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${assignedRider.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-[#0e0f14] border border-neutral-700 hover:border-[#d4af37] text-white text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Call Rider</span>
                    </a>
                    <a
                      href={`https://wa.me/254${assignedRider.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                        `Hi ${assignedRider.name}, I am tracking order ${activeOrder.orderNumber} to ${activeOrder.location.estate}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-900 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Rider</span>
                    </a>

                    <a
                      href={`https://wa.me/254712610337?text=${encodeURIComponent(
                        `Hello Pewa Store, I need assistance with Order ${activeOrder.orderNumber} to ${activeOrder.location.estate}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#14151e] border border-neutral-700 hover:border-emerald-500/50 text-neutral-300 hover:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Support (0712610337)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Order Items Breakdown */}
              <div className="pt-2 border-t border-neutral-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                  Items In This Delivery ({activeOrder.items.length})
                </h4>
                <div className="divide-y divide-neutral-800/80">
                  {activeOrder.items.map((it) => (
                    <div key={it.product.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0e0f14] overflow-hidden shrink-0 border border-neutral-800 flex items-center justify-center">
                          <ProductImage
                            src={it.product.imageUrl}
                            alt={it.product.name}
                            category={it.product.category}
                            name={it.product.name}
                            width={40}
                            height={40}
                            className="w-full h-full rounded-lg"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium">{it.product.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            Qty: {it.quantity} · {it.product.volume} · {it.product.category}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#fae59e]">
                        KES {(it.product.price * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Pay Upon Delivery via Kopo Kopo (Till: {settings.kopoKopoTillNumber})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block">Total Due</span>
                    <span className="text-base font-bold font-mono text-[#fae59e]">
                      KES {activeOrder.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
