import React from 'react';
import { EnrichedCarpark, VehicleType } from '../types/carpark';
import { X, Bookmark, Navigation, Trash2, ArrowRight } from 'lucide-react';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: EnrichedCarpark[];
  onSelectCarpark: (c: EnrichedCarpark) => void;
  onRemoveFavorite: (no: string) => void;
  vehicleType: VehicleType;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectCarpark,
  onRemoveFavorite,
  vehicleType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Saved Carparks ({favorites.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favorites.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bookmark className="w-10 h-10 stroke-[1.5] mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No saved carparks yet
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Tap the bookmark icon on any carpark card to monitor your home, office, or favorite shopping lots in real time.
              </p>
            </div>
          ) : (
            favorites.map((c) => {
              const typeLots = c.availability.lotsByType[vehicleType];
              const lotsAvailable = typeLots?.total > 0 ? typeLots.available : c.availability.lotsAvailable;

              let statusColor = 'text-emerald-700 dark:text-emerald-400';
              if (lotsAvailable <= 0) statusColor = 'text-rose-600 dark:text-rose-400';
              else if (lotsAvailable < 20) statusColor = 'text-amber-600 dark:text-amber-400';

              return (
                <div
                  key={c.no}
                  onClick={() => {
                    onSelectCarpark(c);
                    onClose();
                  }}
                  className="group p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-bold">
                        <span>{c.no}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans font-normal text-slate-600 dark:text-slate-400">
                          {c.town}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600">
                        {c.address}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(c.no);
                      }}
                      title="Remove bookmark"
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className={`text-lg font-bold font-mono tabular-nums ${statusColor}`}>
                        {lotsAvailable}
                      </span>
                      <span className="text-xs text-slate-500 font-normal ml-1">
                        / {c.availability.totalLots} lots
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        S${c.ratePerHalfHour.toFixed(2)}/30m
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
          Saved locally on this device · Auto-refreshes every 60s
        </div>
      </div>
    </div>
  );
};
