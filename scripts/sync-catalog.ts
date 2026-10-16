// Pulls the live vercel.store catalog into services/store/vercel-bff/data/catalog.json.
// vercel.store is the hosted commerce backend; this is the only place that talks to it for catalog data.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.VERCEL_STORE_ORIGIN || 'https://vercel.store';
const out = join(import.meta.dir, '../services/store/vercel-bff/src/data/catalog.json');

const text = async (url: string) => {
  const res = await fetch(url, { headers: { 'user-agent': 'tdk-vercel-store-sync' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
};
// Next.js flight payload embeds the Shopify product JSON as an escaped string.
const unescape = (s: string) => s.replaceAll('\\"', '"').replaceAll('\\\\', '\\');

function arrayAt(s: string, key: string): any[] {
  const i = s.indexOf(`"${key}":[`);
  if (i < 0) return [];
  let depth = 0, inStr = false;
  const start = s.indexOf('[', i);
  for (let j = start; j < s.length; j++) {
    const ch = s[j];
    if (inStr) { if (ch === '\\') j++; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return JSON.parse(s.slice(start, j + 1));
  }
  return [];
}
const meta = (html: string, prop: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`))?.[1]
  ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${prop}"`))?.[1] ?? '';
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const sitemap = await text(`${origin}/sitemap/products-1.xml`);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const products = [];
for (const url of urls) {
  const html = await text(url);
  const flight = unescape(html);
  const variants = arrayAt(flight, 'variants');
  if (!variants.length) { console.warn(`skip ${url}: no variants`); continue; }
  const handle = new URL(url).pathname.split('/').pop()!;
  const title = decode((meta(html, 'og:title') || html.match(/<title>([^<]*)/)?.[1] || handle).replace(/\s*\|\s*Vercel$/, ''));
  products.push({
    handle, url, title,
    description: decode(meta(html, 'og:description') || meta(html, 'description')),
    options: arrayAt(flight, 'options').map(o => ({ name: o.name, values: o.values.map((v: any) => v.name) })),
    variants: variants.map((v: any) => ({
      id: v.id.split('/').pop(), title: v.title, available: v.availableForSale,
      price: Number(v.price.amount), currency: v.price.currencyCode,
      options: Object.fromEntries(v.selectedOptions.map((o: any) => [o.name, o.value])),
      image: v.image?.url ?? null,
    })),
  });
  console.log(`✓ ${handle} (${variants.length} variants)`);
}
writeFileSync(out, JSON.stringify({ origin, syncedAt: new Date().toISOString(), products }, null, 2) + '\n');
console.log(`wrote ${products.length} products -> ${out}`);
