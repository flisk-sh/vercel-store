import { afterEach, describe, expect, it, vi } from 'vitest';
import { findVariant, formatMoney, request, safeLink, type Product } from '../src/api';

const product = { handle: 't', url: 'https://x', title: 'T', description: '', options: [], variants: [
  { id: '1', title: 'Black / XS', available: true, price: 40, currency: 'USD', options: { Color: 'Black', Size: 'XS' }, image: null },
  { id: '2', title: 'Black / 2XL', available: false, price: 40, currency: 'USD', options: { Color: 'Black', Size: '2XL' }, image: null },
] } as Product;

describe('storefront-web api helpers', () => {
  it('finds a variant from selected options', () => expect(findVariant(product, { Color: 'Black', Size: '2XL' })?.id).toBe('2'));
  it('formats USD', () => expect(formatMoney(40)).toBe('$40.00'));
  it('only allows https checkout links', () => { expect(safeLink('https://vercel.store/products/a')).toContain('vercel.store'); expect(safeLink('javascript:alert(1)')).toBeNull(); expect(safeLink(null)).toBeNull(); });
});

describe('storefront response handling', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [200, null],
    [502, null],
    [200, []],
    [200, 'unavailable'],
  ] as const)('shows a usable error for HTTP %i with a JSON body of %j', async (status, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body, { status })));
    await expect(request('/products')).rejects.toThrow('The store did not return a usable response. Check that the store service is running.');
  });

  it('still uses the API error message for a structured error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { message: 'Product not found.' } }, { status: 404 })));
    await expect(request('/products/missing')).rejects.toThrow('Product not found.');
  });
});
