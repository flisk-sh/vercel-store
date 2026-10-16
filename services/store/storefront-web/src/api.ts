export interface Variant { id: string; title: string; available: boolean; price: number; currency: string; options: Record<string, string>; image: string | null }
export interface Product { handle: string; url: string; title: string; description: string; options: { name: string; values: string[] }[]; variants: Variant[] }
export interface Summary { handle: string; title: string; image: string | null; price: { min: number; max: number; currency: string }; available: boolean }
export interface CartLine { variantId: string; handle: string; title: string; variantTitle: string; image: string | null; quantity: number; unitPrice: number }
export interface Cart { id: string; currency: string; lines: CartLine[]; count: number; subtotal: number; total: number; checkoutUrl: string | null }

const browserOrigin = typeof window === 'undefined' ? 'http://api.vercel-store.localhost:8080' : window.location.origin.replace('://app.', '://api.');
export const base = (import.meta.env.VITE_STORE_BFF_URL || `${browserOrigin}/api/vercel-bff`).replace(/\/$/, '');

export async function request<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST', signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new Error('The store connection is unavailable. Please try again shortly.');
  }
  let payload: any;
  try { payload = await response.json(); } catch { throw new Error('The store did not return a usable response. Check that the store service is running.'); }
  if (!response.ok || payload.error) throw new Error(payload.error?.message || 'The store could not complete this request.');
  return payload as T;
}
export const formatMoney = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
export const safeLink = (value: string | null) => { try { const u = new URL(value ?? ''); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
export function findVariant(product: Product, selected: Record<string, string>) {
  return product.variants.find(v => Object.entries(selected).every(([k, val]) => v.options[k] === val));
}
