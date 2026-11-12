import React from 'react';
import {
  FilterState,
  VehicleType,
  RegionFilter,
  SortOption,
  CarparkTypeFilter,
  UserCoordinates,
} from '../types/carpark';
import { POPULAR_LOCATIONS } from '../services/carparkService';
import { Search, X, SlidersHorizontal, MapPin, Zap, Shield, Car, Bike, Truck } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  userLocation: UserCoordinates | null;
  onSelectPresetLocation: (loc: { name: string; lat: number; lng: number } | null) => void;
  activePresetName?: string;
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  userLocation,
  onSelectPresetLocation,
  activePresetName,
  totalFilteredCount,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8 space-y-3 transition-colors">
      {/* Top Search & Primary Vehicle Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="Search carpark code (e.g. HE12), street, mall, town..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Vehicle Type Segmented Control */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => onFilterChange('vehicleType', 'C')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filters.vehicleType === 'C'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars</span>
          </button>
          <button
            onClick={() => onFilterChange('vehicleType', 'Y')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filters.vehicleType === 'Y'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles</span>
          </button>
          <button
            onClick={() => onFilterChange('vehicleType', 'H')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filters.vehicleType === 'H'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy</span>
          </button>
        </div>

        {/* Advanced Filters Toggle Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            showAdvanced
              ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-600'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Quick Filters Row (Availability & Region & Location Preset) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {/* Availability Segmented Tabs */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Availability:</span>
          {(['all', 'available', 'high'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onFilterChange('availability', status)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filters.availability === status
                  ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? 'All' : status === 'available' ? 'Available (>0)' : 'Plenty (>20)'}
            </button>
          ))}
        </div>

        {/* Region Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-medium mr-1 hidden md:inline">Region:</span>
          {(['all', 'Central', 'East', 'West', 'North', 'North-East'] as const).map((reg) => (
            <button
              key={reg}
              onClick={() => onFilterChange('region', reg)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filters.region === reg
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {reg === 'all' ? 'Whole SG' : reg}
            </button>
          ))}
        </div>

        {/* Sort Dropdown & Count */}
        <div className="flex items-center gap-2">
          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
            {totalFilteredCount} carparks
          </div>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value as SortOption)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="lots-desc">Lots: High to Low</option>
            <option value="lots-asc">Lots: Low to High</option>
            <option value="distance">Nearest Distance</option>
            <option value="price-asc">Cheapest Rate</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter Drawer / Section */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Carpark Type */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Structure Type
            </label>
            <select
              value={filters.carparkType}
              onChange={(e) => onFilterChange('carparkType', e.target.value as CarparkTypeFilter)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Types (HDB, Mall, URA)</option>
              <option value="MSCP">Multi-Storey (MSCP)</option>
              <option value="BASEMENT">Basement Carpark</option>
              <option value="SURFACE">Open Surface Carpark</option>
              <option value="MALL">Shopping Mall / Commercial</option>
            </select>
          </div>

          {/* Reference Location Origin */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Calculate Distance From
            </label>
            <select
              value={activePresetName || (userLocation ? 'GPS' : '')}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onSelectPresetLocation(null);
                } else if (val === 'GPS') {
                  // Keep user GPS
                } else {
                  const match = POPULAR_LOCATIONS.find((p) => p.name === val);
                  if (match) onSelectPresetLocation(match);
                }
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="">Whole Singapore Center</option>
              {userLocation && <option value="GPS">📍 My Current GPS Location</option>}
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} ({loc.region})
                </option>
              ))}
            </select>
          </div>

          {/* Height Clearance */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Min Clearance Height
            </label>
            <select
              value={filters.minClearance}
              onChange={(e) => onFilterChange('minClearance', parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value={0}>Any Height</option>
              <option value={1.9}>1.9m (Sedans & small SUVs)</option>
              <option value={2.0}>2.0m (Standard MPVs)</option>
              <option value={2.1}>2.1m (High MPVs & Vans)</option>
            </select>
          </div>

          {/* Amenities Checkboxes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Features & Schemes
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.hasEV}
                  onChange={(e) => onFilterChange('hasEV', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" /> EV Charger On-site
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.hasFreeParking}
                  onChange={(e) => onFilterChange('hasFreeParking', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>Sunday / PH Free Parking</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.hasNightCap}
                  onChange={(e) => onFilterChange('hasNightCap', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>HDB Night Cap (Max S$5.00)</span>
              </label>
            </div>
          </div>

          {/* Reset Filters CTA */}
          <div className="col-span-full pt-1 flex justify-end">
            <button
              onClick={onResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
            >
              Reset all filters to default
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
