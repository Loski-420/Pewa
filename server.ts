import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data store path for permanent cross-session & cross-domain persistence
const DATA_DIR = path.resolve(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  
  // Parse port from CLI argument or env (AI Studio passes --port 3000 --host 0.0.0.0)
  let port = Number(process.env.PORT) || 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    port = Number(process.argv[portArgIndex + 1]);
  }

  // Permissive CORS and JSON body parser with 50MB limit for base64 photo uploads
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper to read JSON file safely
  const readJson = (filePath: string, fallback: any) => {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
    }
    return fallback;
  };

  // Helper to write JSON file safely
  const writeJson = (filePath: string, data: any) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
      return false;
    }
  };

  // -------------------------------------------------------------
  // API Routes: Products (Synchronizes with www.pewakitu.ai.studio)
  // -------------------------------------------------------------

  // GET /api/products
  app.get('/api/products', async (req, res) => {
    try {
      let products = readJson(PRODUCTS_FILE, null);
      if (!products || !Array.isArray(products) || products.length === 0) {
        // Fallback to initialData if store file not yet seeded
        const { INITIAL_PRODUCTS } = await import('./src/data/initialData.ts');
        products = INITIAL_PRODUCTS;
        writeJson(PRODUCTS_FILE, products);
      }
      res.json(products);
    } catch (err) {
      console.error('Failed to get products:', err);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  });

  // POST /api/products (Add or Bulk Save products)
  app.post('/api/products', (req, res) => {
    try {
      const incoming = req.body;
      if (Array.isArray(incoming)) {
        // Bulk overwrite / sync from admin publish
        writeJson(PRODUCTS_FILE, incoming);
        return res.json({ success: true, count: incoming.length });
      }

      // Single product addition
      const current = readJson(PRODUCTS_FILE, []);
      const updated = [incoming, ...current.filter((p: any) => p.id !== incoming.id)];
      writeJson(PRODUCTS_FILE, updated);
      return res.json({ success: true, product: incoming });
    } catch (err) {
      console.error('Failed to save product(s):', err);
      res.status(500).json({ error: 'Failed to save product' });
    }
  });

  // PUT /api/products/:id (Update product)
  app.put('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updatedItem = req.body;
      const current = readJson(PRODUCTS_FILE, []);
      const index = current.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        current[index] = { ...current[index], ...updatedItem, updatedAt: Date.now() };
      } else {
        current.unshift({ ...updatedItem, id, updatedAt: Date.now() });
      }
      writeJson(PRODUCTS_FILE, current);
      res.json({ success: true, product: current[index !== -1 ? index : 0] });
    } catch (err) {
      console.error('Failed to update product:', err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // DELETE /api/products/:id
  app.delete('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const current = readJson(PRODUCTS_FILE, []);
      const filtered = current.filter((p: any) => p.id !== id);
      writeJson(PRODUCTS_FILE, filtered);
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete product:', err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // -------------------------------------------------------------
  // API Routes: Settings & Orders
  // -------------------------------------------------------------
  app.get('/api/settings', (req, res) => {
    const settings = readJson(SETTINGS_FILE, null);
    res.json(settings);
  });

  app.post('/api/settings', (req, res) => {
    writeJson(SETTINGS_FILE, req.body);
    res.json({ success: true });
  });

  app.get('/api/orders', (req, res) => {
    const orders = readJson(ORDERS_FILE, []);
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const incoming = req.body;
    const orders = readJson(ORDERS_FILE, []);
    const updated = [incoming, ...orders.filter((o: any) => o.id !== incoming.id)];
    writeJson(ORDERS_FILE, updated);
    res.json({ success: true, order: incoming });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Explicit PWA Service Worker & Manifest routes
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
  });

  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
  });

  // -------------------------------------------------------------
  // Vite Integration (Dev) vs Static Files (Prod)
  // -------------------------------------------------------------
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd && fs.existsSync(path.resolve(__dirname, 'vite.config.ts'))) {
    // Mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production built assets
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Pewa Real-Time Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
