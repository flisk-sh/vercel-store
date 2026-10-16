import raw from './data/catalog.json';

export interface Variant { id: string; title: string; available: boolean; price: number; currency: string; options: Record<string, string>; image: string | null }
export interface Product { handle: string; url: string; title: string; description: string; options: { name: string; values: string[] }[]; variants: Variant[] }
export const catalog = raw as { origin: string; syncedAt: string; products: Product[] };

export const priceRange = (p: Product) => {
  const prices = p.variants.map(v => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices), currency: p.variants[0]?.currency ?? 'USD' };
};
export const summary = (p: Product) => ({ handle: p.handle, title: p.title, image: p.variants.find(v => v.image)?.image ?? null, price: priceRange(p), available: p.variants.some(v => v.available) });
export function search(products: Product[], q?: string) {
  const needle = q?.trim().toLowerCase();
  return needle ? products.filter(p => `${p.title} ${p.handle.replaceAll('-', ' ')} ${p.description}`.toLowerCase().includes(needle)) : products;
}
