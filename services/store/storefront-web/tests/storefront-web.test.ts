import { describe, expect, it } from 'vitest';
import { findVariant, formatMoney, safeLink, type Product } from '../src/api';

const product = { handle: 't', url: 'https://x', title: 'T', description: '', options: [], variants: [
  { id: '1', title: 'Black / XS', available: true, price: 40, currency: 'USD', options: { Color: 'Black', Size: 'XS' }, image: null },
  { id: '2', title: 'Black / 2XL', available: false, price: 40, currency: 'USD', options: { Color: 'Black', Size: '2XL' }, image: null },
] } as Product;

describe('storefront-web api helpers', () => {
  it('finds a variant from selected options', () => expect(findVariant(product, { Color: 'Black', Size: '2XL' })?.id).toBe('2'));
  it('formats USD', () => expect(formatMoney(40)).toBe('$40.00'));
  it('only allows https checkout links', () => { expect(safeLink('https://vercel.store/products/a')).toContain('vercel.store'); expect(safeLink('javascript:alert(1)')).toBeNull(); expect(safeLink(null)).toBeNull(); });
});
