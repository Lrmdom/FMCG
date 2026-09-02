import { Hono } from 'hono';
import { FMCG_CATALOG } from '../../shared/catalog.ts';
import { VectorSearchService } from '../services/vector-search.ts';

export const catalogRouter = new Hono();

catalogRouter.get('/', (c) => {
  const category = c.req.query('category');
  if (category) {
    return c.json(FMCG_CATALOG.filter(p => p.category === category));
  }
  return c.json(FMCG_CATALOG);
});

catalogRouter.get('/search', (c) => {
  const q = c.req.query('q') || '';
  const results = VectorSearchService.searchByQuery(q, 10);
  return c.json({ count: results.length, results });
});

catalogRouter.get('/barcode/:ean', (c) => {
  const ean = c.req.param('ean');
  const product = FMCG_CATALOG.find(p => p.ean === ean);
  if (!product) {
    return c.json({ error: 'Produto não encontrado para este código de barras' }, 404);
  }
  const equivalents = VectorSearchService.findEquivalents(product.sku, 3);
  return c.json({ product, equivalents });
});

catalogRouter.get('/:sku', (c) => {
  const sku = c.req.param('sku');
  const product = FMCG_CATALOG.find(p => p.sku === sku);
  if (!product) {
    return c.json({ error: 'Produto não encontrado' }, 404);
  }
  const equivalents = VectorSearchService.findEquivalents(sku, 3);
  return c.json({ product, equivalents });
});
