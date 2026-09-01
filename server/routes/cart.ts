import { Hono } from 'hono';
import { CartEngine } from '../services/cart-engine.ts';

export const cartRouter = new Hono();

cartRouter.get('/', (c) => {
  return c.json(CartEngine.getCart());
});

cartRouter.post('/items', async (c) => {
  try {
    const body = await c.req.json();
    const res = await CartEngine.addItem({
      cartId: body.cartId,
      sku: body.sku,
      quantity: body.quantity,
      addedBy: body.addedBy || 'manual',
      supermarket: body.supermarket,
    });
    return c.json(res);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

cartRouter.patch('/items/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const cart = CartEngine.updateQuantity(id, body.quantity);
  return c.json({ success: true, cart });
});

cartRouter.delete('/items/:id', (c) => {
  const id = c.req.param('id');
  const cart = CartEngine.removeItem(id);
  return c.json({ success: true, cart });
});

cartRouter.delete('/', (c) => {
  const cart = CartEngine.clearCart();
  return c.json({ success: true, cart });
});
