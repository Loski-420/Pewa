import React, { useState } from 'react';
import { Bike, Navigation, MapPin, Phone, MessageSquare, CheckCircle, Clock, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { Order, Rider, OrderStatus, StoreSettings } from '../types';
import { DeliveryMap } from './DeliveryMap';

interface RiderPortalProps {
  riders: Rider[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, paymentStatus?: Order['paymentStatus']) => void;
  settings: StoreSettings;
}

export const RiderPortal: React.FC<RiderPortalProps> = ({
  riders,
  orders,
  onUpdateOrderStatus,
  settings,
}) => {
  const [selectedRiderId, setSelectedRiderId] = useState<string>(riders[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const currentRider = riders.find((r) => r.id === selectedRiderId) || riders[0];

  // Orders assigned to this rider
  const riderOrders = orders.filter((o) => o.assignedRiderId === currentRider?.id);
  const activeOrders = riderOrders.filter((o) => o.status !== 'delivered');
  const deliveredOrders = riderOrders.filter((o) => o.status === 'delivered');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header & Rider Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#fae59e] font-semibold">
              Rider Operations Hub
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800/40">
              Pewa Express Delivery
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Assigned Order Locations & Status Dispatch
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            View assigned delivery drops, navigate via Google Maps, and update order milestones.
          </p>
        </div>

        {/* Rider Profile Switcher */}
        <div className="flex items-center gap-3 bg-[#13141b] border border-[#d4af37]/30 p-2 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-[#221e14] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-400">
              Active Rider Account
            </label>
            <select
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#121319] text-white">
                  {r.name} ({r.vehiclePlate}) - {r.isAvailable ? 'Available' : 'On Delivery'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentRider && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#121319] border border-neutral-800">
            <span className="text-xs text-neutral-400">Rider Contact</span>
            <p className="text-sm font-semibold font-mono text-white mt-0.5">
              {currentRider.phone}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#121319] border border-neutral-800">
            <span className="text-xs text-neutral-400">Motorbike Plate</span>
            <p className="text-sm font-semibold font-mono text-[#fae59e] mt-0.5">
              {currentRider.vehiclePlate}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#121319] border border-neutral-800">
            <span className="text-xs text-neutral-400">Completed Deliveries</span>
            <p className="text-sm font-semibold font-mono text-emerald-400 mt-0.5">
              {currentRider.completedDeliveries} Trips · ⭐ {currentRider.rating}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'active'
              ? 'border-[#d4af37] text-[#fae59e]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Active Deliveries ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'history'
              ? 'border-[#d4af37] text-[#fae59e]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Delivered History ({deliveredOrders.length})
        </button>
      </div>

      {/* Active Orders List */}
      {activeTab === 'active' ? (
        activeOrders.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500 mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">No Pending Deliveries</h4>
            <p className="text-xs text-neutral-400 mt-1">
              You are all caught up! New orders assigned by store admin will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeOrders.map((order) => {
              const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.location.lat},${order.location.lng}&travelmode=driving`;

              return (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#121319] border border-[#d4af37]/35 shadow-xl space-y-5"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-serif font-bold text-white">
                          Order {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#201d14] text-[#fae59e] border border-[#d4af37]/40">
                          {order.deliverySchedule}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={googleMapsNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-400" />
                        <span>Google Maps Turn-by-Turn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Customer Information & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#171922] border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          Customer: {order.customerName}
                        </span>
                        <span className="text-xs font-mono text-[#fae59e]">
                          {order.safaricomPhone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <a
                          href={`tel:${order.safaricomPhone}`}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#0e0f14] border border-neutral-700 hover:border-[#d4af37] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Call Customer</span>
                        </a>

                        <a
                          href={`https://wa.me/254${order.safaricomPhone.replace(/^0/, '')}?text=${encodeURIComponent(
                            `Hello ${order.customerName}, this is your Pewa delivery rider (${currentRider?.name}). I am on my way with your drinks!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-900 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <div className="pt-2 text-xs text-neutral-300">
                        <p className="text-neutral-400 text-[11px]">Exact Dropoff Location:</p>
                        <p className="font-semibold text-white mt-0.5">
                          {order.location.estate} · {order.location.address}
                        </p>
                        {order.location.buildingOrHouse && (
                          <p className="text-neutral-400 text-[11px] mt-0.5">
                            Apt/Gate: {order.location.buildingOrHouse}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-[11px] text-[#fae59e] mt-1 bg-[#1a1811] p-1.5 rounded border border-[#d4af37]/20">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Financial & Items */}
                    <div className="p-4 rounded-xl bg-[#171922] border border-neutral-800 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-semibold text-neutral-300 block mb-2">
                          Drinks In Order:
                        </span>
                        <ul className="text-xs text-neutral-300 space-y-1">
                          {order.items.map((it) => (
                            <li key={it.product.id} className="flex justify-between">
                              <span>
                                {it.quantity}x {it.product.name}
                              </span>
                              <span className="font-mono text-neutral-400">
                                KES {(it.product.price * it.quantity).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-neutral-400 block">Collect via Kopo Kopo</span>
                          <span className="text-xs font-semibold text-emerald-400">
                            Till: {settings.kopoKopoTillNumber}
                          </span>
                        </div>
                        <span className="text-lg font-bold font-mono text-[#fae59e]">
                          KES {order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Map of Delivery Location */}
                  <div>
                    <span className="text-xs font-semibold text-white block mb-1.5">
                      Drop Location Map & Route:
                    </span>
                    <DeliveryMap
                      mode="tracking"
                      lat={order.location.lat}
                      lng={order.location.lng}
                      riderLat={order.riderCurrentLocation?.lat}
                      riderLng={order.riderCurrentLocation?.lng}
                      riderName={currentRider?.name}
                      riderPlate={currentRider?.vehiclePlate}
                      etaMinutes={order.riderEtaMinutes || 15}
                      deliveryAddress={`${order.location.estate} · ${order.location.address}`}
                    />
                  </div>

                  {/* Status Milestone Update Action Buttons */}
                  <div className="pt-3 border-t border-neutral-800">
                    <span className="text-xs font-semibold text-neutral-400 block mb-2.5">
                      Update Real-Time Delivery Status:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'rider_assigned')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          order.status === 'rider_assigned'
                            ? 'bg-[#d4af37] text-black border-white font-bold'
                            : 'bg-[#151722] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        1. Picked Up
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          order.status === 'out_for_delivery'
                            ? 'bg-[#d4af37] text-black border-white font-bold'
                            : 'bg-[#151722] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        2. En Route
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'arrived')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          order.status === 'arrived'
                            ? 'bg-[#d4af37] text-black border-white font-bold'
                            : 'bg-[#151722] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        3. Arrived at Gate
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'delivered', 'paid_via_kopokopo')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          order.status === 'delivered'
                            ? 'bg-emerald-600 text-white border-white font-bold'
                            : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900'
                        }`}
                      >
                        4. Paid & Delivered
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Delivered History */
        <div className="space-y-3">
          {deliveredOrders.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No completed deliveries in your history yet.
            </div>
          ) : (
            deliveredOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl bg-[#121319] border border-neutral-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      Delivered & Paid via Kopo Kopo
                    </span>
                  </div>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    {ord.customerName} · {ord.location.estate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#fae59e]">
                    KES {ord.total.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
