import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, ExternalLink, Bike, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { NAIROBI_ESTATES } from '../data/initialData';

interface DeliveryMapProps {
  mode: 'picker' | 'tracking';
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number, estateName?: string) => void;
  riderLat?: number;
  riderLng?: number;
  riderName?: string;
  riderPlate?: string;
  etaMinutes?: number;
  deliveryAddress?: string;
  className?: string;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  mode,
  lat,
  lng,
  onLocationChange,
  riderLat,
  riderLng,
  riderName,
  riderPlate,
  etaMinutes = 15,
  deliveryAddress,
  className = '',
}) => {
  const [zoom, setZoom] = useState(1);
  const [currentRiderPos, setCurrentRiderPos] = useState({
    lat: riderLat || lat + 0.015,
    lng: riderLng || lng + 0.012,
  });

  // Center reference for Nairobi (Kilimani/CBD central area)
  // Latitude roughly -1.25 to -1.35 (North to South, height ~ 0.1 deg)
  // Longitude roughly 36.70 to 36.90 (West to East, width ~ 0.2 deg)
  const mapCenter = { lat: -1.2921, lng: 36.8219 };

  // Convert GPS (lat, lng) to SVG percentage coordinates (0 to 100%)
  const gpsToPercent = (gLat: number, gLng: number) => {
    const minLat = -1.365;
    const maxLat = -1.218;
    const minLng = 36.690;
    const maxLng = 36.930;

    const x = Math.min(Math.max(((gLng - minLng) / (maxLng - minLng)) * 100, 5), 95);
    // Invert Y because latitude increases Northward (upwards)
    const y = Math.min(Math.max(((maxLat - gLat) / (maxLat - minLat)) * 100, 5), 95);
    return { x, y };
  };

  const customerPercent = gpsToPercent(lat, lng);
  const riderPercent = gpsToPercent(currentRiderPos.lat, currentRiderPos.lng);

  // Simulate rider moving slightly towards destination if tracking
  useEffect(() => {
    if (mode !== 'tracking') return;

    const interval = setInterval(() => {
      setCurrentRiderPos((prev) => {
        const step = 0.08; // smooth step factor
        const dLat = (lat - prev.lat) * step;
        const dLng = (lng - prev.lng) * step;

        // If very close, stay near
        if (Math.abs(lat - prev.lat) < 0.0005 && Math.abs(lng - prev.lng) < 0.0005) {
          return prev;
        }

        return {
          lat: prev.lat + dLat,
          lng: prev.lng + dLng,
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [mode, lat, lng]);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'picker' || !onLocationChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    // Convert SVG % back to GPS
    const minLat = -1.365;
    const maxLat = -1.218;
    const minLng = 36.690;
    const maxLng = 36.930;

    const newLng = minLng + (clickXPercent / 100) * (maxLng - minLng);
    const newLat = maxLat - (clickYPercent / 100) * (maxLat - minLat);

    // Find closest estate
    let closestEstate = 'Custom Pinned Location';
    let minDistance = 999;
    NAIROBI_ESTATES.forEach((estate) => {
      const d = Math.hypot(estate.lat - newLat, estate.lng - newLng);
      if (d < minDistance) {
        minDistance = d;
        closestEstate = estate.name;
      }
    });

    onLocationChange(Number(newLat.toFixed(4)), Number(newLng.toFixed(4)), closestEstate);
  };

  const handleEstateSelect = (estate: typeof NAIROBI_ESTATES[0]) => {
    if (onLocationChange) {
      onLocationChange(estate.lat, estate.lng, estate.name);
    }
  };

  const googleMapsUrl =
    mode === 'tracking'
      ? `https://www.google.com/maps/dir/?api=1&origin=${currentRiderPos.lat},${currentRiderPos.lng}&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#d4af37]/30 bg-[#0c0d12] shadow-lg ${className}`}>
      {/* Top Map Header Strip */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121319]/90 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="font-medium text-neutral-200">
            {mode === 'tracking' ? 'Live Nairobi Rider GPS Track' : 'Pinpoint Delivery Location'}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-[#f3e5ab] hover:text-white transition font-medium underline-offset-2 hover:underline"
          title="Open in Google Maps"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-3 h-3 text-[#d4af37]" />
        </a>
      </div>

      {/* Main Interactive Vector Map Canvas */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden bg-[#0c0e14] select-none">
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full ${mode === 'picker' ? 'cursor-crosshair' : 'cursor-default'}`}
          preserveAspectRatio="none"
          onClick={handleMapClick}
        >
          {/* Subtle Grid Lines simulating Nairobi street grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.3" />
            </pattern>
            {/* Pulsing glow filters */}
            <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>

          {/* Dark city background and grid */}
          <rect width="100" height="100" fill="#090a0f" />
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Major Nairobi Arteries (Waiyaki Way, Mombasa Rd, Ngong Rd, Thika Superhighway simulation) */}
          {/* Waiyaki Way & Uhuru Highway */}
          <path d="M 10 25 Q 35 40 50 50 T 85 85" fill="none" stroke="#1f2430" strokeWidth="1.8" />
          <path d="M 10 25 Q 35 40 50 50 T 85 85" fill="none" stroke="#d4af37" strokeWidth="0.4" strokeOpacity="0.4" />

          {/* Ngong Road */}
          <path d="M 12 75 Q 35 60 50 50 T 70 30" fill="none" stroke="#1f2430" strokeWidth="1.6" />
          <path d="M 12 75 Q 35 60 50 50 T 70 30" fill="none" stroke="#38bdf8" strokeWidth="0.4" strokeOpacity="0.3" />

          {/* Thika Superhighway */}
          <path d="M 50 50 L 85 10" fill="none" stroke="#1f2430" strokeWidth="1.8" />
          <path d="M 50 50 L 85 10" fill="none" stroke="#d4af37" strokeWidth="0.4" strokeOpacity="0.3" />

          {/* Southern Bypass & Ring Roads */}
          <circle cx="50" cy="50" r="28" fill="none" stroke="#161922" strokeWidth="1.2" strokeDasharray="1 1.5" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#14161f" strokeWidth="0.8" />

          {/* Major Estate Landmarks (dots and subtle labels) */}
          {NAIROBI_ESTATES.map((estate, idx) => {
            const p = gpsToPercent(estate.lat, estate.lng);
            return (
              <g key={idx} opacity={0.65}>
                <circle cx={p.x} cy={p.y} r="0.9" fill="#4b5563" />
                <text
                  x={p.x + 1.2}
                  y={p.y + 0.6}
                  fontSize="2.4"
                  fill="#6b7280"
                  fontFamily="sans-serif"
                  fontWeight="500"
                >
                  {estate.name.split('/')[0]}
                </text>
              </g>
            );
          })}

          {/* Live Delivery Route Tracing in Tracking Mode */}
          {mode === 'tracking' && (
            <g>
              <line
                x1={riderPercent.x}
                y1={riderPercent.y}
                x2={customerPercent.x}
                y2={customerPercent.y}
                stroke="url(#routeGradient)"
                strokeWidth="1.2"
                strokeDasharray="2 1"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Customer Location Pin */}
          <g transform={`translate(${customerPercent.x}, ${customerPercent.y})`}>
            {/* Animated Pulse Ring */}
            <circle cx="0" cy="0" r="4" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.6">
              <animate attributeName="r" values="2;7;2" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
            </circle>

            {/* Marker Circle */}
            <circle cx="0" cy="0" r="2.2" fill="#d4af37" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="0" cy="0" r="0.9" fill="#000000" />

            {/* Label flag */}
            <rect x="2.5" y="-5" width="22" height="5" rx="1" fill="#121319" stroke="#d4af37" strokeWidth="0.4" opacity="0.9" />
            <text x="3.5" y="-1.8" fontSize="2.2" fill="#f3e5ab" fontWeight="bold">
              Delivery Drop
            </text>
          </g>

          {/* Rider Location Icon in Tracking Mode */}
          {mode === 'tracking' && (
            <g transform={`translate(${riderPercent.x}, ${riderPercent.y})`}>
              <circle cx="0" cy="0" r="3.5" fill="#0284c7" opacity="0.4">
                <animate attributeName="r" values="2;5;2" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="2.4" fill="#0ea5e9" stroke="#ffffff" strokeWidth="0.6" />
              {/* Bike symbol dot */}
              <circle cx="0" cy="0" r="0.9" fill="#ffffff" />

              {/* Rider Flag */}
              <rect x="-18" y="-7.5" width="20" height="5.5" rx="1" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.4" opacity="0.95" />
              <text x="-16.5" y="-3.8" fontSize="2.2" fill="#38bdf8" fontWeight="bold">
                🛵 Rider {riderPlate ? `(${riderPlate})` : ''}
              </text>
            </g>
          )}
        </svg>

        {/* Floating Tracking ETA Card */}
        {mode === 'tracking' && (
          <div className="absolute top-3 left-3 bg-[#11131a]/95 backdrop-blur-md border border-[#d4af37]/40 rounded-lg p-2.5 shadow-xl max-w-[210px] text-xs">
            <div className="flex items-center gap-1.5 text-[#d4af37] font-semibold mb-1">
              <Bike className="w-3.5 h-3.5" />
              <span>Rider En Route</span>
            </div>
            <div className="flex items-baseline gap-1 text-white">
              <span className="text-xl font-bold font-mono tabular-nums text-[#fae59e]">
                ~{etaMinutes}
              </span>
              <span className="text-[11px] text-neutral-400">minutes away</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 truncate">
              {riderName ? `Rider: ${riderName}` : 'Express Rider Assigned'}
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1 bg-[#121319]/90 border border-neutral-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="p-1 hover:text-[#d4af37] text-neutral-400 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.8))}
            className="p-1 hover:text-[#d4af37] text-neutral-400 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Picker Quick Estate Selector (Only in Picker Mode) */}
      {mode === 'picker' && (
        <div className="p-3 bg-[#0e1017] border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#d4af37]" />
              Click anywhere on map to drop pin, or select Nairobi area:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {NAIROBI_ESTATES.map((estate, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEstateSelect(estate)}
                className={`text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer border ${
                  Math.abs(lat - estate.lat) < 0.005 && Math.abs(lng - estate.lng) < 0.005
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fae59e] font-semibold'
                    : 'bg-[#151722] border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {estate.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Footer summary */}
      {mode === 'tracking' && deliveryAddress && (
        <div className="px-3 py-2 bg-[#0d0f15] border-t border-neutral-800 text-xs flex items-center justify-between text-neutral-400">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <span className="truncate text-neutral-300">{deliveryAddress}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Active GPS
          </span>
        </div>
      )}
    </div>
  );
};
