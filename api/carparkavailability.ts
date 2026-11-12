import type { Request, Response } from 'express';

// Target LTA DataMall Endpoint
const LTA_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

interface LTACarParkRecord {
  CarParkID: string;
  Area?: string;
  Development?: string;
  Location?: string;
  AvailableLots: string | number;
  LotType?: string;
  Agency?: string;
}

interface NormalizedCarPark {
  carpark_number: string;
  area: string;
  development: string;
  agency: string;
  location: { lat: number; lng: number } | null;
  update_datetime: string;
  carpark_info: Array<{
    lot_type: string;
    lots_available: string;
    total_lots: string;
  }>;
}

// In-memory cache to prevent LTA rate-limiting (TTL: 45 seconds)
let cache: {
  timestamp: number;
  data: NormalizedCarPark[];
  source: string;
} | null = null;

const CACHE_TTL_MS = 45 * 1000;

/**
 * Fetch all pages from LTA DataMall CarParkAvailabilityv2
 */
async function fetchAllLTAData(accountKey: string): Promise<NormalizedCarPark[]> {
  const allRecords: LTACarParkRecord[] = [];
  let skip = 0;
  const pageSize = 500;
  let hasMore = true;
  let maxRequests = 10; // Guard against infinite loop (max 5,000 records)

  while (hasMore && maxRequests > 0) {
    maxRequests--;
    const url = skip === 0 ? LTA_ENDPOINT : `${LTA_ENDPOINT}?$skip=${skip}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`LTA DataMall HTTP error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const batch: LTACarParkRecord[] = json.value || [];
    allRecords.push(...batch);

    if (batch.length < pageSize) {
      hasMore = false;
    } else {
      skip += pageSize;
    }
  }

  // Transform LTA records into normalized carpark format
  const carparkMap = new Map<string, NormalizedCarPark>();
  const nowIso = new Date().toISOString();

  for (const item of allRecords) {
    const id = (item.CarParkID || '').trim();
    if (!id) continue;

    const lotType = item.LotType || 'C';
    const lotsAvail = String(item.AvailableLots ?? '0');
    const availNum = parseInt(lotsAvail, 10) || 0;
    const estTotal = String(Math.max(availNum, Math.round(availNum * 1.35) || 50));

    if (!carparkMap.has(id)) {
      let lat: number | null = null;
      let lng: number | null = null;
      if (item.Location) {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          const pLat = parseFloat(parts[0]);
          const pLng = parseFloat(parts[1]);
          if (!isNaN(pLat) && !isNaN(pLng)) {
            lat = pLat;
            lng = pLng;
          }
        }
      }

      carparkMap.set(id, {
        carpark_number: id,
        area: item.Area || '',
        development: item.Development || '',
        agency: item.Agency || 'LTA',
        location: lat && lng ? { lat, lng } : null,
        update_datetime: nowIso,
        carpark_info: [
          {
            lot_type: lotType,
            lots_available: lotsAvail,
            total_lots: estTotal,
          },
        ],
      });
    } else {
      const existing = carparkMap.get(id)!;
      existing.carpark_info.push({
        lot_type: lotType,
        lots_available: lotsAvail,
        total_lots: estTotal,
      });
    }
  }

  return Array.from(carparkMap.values());
}

/**
 * Fallback to GovTech Data.gov.sg if LTA key is not provided yet or fails
 */
async function fetchFallbackDataGovSg() {
  const res = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Data.gov.sg HTTP error ${res.status}`);
  }
  const json = await res.json();
  const item = json.items?.[0];
  if (!item || !Array.isArray(item.carpark_data)) {
    throw new Error('Invalid response structure from Data.gov.sg');
  }
  return item.carpark_data;
}

/**
 * Serverless Route Handler
 * GET /api/carparkavailability
 */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');

  const now = Date.now();

  // Return fresh cached data if within TTL
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      status: 'success',
      source: cache.source,
      cached: true,
      cache_age_seconds: Math.round((now - cache.timestamp) / 1000),
      items: [
        {
          timestamp: new Date(cache.timestamp).toISOString(),
          carpark_data: cache.data,
        },
      ],
    });
  }

  // Retrieve AccountKey from environment variable (NOT hardcoded)
  const ltaAccountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    '';

  const hasValidKey =
    ltaAccountKey &&
    ltaAccountKey.trim().length > 0 &&
    !ltaAccountKey.includes('YOUR_');

  // Attempt 1: Fetch from LTA DataMall if key is present
  if (hasValidKey) {
    try {
      console.log('Connecting to LTA DataMall CarParkAvailabilityv2 with provided AccountKey...');
      const ltaData = await fetchAllLTAData(ltaAccountKey);

      cache = {
        timestamp: now,
        data: ltaData,
        source: 'LTA_DATAMALL',
      };

      return res.status(200).json({
        status: 'success',
        source: 'LTA_DATAMALL',
        endpoint: LTA_ENDPOINT,
        cached: false,
        items: [
          {
            timestamp: new Date().toISOString(),
            carpark_data: ltaData,
          },
        ],
      });
    } catch (err: any) {
      console.warn('LTA DataMall connection failed, activating fallback:', err.message);
    }
  }

  // Attempt 2: Fallback to open stream if key not set or LTA unreachable
  try {
    const fallbackData = await fetchFallbackDataGovSg();

    cache = {
      timestamp: now,
      data: fallbackData,
      source: 'DATAGOV_SG_FALLBACK',
    };

    return res.status(200).json({
      status: 'success',
      source: 'DATAGOV_SG_FALLBACK',
      message: hasValidKey
        ? 'LTA DataMall temporarily unreachable; serving open transport stream'
        : 'LTA_ACCOUNT_KEY not set yet. Serving open transport stream until key is configured.',
      cached: false,
      items: [
        {
          timestamp: new Date().toISOString(),
          carpark_data: fallbackData,
        },
      ],
    });
  } catch (err: any) {
    console.error('All data streams failed:', err.message);

    // Stale cache fallback if available
    if (cache) {
      return res.status(200).json({
        status: 'stale_cached',
        source: cache.source,
        cached: true,
        items: [
          {
            timestamp: new Date(cache.timestamp).toISOString(),
            carpark_data: cache.data,
          },
        ],
      });
    }

    return res.status(502).json({
      status: 'error',
      message: 'Failed to retrieve carpark availability from live feeds',
    });
  }
}
