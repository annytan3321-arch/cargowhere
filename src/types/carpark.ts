export type VehicleType = 'C' | 'Y' | 'H'; // C: Car, Y: Motorcycle, H: Heavy Vehicle

export interface CarparkRawInfo {
  total_lots: string;
  lot_type: string;
  lots_available: string;
}

export interface CarparkRawData {
  carpark_info: CarparkRawInfo[];
  carpark_number: string;
  update_datetime: string;
}

export interface CarparkMetadata {
  no: string;
  address: string;
  town: string;
  lat: number;
  lng: number;
  type: string;
  sys: string;
  shortTerm: string;
  freeParking: string;
  nightParking: boolean;
  decks: number;
  height: number;
  isCentral: boolean;
  ratePerHalfHour: number;
  ev: boolean;
  totalLots?: number;
}

export interface CarparkAvailability {
  totalLots: number;
  lotsAvailable: number;
  occupiedLots: number;
  occupancyRate: number; // 0 - 100%
  updateTime: string;
  lotsByType: Record<VehicleType, { available: number; total: number }>;
}

export interface EnrichedCarpark extends CarparkMetadata {
  availability: CarparkAvailability;
  distanceKm?: number;
  isFavorite?: boolean;
}

export type AvailabilityStatus = 'all' | 'available' | 'high'; // available > 0, high > 20
export type CarparkTypeFilter = 'all' | 'MSCP' | 'SURFACE' | 'BASEMENT' | 'MALL';
export type RegionFilter = 'all' | 'Central' | 'East' | 'West' | 'North' | 'North-East';
export type SortOption = 'lots-desc' | 'lots-asc' | 'distance' | 'price-asc' | 'name';

export interface FilterState {
  searchQuery: string;
  vehicleType: VehicleType;
  availability: AvailabilityStatus;
  carparkType: CarparkTypeFilter;
  region: RegionFilter;
  hasEV: boolean;
  isSheltered: boolean;
  minClearance: number; // e.g. 0, 1.9, 2.0, 2.1
  hasFreeParking: boolean;
  hasNightCap: boolean;
  sortBy: SortOption;
}

export interface UserCoordinates {
  lat: number;
  lng: number;
  name?: string;
}
