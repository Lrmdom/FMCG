import { Hono } from 'hono';
import { PantryEngine } from '../services/pantry-engine.ts';
import { CartEngine } from '../services/cart-engine.ts';
import type { StorageLocation } from '../../shared/types.ts';

export const pantryRouter = new Hono();

pantryRouter.get('/', (c) => {
  const location = c.req.query('location') as StorageLocation | undefined;
  const inventory = PantryEngine.getInventory(location);
  const restockCandidates = PantryEngine.getRestockCandidates(3);
  return c.json({
    totalCount: inventory.length,
    urgentRestockCount: restockCandidates.length,
    items: inventory,
    restockCandidates,
  });
});

pantryRouter.post('/item', async (c) => {
  try {
    const body = await c.req.json();
    const item = PantryEngine.addItemFromSku(body.sku, body.location, body.quantity);
    return c.json({ success: true, item });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

pantryRouter.patch('/item/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = PantryEngine.updateQuantity(id, body.quantity);
  if (!updated) {
    return c.json({ error: 'Item não encontrado' }, 404);
  }
  return c.json({ success: true, item: updated });
});

pantryRouter.delete('/item/:id', (c) => {
  const id = c.req.param('id');
  const ok = PantryEngine.deleteItem(id);
  return c.json({ success: ok });
});

pantryRouter.post('/restock-to-cart', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const threshold = body.daysThreshold || 3;
  const supermarket = body.supermarket || 'Continente';
  const candidates = PantryEngine.getRestockCandidates(threshold);

  for (const cand of candidates) {
    CartEngine.addItem({
      sku: cand.item.sku,
      quantity: cand.recommendedQuantity,
      addedBy: 'predictive_restock',
      supermarket,
    });
  }

  return c.json({
    success: true,
    restockedCount: candidates.length,
    cart: CartEngine.getCart(),
  });
});
