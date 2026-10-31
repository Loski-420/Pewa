import { Redis } from '@upstash/redis';
import { verifyToken } from './_auth';
import fs from 'fs';
import path from 'path';

// Safely initialize Redis if URL and token are present
let redis: Redis | null = null;
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (e) {
    console.warn('Failed to initialize Upstash Redis:', e);
  }
}

const PRODUCTS_FILE = path.resolve(process.cwd(), 'data', 'products.json');

const readLocalProducts = () => {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const content = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return [];
};

const writeLocalProducts = (products: any[]) => {
  try {
    const dir = path.dirname(PRODUCTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (_) {}
};

export default async function handler(req: any, res: any) {
  // Prevent any browser or CDN caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'GET') {
    // 1. Try Redis first if available
    if (redis) {
      try {
        const remoteProducts = await redis.get('pewa_products');
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          return res.status(200).json(remoteProducts);
        }
      } catch (err) {
        console.warn('Error reading from Redis:', err);
      }
    }

    // 2. Fall back to local products file
    const local = readLocalProducts();
    return res.status(200).json(local);
  }

  if (req.method === 'POST') {
    const token = req.headers['x-admin-token'];
    if (!verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized: admin authentication required' });
    }

    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload: expected product array' });
    }

    // Save to Redis if configured
    if (redis) {
      try {
        await redis.set('pewa_products', req.body);
      } catch (err) {
        console.warn('Error writing to Redis:', err);
      }
    }

    // Always attempt to write to local filesystem store as well
    writeLocalProducts(req.body);

    return res.status(200).json({ ok: true, count: req.body.length });
  }

  res.status(405).end();
}