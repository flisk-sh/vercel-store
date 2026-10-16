import { randomUUID } from 'node:crypto';
import type { Product, Variant } from './catalog';

export interface CartLine { variantId: string; handle: string; title: string; variantTitle: string; image: string | null; quantity: number; unitPrice: number }
export interface Cart { id: string; currency: string; lines: CartLine[] }
export class CartError extends Error { constructor(public code: string, message: string) { super(message); } }

export function createCartStore(products: Product[], max = 1000) {
  const carts = new Map<string, Cart>();
  const index = new Map<string, { product: Product; variant: Variant }>();
  for (const product of products) for (const variant of product.variants) index.set(variant.id, { product, variant });
  const view = (c: Cart) => {
    const subtotal = c.lines.reduce((t, l) => t + l.unitPrice * l.quantity, 0);
    return { ...c, count: c.lines.reduce((t, l) => t + l.quantity, 0), subtotal, total: subtotal, checkoutUrl: checkoutUrl(c, index) };
  };
  return {
    create() {
      if (carts.size >= max) carts.delete(carts.keys().next().value!);
      const cart: Cart = { id: randomUUID(), currency: 'USD', lines: [] };
      carts.set(cart.id, cart);
      return view(cart);
    },
    get(id: string) { const c = carts.get(id); return c ? view(c) : null; },
    add(id: string, variantId: string, quantity: number) {
      const cart = carts.get(id);
      if (!cart) throw new CartError('CART_NOT_FOUND', 'This bag no longer exists.');
      const hit = index.get(variantId);
      if (!hit) throw new CartError('VARIANT_NOT_FOUND', 'That option does not exist.');
      if (!hit.variant.available) throw new CartError('VARIANT_UNAVAILABLE', 'That option is sold out.');
      const line = cart.lines.find(l => l.variantId === variantId);
      if (line) line.quantity += quantity;
      else cart.lines.push({ variantId, handle: hit.product.handle, title: hit.product.title, variantTitle: hit.variant.title, image: hit.variant.image, quantity, unitPrice: hit.variant.price });
      cart.currency = hit.variant.currency;
      return view(cart);
    },
    remove(id: string, variantId: string) {
      const cart = carts.get(id);
      if (!cart) throw new CartError('CART_NOT_FOUND', 'This bag no longer exists.');
      cart.lines = cart.lines.filter(l => l.variantId !== variantId);
      return view(cart);
    },
  };
}
// vercel.store has no public cart permalink API, so checkout hands the shopper to the live product page of the first line.
function checkoutUrl(c: Cart, index: Map<string, { product: Product }>) {
  const first = c.lines[0];
  return first ? index.get(first.variantId)?.product.url ?? null : null;
}
