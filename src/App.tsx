import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { ParkingFeeCalculatorModal } from './components/ParkingFeeCalculatorModal';
import { SgParkingGuideModal } from './components/SgParkingGuideModal';
import {
  EnrichedCarpark,
  FilterState,
  UserCoordinates,
  VehicleType,
} from './types/carpark';
import {
  fetchLiveCarparkAvailability,
  mergeCarparkData,
  filterAndSortCarparks,
  toggleFavoriteCarpark,
  getFavoriteCarparkNos,
} from './services/carparkService';
import {
  Car,
  Bike,
  Truck,
  Zap,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('parksg_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('parksg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('parksg_theme', 'light');
    }
  }, [isDarkMode]);

  // Views: 'split', 'map', 'list'
  const [activeView, setActiveView] = useState<'split' | 'map' | 'list'>('split');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    vehicleType: 'C',
    availability: 'all',
    carparkType: 'all',
    region: 'all',
    hasEV: false,
    isSheltered: false,
    minClearance: 0,
    hasFreeParking: false,
    hasNightCap: false,
    sortBy: 'lots-desc',
  });

  // User location / preset origin
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [activePresetName, setActivePresetName] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Carpark data
  const [liveDataMap, setLiveDataMap] = useState<Record<string, any>>({});
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);
  const [favoriteNos, setFavoriteNos] = useState<string[]>(getFavoriteCarparkNos());

  // Modals & Drawers
  const [selectedCarpark, setSelectedCarpark] = useState<EnrichedCarpark | null>(null);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Pagination for high-performance rendering
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Fetch live carpark availability
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchLiveCarparkAvailability();
      setLiveDataMap(res.data);
      setLastUpdatedTime(new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshCountdown(60);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 60-second auto-refresh countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          refreshData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshData]);

  // Handle GPS location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My GPS Location',
        });
        setActivePresetName('GPS');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed or denied, using central Singapore default:', err);
        // Default to Orchard/Central if denied
        setUserLocation({
          lat: 1.3048,
          lng: 103.8318,
          name: 'Central Singapore',
        });
        setActivePresetName('Orchard Road');
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Merge metadata with live availability
  const allEnrichedCarparks = useMemo(() => {
    return mergeCarparkData(liveDataMap, userLocation);
  }, [liveDataMap, userLocation, favoriteNos]);

  // Filter and sort carparks
  const filteredCarparks = useMemo(() => {
    return filterAndSortCarparks(allEnrichedCarparks, filters);
  }, [allEnrichedCarparks, filters]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(24);
  }, [filters]);

  // Visible carparks slice
  const visibleCarparks = useMemo(() => {
    return filteredCarparks.slice(0, visibleCount);
  }, [filteredCarparks, visibleCount]);

  // Filter handler
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      vehicleType: 'C',
      availability: 'all',
      carparkType: 'all',
      region: 'all',
      hasEV: false,
      isSheltered: false,
      minClearance: 0,
      hasFreeParking: false,
      hasNightCap: false,
      sortBy: 'lots-desc',
    });
  };

  // Toggle Favorite
  const handleToggleFavorite = (no: string) => {
    const updated = toggleFavoriteCarpark(no);
    setFavoriteNos(updated);
  };

  // Favorites list
  const favoriteCarparks = useMemo(() => {
    return allEnrichedCarparks.filter((c) => favoriteNos.includes(c.no));
  }, [allEnrichedCarparks, favoriteNos]);

  // Aggregated summary metrics for Singapore
  const summaryStats = useMemo(() => {
    let totalLots = 0;
    let availableLots = 0;
    let evCount = 0;

    for (const c of allEnrichedCarparks) {
      totalLots += c.availability.totalLots;
      availableLots += c.availability.lotsAvailable;
      if (c.ev) evCount++;
    }

    const occupancyRate = totalLots > 0 ? Math.round(((totalLots - availableLots) / totalLots) * 100) : 0;

    return {
      totalCarparks: allEnrichedCarparks.length,
      totalLots,
      availableLots,
      occupancyRate,
      evCount,
    };
  }, [allEnrichedCarparks]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header following Top Bar Contract */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
        lastUpdatedTime={lastUpdatedTime}
        refreshCountdown={refreshCountdown}
        favoritesCount={favoriteNos.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Filter & Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        userLocation={userLocation}
        onSelectPresetLocation={(loc) => {
          if (!loc) {
            setUserLocation(null);
            setActivePresetName('');
          } else {
            setUserLocation(loc);
            setActivePresetName(loc.name);
          }
        }}
        activePresetName={activePresetName}
        totalFilteredCount={filteredCarparks.length}
      />

      {/* Singapore Islandwide Real-Time Telemetry Bar */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400">
            <span>
              Tracking <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{summaryStats.totalCarparks.toLocaleString()}</strong> carparks across Singapore
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{summaryStats.availableLots.toLocaleString()}</strong> lots currently available
            </span>
            <span aria-hidden="true">·</span>
            <span>
              SG Island Occupancy: <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{summaryStats.occupancyRate}%</strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{summaryStats.evCount}</strong> EV charging stations
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>GovTech API · Updated {lastUpdatedTime || 'just now'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* VIEW 1: SPLIT (Map on top or side + List) */}
        {activeView === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Left/Top Map Viewport (5 cols on desktop) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 h-[380px] lg:h-[calc(100vh-160px)] rounded-xl overflow-hidden shadow-sm">
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={setSelectedCarpark}
                userLocation={userLocation}
                onLocateUser={handleLocateUser}
                isLocating={isLocating}
                vehicleType={filters.vehicleType}
              />
            </div>

            {/* Right/Bottom Carpark Cards (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Available Carparks ({filteredCarparks.length})
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing top {Math.min(visibleCount, filteredCarparks.length)}
                </div>
              </div>

              {filteredCarparks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-10 text-center border border-slate-200 dark:border-slate-800">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No matching carparks found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Try clearing search keywords or loosening filters (clearance height, EV charger requirement, or availability status).
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {visibleCarparks.map((carpark) => (
                    <CarparkCard
                      key={carpark.no}
                      carpark={carpark}
                      vehicleType={filters.vehicleType}
                      isSelected={selectedCarpark?.no === carpark.no}
                      onSelect={() => setSelectedCarpark(carpark)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(carpark.no);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Load more button */}
              {visibleCount < filteredCarparks.length && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="px-5 py-2.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Load More ({filteredCarparks.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: FULL MAP VIEW */}
        {activeView === 'map' && (
          <div className="flex-1 w-full h-[calc(100vh-200px)] min-h-[500px]">
            <CarparkMap
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={setSelectedCarpark}
              userLocation={userLocation}
              onLocateUser={handleLocateUser}
              isLocating={isLocating}
              vehicleType={filters.vehicleType}
            />
          </div>
        )}

        {/* VIEW 3: FULL LIST / DIRECTORY VIEW */}
        {activeView === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Singapore Carparks Directory
                </h2>
                <p className="text-xs text-slate-500">
                  {filteredCarparks.length} carparks matching current search & filter criteria
                </p>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Showing {Math.min(visibleCount, filteredCarparks.length)} of {filteredCarparks.length}
              </div>
            </div>

            {filteredCarparks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No carparks match your filter
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Try adjusting the vehicle type, clearance limit, or search keyword.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleCarparks.map((carpark) => (
                  <CarparkCard
                    key={carpark.no}
                    carpark={carpark}
                    vehicleType={filters.vehicleType}
                    isSelected={selectedCarpark?.no === carpark.no}
                    onSelect={() => setSelectedCarpark(carpark)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(carpark.no);
                    }}
                  />
                ))}
              </div>
            )}

            {visibleCount < filteredCarparks.length && (
              <div className="pt-6 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 36)}
                  className="px-6 py-2.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Load More Carparks ({filteredCarparks.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">ParkSG Live</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Singapore Carpark Lots Availability</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Powered by GovTech Singapore & LTA DataMall</span>
            <span aria-hidden="true">·</span>
            <span>HDB / URA Electronic Parking System</span>
          </div>
        </div>
      </footer>

      {/* Carpark Detail Drawer / Modal */}
      <CarparkDetailModal
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        onToggleFavorite={handleToggleFavorite}
        vehicleType={filters.vehicleType}
      />

      {/* Saved Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favoriteCarparks}
        onSelectCarpark={setSelectedCarpark}
        onRemoveFavorite={handleToggleFavorite}
        vehicleType={filters.vehicleType}
      />

      {/* Standalone Fee Calculator Modal */}
      <ParkingFeeCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Singapore Parking Rules Guide Modal */}
      <SgParkingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
