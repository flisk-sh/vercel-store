import { createApp } from './app';

const port = Number(process.env.PORT || 4300);
if (!Number.isInteger(port) || port < 1 || port > 65535) { console.error('PORT_INVALID'); process.exit(1); }
const app = createApp({
  frontendOrigin: process.env.STORE_FRONTEND_ORIGIN || 'http://app.vercel-store.localhost:8080',
  bffOrigin: process.env.STORE_BFF_ORIGIN || 'http://api.vercel-store.localhost:8080',
  storeOrigin: process.env.VERCEL_STORE_ORIGIN || 'https://vercel.store',
});
const server = Bun.serve({ port, hostname: '0.0.0.0', fetch: app.fetch });
console.log(`vercel-bff ready on container port ${port}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server.stop(true); process.exit(0); });
