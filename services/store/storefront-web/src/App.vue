<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { findVariant, formatMoney, request, safeLink, type Cart, type Product, type Summary } from './api';

// Hash routes: #/ (catalog) and #/products/<handle>?color=Black&size=2XL (mirrors vercel.store URLs)
const route = ref(parse());
function parse() {
  const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
  const m = path.match(/^\/products\/([\w-]+)$/);
  return { handle: m?.[1] ?? null, query: new URLSearchParams(query) };
}
const onHash = () => { route.value = parse(); };

const products = ref<Summary[]>([]), search = ref(''), loading = ref(true), error = ref('');
const product = ref<Product | null>(null), productError = ref('');
const selected = ref<Record<string, string>>({});
const cart = ref<Cart | null>(null), bagOpen = ref(false), pending = ref(false), notice = ref('');
let gridVersion = 0;

const variant = computed(() => product.value ? findVariant(product.value, selected.value) : undefined);
const checkout = computed(() => safeLink(cart.value?.checkoutUrl ?? null));
const gallery = computed(() => [...new Set((product.value?.variants ?? []).map(v => v.image).filter(Boolean))] as string[]);
const hero = computed(() => variant.value?.image ?? gallery.value[0] ?? null);
const msg = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong. Please try again.';

async function loadProducts() {
  const v = ++gridVersion; loading.value = true; error.value = '';
  try {
    const q = search.value.trim();
    const r = await request<{ products: Summary[] }>(`/products${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    if (v === gridVersion) products.value = r.products;
  } catch (e) { if (v === gridVersion) error.value = msg(e); } finally { if (v === gridVersion) loading.value = false; }
}
async function loadProduct(handle: string) {
  product.value = null; productError.value = '';
  try {
    const { product: p } = await request<{ product: Product }>(`/products/${handle}`);
    if (route.value.handle !== handle) return;
    product.value = p;
    // First option value that exists, then override from ?color=&size= (case-insensitive on name, exact on value)
    const sel: Record<string, string> = {};
    for (const o of p.options) sel[o.name] = route.value.query.get(o.name.toLowerCase()) && o.values.includes(route.value.query.get(o.name.toLowerCase())!) ? route.value.query.get(o.name.toLowerCase())! : (p.variants.find(v => v.available)?.options[o.name] ?? o.values[0]);
    selected.value = sel;
  } catch (e) { productError.value = msg(e); }
}
watch(() => route.value.handle, h => { if (h) loadProduct(h); else if (!products.value.length) loadProducts(); }, { immediate: true });
watch(selected, s => {
  if (!route.value.handle) return;
  const q = new URLSearchParams(Object.entries(s).map(([k, v]) => [k.toLowerCase(), v]));
  history.replaceState(null, '', `#/products/${route.value.handle}?${q}`);
}, { deep: true });

async function ensureCart() { return cart.value ?? (cart.value = (await request<{ cart: Cart }>('/cart', {})).cart); }
async function addToCart() {
  if (!variant.value?.available || pending.value) return;
  pending.value = true; notice.value = '';
  try {
    const c = await ensureCart();
    cart.value = (await request<{ cart: Cart }>(`/cart/${c.id}/lines`, { variantId: variant.value.id, quantity: 1 })).cart;
    bagOpen.value = true;
  } catch (e) { notice.value = msg(e); } finally { pending.value = false; }
}
async function removeLine(variantId: string) {
  if (!cart.value) return;
  try { cart.value = (await request<{ cart: Cart }>(`/cart/${cart.value.id}/lines/${variantId}`, undefined, 'DELETE')).cart; } catch (e) { notice.value = msg(e); }
}
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') bagOpen.value = false; };
onMounted(() => { addEventListener('hashchange', onHash); addEventListener('keydown', onKey); if (!route.value.handle) loadProducts(); });
onUnmounted(() => { removeEventListener('hashchange', onHash); removeEventListener('keydown', onKey); });
</script>

<template>
  <div class="shell">
    <header class="bar">
      <a class="brand" href="#/" aria-label="Vercel store home"><svg width="18" height="16" viewBox="0 0 76 65" aria-hidden="true"><path d="M37.5 0 75 65H0z" fill="currentColor"/></svg><span>Store</span></a>
      <button class="bag" @click="bagOpen = true">Cart <span>{{ cart?.count ?? 0 }}</span></button>
    </header>

    <main v-if="!route.handle">
      <form class="search" @submit.prevent="loadProducts"><label class="sr" for="q">Search products</label><input id="q" v-model="search" type="search" placeholder="Search products"></form>
      <p v-if="error" role="alert" class="state">{{ error }} <button class="link" @click="loadProducts">Try again</button></p>
      <div v-else-if="loading" class="grid" aria-busy="true"><div v-for="n in 8" :key="n" class="skeleton"></div></div>
      <p v-else-if="!products.length" class="state">Nothing matches “{{ search }}”.</p>
      <div v-else class="grid">
        <a v-for="p in products" :key="p.handle" class="card" :href="`#/products/${p.handle}`">
          <div class="frame"><img v-if="p.image" :src="p.image" :alt="p.title" loading="lazy"><span v-if="!p.available" class="tag">Sold out</span></div>
          <div class="meta"><span>{{ p.title }}</span><span class="mono">{{ formatMoney(p.price.min, p.price.currency) }}<template v-if="p.price.max !== p.price.min">+</template></span></div>
        </a>
      </div>
    </main>

    <main v-else class="pdp">
      <p v-if="productError" role="alert" class="state">{{ productError }} <a class="link" href="#/">Back to store</a></p>
      <div v-else-if="!product" class="pdp-grid" aria-busy="true"><div class="skeleton tall"></div><div></div></div>
      <div v-else class="pdp-grid">
        <div class="gallery">
          <div class="frame big"><img v-if="hero" :src="hero" :alt="product.title"></div>
          <div v-if="gallery.length > 1" class="thumbs"><button v-for="(g, i) in gallery" :key="g" :class="{ on: g === hero }" :aria-label="`View image ${i + 1} of ${gallery.length}`" @click="selected = { ...selected, ...(product.variants.find(v => v.image === g)?.options ?? {}) }"><img :src="g" alt=""></button></div>
        </div>
        <section class="info">
          <a class="link back" href="#/">← All products</a>
          <h1>{{ product.title }}</h1>
          <p class="mono price">{{ variant ? formatMoney(variant.price, variant.currency) : 'Unavailable' }}</p>
          <fieldset v-for="o in product.options" :key="o.name">
            <legend>{{ o.name }}<span v-if="selected[o.name]">: {{ selected[o.name] }}</span></legend>
            <div class="chips">
              <button v-for="val in o.values" :key="val" type="button" :aria-pressed="selected[o.name] === val"
                :disabled="!findVariant(product, { ...selected, [o.name]: val })?.available"
                @click="selected = { ...selected, [o.name]: val }">{{ val }}</button>
            </div>
          </fieldset>
          <button class="primary" :disabled="!variant?.available || pending" @click="addToCart">{{ pending ? 'Adding…' : variant?.available ? 'Add to Cart' : variant ? 'Sold out' : 'Select options' }}</button>
          <p v-if="notice" role="alert" class="err">{{ notice }}</p>
          <h2>Description</h2>
          <p class="desc">{{ product.description }}</p>
          <a class="link" :href="product.url" target="_blank" rel="noopener noreferrer">View on vercel.store ↗</a>
        </section>
      </div>
    </main>

    <div v-if="bagOpen" class="scrim" @click="bagOpen = false"></div>
    <aside v-if="bagOpen" class="drawer" role="dialog" aria-label="Shopping cart">
      <div class="drawer-head"><h2>My Cart</h2><button class="link" @click="bagOpen = false">Close</button></div>
      <p v-if="!cart?.lines.length" class="state">Your cart is empty.</p>
      <template v-else>
        <ul class="lines"><li v-for="l in cart.lines" :key="l.variantId">
          <img v-if="l.image" :src="l.image" :alt="l.title">
          <div><a :href="`#/products/${l.handle}`" @click="bagOpen = false">{{ l.title }}</a><p>{{ l.variantTitle }} · Qty {{ l.quantity }}</p><button class="link" @click="removeLine(l.variantId)">Remove</button></div>
          <span class="mono">{{ formatMoney(l.unitPrice * l.quantity, cart.currency) }}</span>
        </li></ul>
        <div class="total"><span>Total</span><span class="mono">{{ formatMoney(cart.total, cart.currency) }}</span></div>
        <a v-if="checkout" class="primary" :href="checkout" target="_blank" rel="noopener noreferrer">Proceed to Checkout</a>
      </template>
    </aside>
    <footer><span>© {{ new Date().getFullYear() }} · Catalog synced from vercel.store</span></footer>
  </div>
</template>
