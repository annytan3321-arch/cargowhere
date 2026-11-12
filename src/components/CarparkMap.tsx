import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { EnrichedCarpark, UserCoordinates, VehicleType } from '../types/carpark';
import { POPULAR_LOCATIONS } from '../services/carparkService';
import { Navigation, Compass, Zap } from 'lucide-react';

interface CarparkMapProps {
  carparks: EnrichedCarpark[];
  selectedCarpark: EnrichedCarpark | null;
  onSelectCarpark: (carpark: EnrichedCarpark) => void;
  userLocation: UserCoordinates | null;
  onLocateUser: () => void;
  isLocating: boolean;
  vehicleType: VehicleType;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
  onLocateUser,
  isLocating,
  vehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default Singapore center
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: true,
    });

    // CartoDB Positron tiles for high-contrast, clean aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> · Singapore Data.gov.sg',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; background-color: #3b82f6; opacity: 0.25; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 14px; height: 14px; margin: 5px; background-color: #2563eb; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update Carpark Markers (limit to top 300 in current view/filter for instant rendering)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const displayCarparks = carparks.slice(0, 250);

    displayCarparks.forEach((c) => {
      const typeLots = c.availability.lotsByType[vehicleType];
      const lotsAvailable = typeLots?.total > 0 ? typeLots.available : c.availability.lotsAvailable;

      // Color based on lots count
      let bgClass = '#16a34a'; // Green
      let textClass = '#ffffff';
      if (lotsAvailable <= 0) {
        bgClass = '#dc2626'; // Red
      } else if (lotsAvailable < 20) {
        bgClass = '#d97706'; // Amber
      }

      const isSelected = selectedCarpark?.no === c.no;
      const borderStyle = isSelected ? 'border: 3px solid #0f172a; transform: scale(1.18);' : 'border: 2px solid #ffffff;';

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: `
          <div style="
            background: ${bgClass};
            color: ${textClass};
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 6px;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
            display: inline-flex;
            align-items: center;
            gap: 2px;
            white-space: nowrap;
            ${borderStyle}
            transition: all 0.15s ease-in-out;
          ">
            <span>${lotsAvailable}</span>
          </div>
        `,
        iconSize: [42, 24],
        iconAnchor: [21, 12],
      });

      const marker = L.marker([c.lat, c.lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 max-w-[280px] text-slate-900';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">
          ${c.no} · ${c.town}
        </div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.3;">
          ${c.address}
        </div>
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
          <div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Available Lots</div>
            <div style="font-size: 18px; font-weight: 800; font-family: monospace; color: ${bgClass};">
              ${lotsAvailable} <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">/ ${c.availability.totalLots}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Rate</div>
            <div style="font-size: 14px; font-weight: 700; font-family: monospace;">
              S$${c.ratePerHalfHour.toFixed(2)} <span style="font-size: 10px; color: #94a3b8;">/ 30m</span>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="popup-inspect-${c.no}" style="
            flex: 1;
            padding: 6px 10px;
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 600;
            border-radius: 6px;
            border: none;
            cursor: pointer;
          ">
            View Details
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" rel="noopener noreferrer" style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 10px;
            background: #f1f5f9;
            color: #1e293b;
            font-size: 11px;
            font-weight: 600;
            border-radius: 6px;
            text-decoration: none;
          ">
            Directions
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-inspect-${c.no}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCarpark(c);
          };
        }
      });

      marker.on('click', () => {
        onSelectCarpark(c);
      });

      markersLayer.addLayer(marker);
    });
  }, [carparks, selectedCarpark, vehicleType, onSelectCarpark]);

  // Center on selected carpark
  useEffect(() => {
    if (!selectedCarpark || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedCarpark.lat, selectedCarpark.lng], 16, {
      duration: 0.8,
    });
  }, [selectedCarpark]);

  // Quick jump helper
  const handleQuickJump = (loc: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 0.8 });
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Singapore Quick-Jump Hubs */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[calc(100%-80px)] pointer-events-auto">
        <span className="hidden sm:inline-flex items-center px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[11px] font-semibold text-slate-500 dark:text-slate-400 rounded-md shadow-xs">
          Jump to:
        </span>
        {POPULAR_LOCATIONS.slice(0, 5).map((loc) => (
          <button
            key={loc.name}
            onClick={() => handleQuickJump(loc)}
            className="px-2.5 py-1 text-xs font-medium bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-md shadow-xs border border-slate-200/60 dark:border-slate-700/60 transition-colors whitespace-nowrap cursor-pointer"
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Floating Map Controls (Locate Me + Legend) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={onLocateUser}
          disabled={isLocating}
          title="Locate my position in Singapore"
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>

        {/* Legend */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-[11px] flex flex-col gap-1 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
            <span className="font-mono tabular-nums">&gt;20 lots</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600"></span>
            <span className="font-mono tabular-nums">1–20 lots</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span>
            <span className="font-mono tabular-nums">0 lots (Full)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
