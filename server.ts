import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory cache for live carpark data (TTL: 45 seconds)
interface CachedData {
  timestamp: number;
  source: 'LTA_DATAMALL' | 'DATAGOV_SG';
  payload: any;
}

let cachedCarparkData: CachedData | null = null;
const CACHE_TTL_MS = 45 * 1000;

/**
 * Fetch all pages from LTA DataMall CarParkAvailabilityv2
 * Endpoint: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 */
async function fetchLTADataMall(accountKey: string) {
  const baseUrl = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
  const allValues: any[] = [];
  let skip = 0;
  const pageSize = 500;
  let keepFetching = true;
  let maxBatches = 8; // Safety limit (max 4,000 records)

  while (keepFetching && maxBatches > 0) {
    maxBatches--;
    const targetUrl = skip === 0 ? baseUrl : `${baseUrl}?$skip=${skip}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`LTA DataMall HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const batch = data.value || [];
    allValues.push(...batch);

    if (batch.length < pageSize) {
      keepFetching = false;
    } else {
      skip += pageSize;
    }
  }

  // Transform LTA format into normalized format compatible with the app
  const carparkMap = new Map<string, any>();
  const nowIso = new Date().toISOString();

  for (const item of allValues) {
    const id = (item.CarParkID || '').trim();
    if (!id) continue;

    const lotType = item.LotType || 'C';
    const lotsAvail = String(item.AvailableLots ?? '0');
    // Estimate total lots if not explicitly provided
    const availNum = parseInt(lotsAvail, 10) || 0;
    const estTotal = String(Math.max(availNum, Math.round(availNum * 1.35) || 50));

    if (!carparkMap.has(id)) {
      let lat: number | null = null;
      let lng: number | null = null;
      if (item.Location) {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
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
      const existing = carparkMap.get(id);
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
 * Fetch from GovTech Data.gov.sg as fallback or standard open data
 */
async function fetchDataGovSg() {
  const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Data.gov.sg HTTP error ${response.status}`);
  }

  const json = await response.json();
  const item = json.items?.[0];
  if (!item || !Array.isArray(item.carpark_data)) {
    throw new Error('Invalid carpark data structure from Data.gov.sg');
  }

  return {
    timestamp: item.timestamp,
    carpark_data: item.carpark_data,
  };
}

/**
 * GET /api/carpark-availability
 * Serverless / Express proxy endpoint that fetches from LTA DataMall
 * (with automatic fallback to GovTech Data.gov.sg if LTA key is unset or error occurs)
 */
app.get('/api/carpark-availability', async (_req, res) => {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedCarparkData && now - cachedCarparkData.timestamp < CACHE_TTL_MS) {
    return res.json({
      status: 'success',
      source: cachedCarparkData.source,
      cached: true,
      cache_age_seconds: Math.round((now - cachedCarparkData.timestamp) / 1000),
      items: [
        {
          timestamp: new Date(cachedCarparkData.timestamp).toISOString(),
          carpark_data: cachedCarparkData.payload,
        },
      ],
    });
  }

  const ltaKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.DATAMALL_API_KEY;

  // Attempt 1: LTA DataMall (if account key is provided)
  if (ltaKey && ltaKey !== 'YOUR_LTA_DATAMALL_ACCOUNT_KEY') {
    try {
      console.log('Fetching live carpark availability from LTA DataMall...');
      const ltaCarparks = await fetchLTADataMall(ltaKey);

      cachedCarparkData = {
        timestamp: now,
        source: 'LTA_DATAMALL',
        payload: ltaCarparks,
      };

      return res.json({
        status: 'success',
        source: 'LTA_DATAMALL',
        cached: false,
        items: [
          {
            timestamp: new Date().toISOString(),
            carpark_data: ltaCarparks,
          },
        ],
      });
    } catch (err: any) {
      console.warn('LTA DataMall fetch failed, falling back to Data.gov.sg:', err.message);
    }
  }

  // Attempt 2: GovTech Data.gov.sg open stream
  try {
    const dataGov = await fetchDataGovSg();

    cachedCarparkData = {
      timestamp: now,
      source: 'DATAGOV_SG',
      payload: dataGov.carpark_data,
    };

    return res.json({
      status: 'success',
      source: 'DATAGOV_SG',
      cached: false,
      items: [
        {
          timestamp: dataGov.timestamp || new Date().toISOString(),
          carpark_data: dataGov.carpark_data,
        },
      ],
    });
  } catch (err: any) {
    console.error('All live carpark availability sources failed:', err.message);

    // Return cached data even if expired rather than failing completely
    if (cachedCarparkData) {
      return res.json({
        status: 'stale_fallback',
        source: cachedCarparkData.source,
        cached: true,
        items: [
          {
            timestamp: new Date(cachedCarparkData.timestamp).toISOString(),
            carpark_data: cachedCarparkData.payload,
          },
        ],
      });
    }

    return res.status(502).json({
      status: 'error',
      message: 'Failed to fetch live carpark availability from LTA DataMall & Data.gov.sg',
    });
  }
});

/**
 * GET /api/lta/status
 * Check configuration & connection health
 */
app.get('/api/lta/status', (_req, res) => {
  const ltaKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.DATAMALL_API_KEY;

  const isConfigured = Boolean(ltaKey && ltaKey !== 'YOUR_LTA_DATAMALL_ACCOUNT_KEY');

  res.json({
    status: 'online',
    endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    lta_account_key_configured: isConfigured,
    current_active_source: cachedCarparkData?.source || (isConfigured ? 'LTA_DATAMALL' : 'DATAGOV_SG'),
    cache_entries: cachedCarparkData?.payload?.length || 0,
    last_sync: cachedCarparkData ? new Date(cachedCarparkData.timestamp).toISOString() : null,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ParkSG server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
