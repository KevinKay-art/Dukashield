import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parsing for JSON and URL-encoded (Africa's Talking webhook callbacks use application/x-www-form-urlencoded)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API router
  app.use('/api', apiRouter);

  // Health check endpoint for Cloud Run
  app.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware handles HMR and bundling
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
    // Production mode: Serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[DukaShield] Server running in ${isProd ? 'production' : 'development'} on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[DukaShield] Failed to start server:', err);
  process.exit(1);
});
