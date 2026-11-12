import React, { useState } from 'react';
import { EnrichedCarpark, VehicleType } from '../types/carpark';
import { calculateParkingFee } from '../services/carparkService';
import {
  X,
  Bookmark,
  Navigation,
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Car,
  Bike,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: EnrichedCarpark | null;
  onClose: () => void;
  onToggleFavorite: (no: string) => void;
  vehicleType: VehicleType;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  onToggleFavorite,
  vehicleType,
}) => {
  if (!carpark) return null;

  // Fee calculator state
  const [durationMinutes, setDurationMinutes] = useState(120); // 2 hours default
  const [selectedDay, setSelectedDay] = useState<'weekday' | 'sat' | 'sun'>('weekday');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'day' | 'evening' | 'night'>('day');

  // Compute fee
  const mockDate = new Date();
  if (selectedDay === 'sun') {
    mockDate.setDate(mockDate.getDate() + ((7 - mockDate.getDay()) % 7));
  } else if (selectedDay === 'sat') {
    mockDate.setDate(mockDate.getDate() + ((6 - mockDate.getDay() + 7) % 7));
  }
  if (selectedTimeSlot === 'evening') {
    mockDate.setHours(19, 0, 0, 0);
  } else if (selectedTimeSlot === 'night') {
    mockDate.setHours(23, 0, 0, 0);
  } else {
    mockDate.setHours(14, 0, 0, 0);
  }

  const feeResult = calculateParkingFee(carpark, mockDate, durationMinutes);

  const typeLots = carpark.availability.lotsByType[vehicleType];
  const lotsAvailable = typeLots?.total > 0 ? typeLots.available : carpark.availability.lotsAvailable;
  const totalLots = typeLots?.total > 0 ? typeLots.total : carpark.availability.totalLots;
  const occupancyPercent = totalLots > 0 ? Math.min(100, Math.round(((totalLots - lotsAvailable) / totalLots) * 100)) : 0;

  // Occupancy color
  let statusBadgeColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
  let statusText = 'Plenty of Lots Available';
  if (lotsAvailable <= 0) {
    statusBadgeColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
    statusText = 'Carpark Full';
  } else if (lotsAvailable < 20) {
    statusBadgeColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
    statusText = 'Filling Fast';
  }

  // Simulated 24-hour occupancy trend curve (8am to 11pm)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const currentHour = new Date().getHours();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-mono text-slate-900 dark:text-slate-100 font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                {carpark.no}
              </span>
              <span aria-hidden="true">·</span>
              <span>{carpark.town}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.isCentral ? 'Central Area' : 'Outside Central'}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {carpark.address}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(carpark.no)}
              aria-label="Bookmark carpark"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                carpark.isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${carpark.isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Real-time Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${statusBadgeColor} mb-1`}>
                  {statusText}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                    {lotsAvailable}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    lots available (out of {totalLots})
                  </span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:pl-4 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Current Occupancy</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {occupancyPercent}%
                </div>
              </div>
            </div>

            {/* Vehicle Type Availability Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>Cars (C)</span>
                </div>
                <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-white text-sm">
                  {carpark.availability.lotsByType.C.available}{' '}
                  <span className="text-slate-400 font-normal text-xs">
                    / {carpark.availability.lotsByType.C.total || totalLots}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motorcycles (Y)</span>
                </div>
                <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-white text-sm">
                  {carpark.availability.lotsByType.Y.available}{' '}
                  <span className="text-slate-400 font-normal text-xs">
                    / {carpark.availability.lotsByType.Y.total || '—'}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Heavy (H)</span>
                </div>
                <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-white text-sm">
                  {carpark.availability.lotsByType.H.available}{' '}
                  <span className="text-slate-400 font-normal text-xs">
                    / {carpark.availability.lotsByType.H.total || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Occupancy Projection Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Typical Hourly Occupancy Trend
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Current Hour: {currentHour}:00
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="h-24 flex items-end gap-1.5 sm:gap-2 justify-between pt-2">
                {hours.map((h) => {
                  // Simulate lunch & dinner peaks
                  let factor = 0.45;
                  if (h >= 12 && h <= 14) factor = 0.88;
                  else if (h >= 18 && h <= 20) factor = 0.92;
                  else if (h >= 15 && h <= 17) factor = 0.65;
                  else if (h < 10) factor = 0.35;

                  const barPercent = Math.round(factor * 100);
                  const isCurrent = h === currentHour;

                  return (
                    <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20">
                        {h}:00 · ~{barPercent}%
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-16 rounded-xs flex items-end overflow-hidden">
                        <div
                          className={`w-full transition-all duration-300 ${
                            isCurrent
                              ? 'bg-emerald-600 dark:bg-emerald-500'
                              : 'bg-slate-400 dark:bg-slate-500 group-hover:bg-slate-600'
                          }`}
                          style={{ height: `${barPercent}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-mono ${
                          isCurrent
                            ? 'font-bold text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {h}h
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Parking Fee Calculator */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Estimated Parking Fee Calculator
            </h4>

            {/* Quick Controls */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Parking Duration:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={480}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>10m</span>
                  <span>2 hours</span>
                  <span>4 hours</span>
                  <span>8 hours</span>
                </div>
              </div>

              {/* Day & Time presets */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block mb-1">Day of Week:</span>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                    {(['weekday', 'sat', 'sun'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={`py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                          selectedDay === d
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block mb-1">Time Slot:</span>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                    {(['day', 'evening', 'night'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTimeSlot(t)}
                        className={`py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                          selectedTimeSlot === t
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated Total Fee Banner */}
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Estimated Charge
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400">
                    {feeResult.breakdown}
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200 tabular-nums">
                  S${feeResult.totalFee.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Carpark Specifications & Facilities */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Facility Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Gantry Clearance</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {carpark.height} meters
                  </span>
                  {carpark.height < 2.0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
                      ⚠️ Caution for high MPVs & roof racks
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">EV Fast Charging</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {carpark.ev ? 'Available (SP / CDG ENGIE 22kW AC & 50kW DC)' : 'No Dedicated EV Chargers'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Free Parking Scheme</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {carpark.freeParking && carpark.freeParking !== 'NO'
                      ? carpark.freeParking
                      : 'Standard charging all days'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Night Parking Cap</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {carpark.nightParking ? 'Supported (Max S$5.00 from 10:30pm - 7am)' : 'Hourly rate continues'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Navigation Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Coordinates: {carpark.lat}, {carpark.lng}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.lat},${carpark.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>

            <a
              href={`https://waze.com/ul?ll=${carpark.lat},${carpark.lng}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
            >
              <span>Waze</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href={`https://www.onemap.gov.sg/main/v2/?lat=${carpark.lat}&lng=${carpark.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
            >
              <span>OneMap SG</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
