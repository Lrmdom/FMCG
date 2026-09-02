import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { visionRouter } from './routes/vision.ts';
import { pantryRouter } from './routes/pantry.ts';
import { cartRouter } from './routes/cart.ts';
import { catalogRouter } from './routes/catalog.ts';
import { settingsRouter } from './routes/settings.ts';
import { analyticsRouter } from './routes/analytics.ts';
import { mcpRouter } from './routes/mcp-routes.ts';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-fmcg-client'],
}));

// API Routes
app.route('/api/vision', visionRouter);
app.route('/api/pantry', pantryRouter);
app.route('/api/cart', cartRouter);
app.route('/api/catalog', catalogRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api/mcp', mcpRouter);

// Healthcheck & Root Service Metadata
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'FMCG Photo Shopping & Predictive Pantry Service',
    version: '1.0.0',
    framework: 'Hono (hono.dev)',
    mcpSdk: '@modelcontextprotocol/sdk',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (c) => {
  return c.json({
    service: 'FMCG Photo Shopping & Predictive Pantry Service',
    docs: 'https://hono.dev',
    mcpEndpoint: '/api/mcp/tools',
    health: '/api/health',
  });
});

const PORT = 3001;

console.log(`
┌─────────────────────────────────────────────────────────────┐
│  🚀 FMCG Smart Service powered by Hono (https://hono.dev/)  │
│  🤖 MCP SDK: @modelcontextprotocol/sdk (Official Anthropic) │
│  📡 API Server listening on: http://localhost:${PORT}        │
│  ⚡ Endpoints:                                              │
│     - Vision Cascade:   /api/vision/analyze                 │
│     - Pantry Engine:    /api/pantry                         │
│     - Smart Cart:       /api/cart                           │
│     - FMCG Catalog:     /api/catalog                        │
│     - User Settings:    /api/settings                       │
│     - Unit Economics:   /api/analytics/economics            │
│     - MCP Inspector:    /api/mcp/tools                      │
└─────────────────────────────────────────────────────────────┘
`);

serve({
  fetch: app.fetch,
  port: PORT,
});
