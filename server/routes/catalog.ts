import { Hono } from 'hono';
import type { FmcgProduct } from '../../shared/types.ts';
import { VectorSearchService } from '../services/vector-search.ts';

// Add AI and VECTORIZE to Bindings
export const catalogRouter = new Hono<{ 
  Bindings: { 
    AI: Ai,
    VECTORIZE: VectorizeIndex,
    FILESYSTEM_BUCKET: R2Bucket
  } 
}>();

catalogRouter.get('/', async (c) => {
  const lang = c.req.query('lang') || 'pt';
  const catalog = await c.env.FILESYSTEM_BUCKET.get(`asualoja-sanity-data-${lang}.json`).then(o => o?.json<FmcgProduct[]>());
  if (!catalog) return c.json([]);
  
  const category = c.req.query('category');
  if (category) {
    return c.json(catalog.filter(p => p.category === category));
  }
  return c.json(catalog);
});

catalogRouter.get('/search', async (c) => {
  const q = c.req.query('q') || '';
  const results = await VectorSearchService.searchByQuery(c.env, q, 10);
  return c.json({ count: results.length, results });
});

catalogRouter.post('/vector-search', async (c) => {
  const { query, locale, topK } = await c.req.json();
  
  if (!query) {
    return c.json({ error: 'Query é obrigatória' }, 400);
  }

  const results = await VectorSearchService.vectorSearch(c.env, query, locale, topK);
  return c.json({ count: results.length, results });
});

catalogRouter.get('/barcode/:ean', async (c) => {
  const ean = c.req.param('ean');
  const lang = c.req.query('lang') || 'pt';
  const catalog = await c.env.FILESYSTEM_BUCKET.get(`asualoja-sanity-data-${lang}.json`).then(o => o?.json<FmcgProduct[]>());
  const product = catalog?.find(p => p.ean === ean);
  if (!product) {
    return c.json({ error: 'Produto não encontrado para este código de barras' }, 404);
  }
  const equivalents = await VectorSearchService.findEquivalents(c.env, product.sku, 3);
  return c.json({ product, equivalents });
});

catalogRouter.get('/:sku', async (c) => {
  const sku = c.req.param('sku');
  const lang = c.req.query('lang') || 'pt';
  const bucket = c.env?.FILESYSTEM_BUCKET;
  if (!bucket) {
    console.error('R2 binding FILESYSTEM_BUCKET missing. Ensure you are running with wrangler dev.');
    return c.json({ error: 'Storage backend not configured' }, 500);
  }
  const catalog = await bucket.get(`asualoja-sanity-data-${lang}.json`).then(o => o?.json<FmcgProduct[]>());
  const product = catalog?.find(p => p.sku === sku);
  if (!product) {
    return c.json({ error: 'Produto não encontrado' }, 404);
  }
  const equivalents = await VectorSearchService.findEquivalents(c.env, sku, 3);
  return c.json({ product, equivalents });
});
