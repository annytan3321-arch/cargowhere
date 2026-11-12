import React from 'react';
import { EnrichedCarpark, VehicleType } from '../types/carpark';
import { Bookmark, Navigation, Zap, Shield, Moon, Clock, ArrowUpRight } from 'lucide-react';

interface CarparkCardProps {
  carpark: EnrichedCarpark;
  vehicleType: VehicleType;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  vehicleType,
  isSelected,
  onSelect,
  onToggleFavorite,
}) => {
  const typeLots = carpark.availability.lotsByType[vehicleType];
  const lotsAvailable = typeLots?.total > 0 ? typeLots.available : carpark.availability.lotsAvailable;
  const totalLots = typeLots?.total > 0 ? typeLots.total : carpark.availability.totalLots;
  const occupancyPercent = totalLots > 0 ? Math.min(100, Math.round(((totalLots - lotsAvailable) / totalLots) * 100)) : 0;

  // Status styling
  let statusColor = 'text-emerald-700 dark:text-emerald-400';
  let barColor = 'bg-emerald-600 dark:bg-emerald-500';
  let statusLabel = 'Available';

  if (lotsAvailable <= 0) {
    statusColor = 'text-rose-600 dark:text-rose-400';
    barColor = 'bg-rose-600 dark:bg-rose-500';
    statusLabel = 'Full';
  } else if (lotsAvailable < 20) {
    statusColor = 'text-amber-600 dark:text-amber-400';
    barColor = 'bg-amber-600 dark:bg-amber-500';
    statusLabel = 'Filling Fast';
  }

  // Google Maps navigation url
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.lat},${carpark.lng}`;

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-600/20 shadow-md'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{carpark.no}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.town}</span>
            {carpark.distanceKm !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {carpark.distanceKm} km
                </span>
              </>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {carpark.address}
          </h3>
        </div>

        {/* Favorite Star Button */}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={carpark.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          className={`p-1.5 rounded-lg transition-colors ${
            carpark.isFavorite
              ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${carpark.isFavorite ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      {/* Real-time Lots Availability Section */}
      <div className="my-3 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono tabular-nums ${statusColor}`}>
              {lotsAvailable}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              / {totalLots} lots
            </span>
          </div>
          <span className={`text-xs font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Occupancy Bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
          <span>{occupancyPercent}% occupied</span>
          <span>Rate: S${carpark.ratePerHalfHour.toFixed(2)}/30m</span>
        </div>
      </div>

      {/* Unboxed Metadata & Amenities */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <span>{carpark.type.replace(' CAR PARK', '')}</span>
        <span aria-hidden="true">·</span>
        <span>{carpark.height}m clearance</span>
        {carpark.ev && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <Zap className="w-3 h-3" /> EV Charging
            </span>
          </>
        )}
        {carpark.freeParking && carpark.freeParking !== 'NO' && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Free Sun/PH</span>
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <span>Calculate fee & details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          <Navigation className="w-3 h-3 text-blue-600" />
          <span>Directions</span>
        </a>
      </div>
    </div>
  );
};
