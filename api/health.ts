import type { Request, Response } from 'express';

/**
 * Health check handler
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  const ltaAccountKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_ACCOUNT_KEY;
  const isKeyConfigured = Boolean(ltaAccountKey && ltaAccountKey.trim().length > 0 && !ltaAccountKey.includes('YOUR_'));

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'ParkSG LTA DataMall Connection',
    lta_account_key_configured: isKeyConfigured,
    target_endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
  });
}
