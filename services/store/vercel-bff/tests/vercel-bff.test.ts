import { describe, expect, test } from 'bun:test';
import { createApp } from '../src/app';

const config = { frontendOrigin: 'http://app.test', bffOrigin: 'http://api.test', storeOrigin: 'https://vercel.store' };
const app = createApp(config);
const json = (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') =>
  app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });

describe('vercel-bff', () => {
  test('health', async () => expect(await (await json('/health')).json()).toEqual({ status: 'ok', service: 'vercel-bff' }));
  test('lists and searches the synced catalog', async () => {
    const all = (await (await json('/products')).json()).products;
    expect(all.length).toBeGreaterThan(5);
    const hits = (await (await json('/products?search=wavy')).json()).products;
    expect(hits.some((p: any) => p.handle === 'triangle-wavy-tee')).toBe(true);
  });
  test('product detail has Black/2XL variant', async () => {
    const { product } = await (await json('/products/triangle-wavy-tee')).json();
    expect(product.variants.find((v: any) => v.options.Color === 'Black' && v.options.Size === '2XL')).toBeTruthy();
    expect((await json('/products/nope')).status).toBe(404);
  });
  test('cart flow', async () => {
    const { cart } = await (await json('/cart', {})).json();
    const { product } = await (await json('/products/triangle-wavy-tee')).json();
    const variant = product.variants[0];
    const added = (await (await json(`/cart/${cart.id}/lines`, { variantId: variant.id, quantity: 2 })).json()).cart;
    expect(added.count).toBe(2);
    expect(added.total).toBe(variant.price * 2);
    expect(added.checkoutUrl).toContain('triangle-wavy-tee');
    expect((await json(`/cart/${cart.id}/lines`, { variantId: 'x', quantity: 1 })).status).toBe(409);
    expect((await json(`/cart/${cart.id}/lines`, { variantId: variant.id, quantity: 0 })).status).toBe(400);
    expect((await json(`/cart/${cart.id}/lines/${variant.id}`, undefined, 'DELETE')).status).toBe(200);
  });
  test('rejects foreign origins', async () => {
    const res = await app.request('/health', { headers: { Origin: 'http://evil.test' } });
    expect(res.status).toBe(403);
  });
});
