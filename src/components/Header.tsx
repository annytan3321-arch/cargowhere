import React from 'react';
import { RefreshCw, MapPin, Moon, Sun, Bookmark, HelpCircle, Calculator } from 'lucide-react';

interface HeaderProps {
  activeView: 'split' | 'map' | 'list';
  onViewChange: (view: 'split' | 'map' | 'list') => void;
  onOpenFavorites: () => void;
  onOpenCalculator: () => void;
  onOpenGuide: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: string;
  refreshCountdown: number;
  favoritesCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenFavorites,
  onOpenCalculator,
  onOpenGuide,
  onRefresh,
  isRefreshing,
  refreshCountdown,
  favoritesCount,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no subtitle tag) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            ParkSG Live
          </span>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean text with hover underline) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onViewChange('split')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white pb-1 ${
              activeView === 'split' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
            }`}
          >
            Overview & Map
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white pb-1 ${
              activeView === 'map' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
            }`}
          >
            Full Map
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white pb-1 ${
              activeView === 'list' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
            }`}
          >
            Carparks Directory
          </button>
          <button
            onClick={onOpenCalculator}
            className="whitespace-nowrap flex items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>Rate Calculator</span>
          </button>
          <button
            onClick={onOpenFavorites}
            className="whitespace-nowrap flex items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <Bookmark className="w-4 h-4 text-slate-500" />
            <span>Saved ({favoritesCount})</span>
          </button>
          <button
            onClick={onOpenGuide}
            className="whitespace-nowrap flex items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>SG Parking Guide</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Refresh trigger with auto-timer + Dark mode) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-all whitespace-nowrap disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : `Refresh (${refreshCountdown}s)`}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
