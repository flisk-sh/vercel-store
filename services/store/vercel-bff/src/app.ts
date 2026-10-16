import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { catalog, search, summary, type Product } from './catalog';
import { CartError, createCartStore } from './cart';

export interface Config { frontendOrigin: string; bffOrigin: string; storeOrigin: string }
const error = (code: string, message: string) => ({ error: { code, message } });
const line = z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(100) }).strict();

export function createApp(config: Config, products: Product[] = catalog.products) {
  const app = new Hono();
  const carts = createCartStore(products);
  app.use('*', bodyLimit({ maxSize: 4096, onError: c => c.json(error('REQUEST_TOO_LARGE', 'Request body is too large.'), 413) }));
  app.use('*', cors({ origin: config.frontendOrigin, credentials: true, allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type'] }));
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    const origin = c.req.header('Origin');
    if (origin && origin !== config.frontendOrigin && origin !== config.bffOrigin) return c.json(error('ORIGIN_NOT_ALLOWED', 'This origin is not allowed.'), 403);
    await next();
  });
  app.onError((e, c) => e instanceof CartError ? c.json(error(e.code, e.message), e.code === 'CART_NOT_FOUND' ? 404 : 409) : c.json(error('REQUEST_FAILED', 'The request could not be completed.'), 500));
  app.get('/health', c => c.json({ status: 'ok', service: 'vercel-bff' }));
  app.get('/context', c => c.json({ store: config.storeOrigin, currency: 'USD', syncedAt: catalog.syncedAt, products: products.length }));
  app.get('/products', c => c.json({ products: search(products, c.req.query('search')?.slice(0, 200)).map(summary) }));
  app.get('/products/:handle', c => {
    const product = products.find(p => p.handle === c.req.param('handle'));
    return product ? c.json({ product }) : c.json(error('PRODUCT_NOT_FOUND', 'This product is no longer available.'), 404);
  });
  app.post('/cart', c => c.json({ cart: carts.create() }, 201));
  app.get('/cart/:id', c => { const cart = carts.get(c.req.param('id')); return cart ? c.json({ cart }) : c.json(error('CART_NOT_FOUND', 'This bag no longer exists.'), 404); });
  app.post('/cart/:id/lines', async c => {
    const body = line.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(error('VARIABLES_INVALID', 'Choose a valid option and quantity.'), 400);
    return c.json({ cart: carts.add(c.req.param('id'), body.data.variantId, body.data.quantity) });
  });
  app.delete('/cart/:id/lines/:variantId', c => c.json({ cart: carts.remove(c.req.param('id'), c.req.param('variantId')) }));
  return app;
}
