import carparkMetadataRaw from '../data/carparkMetadata.json';
import {
  CarparkMetadata,
  CarparkRawData,
  EnrichedCarpark,
  FilterState,
  UserCoordinates,
  VehicleType,
} from '../types/carpark';

const carparkMetadataMap = carparkMetadataRaw as unknown as Record<string, CarparkMetadata>;

const API_ENDPOINT = 'https://api.data.gov.sg/v1/transport/carpark-availability';
const FAVORITES_STORAGE_KEY = 'parksg_favorite_carparks_v1';

export const POPULAR_LOCATIONS: { name: string; region: string; lat: number; lng: number }[] = [
  { name: 'Orchard Road', region: 'Central', lat: 1.3048, lng: 103.8318 },
  { name: 'Marina Bay Sands', region: 'Central', lat: 1.2834, lng: 103.8607 },
  { name: 'Raffles Place (CBD)', region: 'Central', lat: 1.2840, lng: 103.8510 },
  { name: 'Bugis Junction', region: 'Central', lat: 1.3008, lng: 103.8554 },
  { name: 'Jurong East Central', region: 'West', lat: 1.3331, lng: 103.7436 },
  { name: 'Tampines Hub', region: 'East', lat: 1.3532, lng: 103.9404 },
  { name: 'Woodlands Central', region: 'North', lat: 1.4361, lng: 103.7865 },
  { name: 'Jewel Changi Airport', region: 'East', lat: 1.3602, lng: 103.9898 },
  { name: 'Toa Payoh Central', region: 'Central', lat: 1.3323, lng: 103.8475 },
  { name: 'Bishan Junction 8', region: 'Central', lat: 1.3506, lng: 103.8488 },
];

// Region lookup table for Singapore towns
export function getRegionForTown(town: string): 'Central' | 'East' | 'West' | 'North' | 'North-East' {
  const t = town.toLowerCase();
  if (t.includes('central') || t.includes('downtown') || t.includes('queenstown') || t.includes('bukit merah') || t.includes('bishan') || t.includes('toa payoh') || t.includes('kallang')) {
    return 'Central';
  }
  if (t.includes('tampines') || t.includes('bedok') || t.includes('pasir ris') || t.includes('changi') || t.includes('marine parade') || t.includes('geylang')) {
    return 'East';
  }
  if (t.includes('jurong') || t.includes('clementi') || t.includes('bukit batok') || t.includes('bukit timah') || t.includes('choa chu kang') || t.includes('tuas')) {
    return 'West';
  }
  if (t.includes('woodlands') || t.includes('yishun') || t.includes('sembawang') || t.includes('bukit panjang')) {
    return 'North';
  }
  if (t.includes('punggol') || t.includes('sengkang') || t.includes('hougang') || t.includes('serangoon') || t.includes('ang mo kio')) {
    return 'North-East';
  }
  return 'Central';
}

// Haversine formula to compute distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Get stored favorites
export function getFavoriteCarparkNos(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Toggle favorite carpark
export function toggleFavoriteCarpark(carparkNo: string): string[] {
  const current = getFavoriteCarparkNos();
  let updated: string[];
  if (current.includes(carparkNo)) {
    updated = current.filter((c) => c !== carparkNo);
  } else {
    updated = [...current, carparkNo];
  }
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save favorite:', e);
  }
  return updated;
}

// Fetch real-time data from GovTech Data.gov.sg
export async function fetchLiveCarparkAvailability(): Promise<{
  timestamp: string;
  data: Record<string, CarparkRawData>;
}> {
  try {
    const response = await fetch(API_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const json = await response.json();
    const item = json.items?.[0];
    if (!item || !Array.isArray(item.carpark_data)) {
      throw new Error('Invalid carpark availability API response');
    }

    const dataMap: Record<string, CarparkRawData> = {};
    for (const entry of item.carpark_data) {
      dataMap[entry.carpark_number] = entry;
    }

    return {
      timestamp: item.timestamp || new Date().toISOString(),
      data: dataMap,
    };
  } catch (error) {
    console.warn('Real-time API fetch failed or offline, using fallback estimates:', error);
    return {
      timestamp: new Date().toISOString(),
      data: {},
    };
  }
}

// Merge metadata and live availability
export function mergeCarparkData(
  liveDataMap: Record<string, CarparkRawData>,
  userLocation?: UserCoordinates | null
): EnrichedCarpark[] {
  const favorites = new Set(getFavoriteCarparkNos());
  const now = new Date();
  const currentHour = now.getHours();

  // Typical SG occupancy curve: high around lunch (12-14) and evening (18-21)
  const isPeakHour = (currentHour >= 12 && currentHour <= 14) || (currentHour >= 18 && currentHour <= 21);
  const baselineOccupancyFactor = isPeakHour ? 0.78 : 0.52;

  const result: EnrichedCarpark[] = [];

  for (const [no, meta] of Object.entries(carparkMetadataMap)) {
    const live = liveDataMap[no];

    let totalLots = meta.totalLots || (meta.decks > 1 ? meta.decks * 95 : 120);
    let lotsAvailable = 0;
    const lotsByType: Record<VehicleType, { available: number; total: number }> = {
      C: { available: 0, total: 0 },
      Y: { available: 0, total: 0 },
      H: { available: 0, total: 0 },
    };

    if (live && live.carpark_info && live.carpark_info.length > 0) {
      let sumTotal = 0;
      let sumAvail = 0;

      for (const info of live.carpark_info) {
        const type = (info.lot_type || 'C') as VehicleType;
        const avail = parseInt(info.lots_available || '0', 10);
        const tot = parseInt(info.total_lots || '0', 10);

        if (lotsByType[type]) {
          lotsByType[type].available += avail;
          lotsByType[type].total += tot;
        }

        sumAvail += avail;
        sumTotal += tot;
      }

      if (sumTotal > 0) {
        totalLots = sumTotal;
        lotsAvailable = sumAvail;
      } else {
        // Fallback if record had 0 total
        lotsAvailable = lotsByType.C.available;
      }
    } else {
      // Realistic simulation for shopping malls or unlisted carparks
      const pseudoRandomRatio = Math.sin(no.charCodeAt(0) * 11 + currentHour) * 0.15;
      const occupancy = Math.min(0.96, Math.max(0.15, baselineOccupancyFactor + pseudoRandomRatio));
      const occupied = Math.round(totalLots * occupancy);
      lotsAvailable = Math.max(0, totalLots - occupied);

      lotsByType.C = {
        total: Math.round(totalLots * 0.85),
        available: Math.round(lotsAvailable * 0.85),
      };
      lotsByType.Y = {
        total: Math.round(totalLots * 0.12),
        available: Math.round(lotsAvailable * 0.12),
      };
      lotsByType.H = {
        total: Math.round(totalLots * 0.03),
        available: Math.round(lotsAvailable * 0.03),
      };
    }

    const occupiedLots = Math.max(0, totalLots - lotsAvailable);
    const occupancyRate = totalLots > 0 ? Math.min(100, Math.round((occupiedLots / totalLots) * 100)) : 0;

    let distanceKm: number | undefined;
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, meta.lat, meta.lng);
    }

    result.push({
      ...meta,
      availability: {
        totalLots,
        lotsAvailable,
        occupiedLots,
        occupancyRate,
        updateTime: live?.update_datetime || new Date().toISOString(),
        lotsByType,
      },
      distanceKm,
      isFavorite: favorites.has(no),
    });
  }

  return result;
}

// Filter and sort carparks
export function filterAndSortCarparks(
  carparks: EnrichedCarpark[],
  filters: FilterState
): EnrichedCarpark[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return carparks
    .filter((c) => {
      // 1. Text Search (carpark code, address, town)
      if (query) {
        const matchNo = c.no.toLowerCase().includes(query);
        const matchAddress = c.address.toLowerCase().includes(query);
        const matchTown = c.town.toLowerCase().includes(query);
        if (!matchNo && !matchAddress && !matchTown) {
          return false;
        }
      }

      // 2. Vehicle Type Lot Availability
      const typeLots = c.availability.lotsByType[filters.vehicleType];
      const lotsAvailableForType = typeLots?.total > 0 ? typeLots.available : c.availability.lotsAvailable;

      // 3. Availability Filter
      if (filters.availability === 'available' && lotsAvailableForType <= 0) {
        return false;
      }
      if (filters.availability === 'high' && lotsAvailableForType < 20) {
        return false;
      }

      // 4. Carpark Type Filter
      if (filters.carparkType !== 'all') {
        const ct = c.type.toUpperCase();
        if (filters.carparkType === 'MSCP' && !ct.includes('MULTI-STOREY')) return false;
        if (filters.carparkType === 'SURFACE' && !ct.includes('SURFACE')) return false;
        if (filters.carparkType === 'BASEMENT' && !ct.includes('BASEMENT')) return false;
        if (filters.carparkType === 'MALL' && c.ratePerHalfHour <= 1.20) return false;
      }

      // 5. Region Filter
      if (filters.region !== 'all') {
        const reg = getRegionForTown(c.town);
        if (reg !== filters.region) return false;
      }

      // 6. Amenities
      if (filters.hasEV && !c.ev) return false;
      if (filters.isSheltered && c.type.toUpperCase().includes('SURFACE')) return false;
      if (filters.minClearance > 0 && c.height < filters.minClearance) return false;
      if (filters.hasFreeParking && (!c.freeParking || c.freeParking.toUpperCase() === 'NO')) return false;
      if (filters.hasNightCap && !c.nightParking) return false;

      return true;
    })
    .sort((a, b) => {
      const typeA = a.availability.lotsByType[filters.vehicleType];
      const lotsA = typeA?.total > 0 ? typeA.available : a.availability.lotsAvailable;

      const typeB = b.availability.lotsByType[filters.vehicleType];
      const lotsB = typeB?.total > 0 ? typeB.available : b.availability.lotsAvailable;

      switch (filters.sortBy) {
        case 'lots-desc':
          return lotsB - lotsA;
        case 'lots-asc':
          return lotsA - lotsB;
        case 'distance':
          if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
            return a.distanceKm - b.distanceKm;
          }
          return 0;
        case 'price-asc':
          return a.ratePerHalfHour - b.ratePerHalfHour;
        case 'name':
          return a.address.localeCompare(b.address);
        default:
          return lotsB - lotsA;
      }
    });
}

// Calculate parking fee according to Singapore HDB / Mall parking rules
export function calculateParkingFee(
  carpark: EnrichedCarpark,
  checkInDate: Date,
  durationMinutes: number
): {
  totalFee: number;
  gracePeriodApplied: boolean;
  isFreePeriod: boolean;
  breakdown: string;
} {
  // Grace period: standard 10 mins
  if (durationMinutes <= 10) {
    return {
      totalFee: 0,
      gracePeriodApplied: true,
      isFreePeriod: false,
      breakdown: 'Grace period (within 10 minutes) · S$0.00',
    };
  }

  // Sunday / PH free parking check (typically 7:00am - 10:30pm)
  const day = checkInDate.getDay(); // 0 is Sunday
  const hour = checkInDate.getHours();
  const isSundayFree =
    day === 0 &&
    carpark.freeParking &&
    carpark.freeParking.toUpperCase().includes('SUN') &&
    hour >= 7 &&
    hour < 22.5;

  if (isSundayFree) {
    return {
      totalFee: 0,
      gracePeriodApplied: false,
      isFreePeriod: true,
      breakdown: 'Sunday Free Parking Scheme (7:00am - 10:30pm) · S$0.00',
    };
  }

  // Half-hour blocks (rounded up to nearest 30 mins)
  const halfHourBlocks = Math.ceil(durationMinutes / 30);
  const rate = carpark.ratePerHalfHour;

  // Night parking cap: $5 cap between 10:30pm and 7:00am for HDB
  const isNight = hour >= 22.5 || hour < 7;
  let estimated = halfHourBlocks * rate;

  if (isNight && carpark.nightParking && carpark.ratePerHalfHour <= 1.20) {
    estimated = Math.min(estimated, 5.0);
    return {
      totalFee: Number(estimated.toFixed(2)),
      gracePeriodApplied: false,
      isFreePeriod: false,
      breakdown: `${halfHourBlocks} × 30-min blocks (Night parking max S$5.00 cap applied)`,
    };
  }

  return {
    totalFee: Number(estimated.toFixed(2)),
    gracePeriodApplied: false,
    isFreePeriod: false,
    breakdown: `${halfHourBlocks} × 30-min blocks @ S$${rate.toFixed(2)}/30 min`,
  };
}
