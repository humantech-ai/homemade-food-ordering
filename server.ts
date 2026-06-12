import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for API bodies
  app.use(express.json());

  // API endpoints proxy mockup or placeholders if user expands in the future
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', datetime: new Date().toISOString() });
  });

  // Handle Vite Asset Pipelines routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite HMR middleware hot-swapped.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Prod] Serving pre-compiled bundle from: ' + distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Homemade food platform running on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
