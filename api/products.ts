import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const products = await redis.get('pewa_products');
    return res.status(200).json(products || []);
  }

  if (req.method === 'POST') {
    if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    await redis.set('pewa_products', req.body);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}