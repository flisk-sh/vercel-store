import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const env = {
  ...process.env,
  PORT: '4350',
  STORE_FRONTEND_ORIGIN: 'http://127.0.0.1:3350',
  STORE_BFF_ORIGIN: 'http://127.0.0.1:4350',
  VITE_STORE_BFF_URL: 'http://127.0.0.1:4350',
};
const children = [
  Bun.spawn([process.execPath, '--watch', 'src/index.ts'], { cwd: join(root, 'services/store/vercel-bff'), env, stdout: 'inherit', stderr: 'inherit' }),
  Bun.spawn([process.execPath, 'x', 'vite', '--config', 'vite.config.local.ts', '--strictPort'], { cwd: join(root, 'services/store/storefront-web'), env, stdout: 'inherit', stderr: 'inherit' }),
];
const stop = () => children.forEach(c => c.exitCode === null && c.kill('SIGTERM'));
for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, stop);
console.log('Storefront: http://127.0.0.1:3350/storefront-web/#/products/triangle-wavy-tee?color=Black&size=2XL\nBFF: http://127.0.0.1:4350/health');
const code = await Promise.race(children.map(c => c.exited));
stop();
process.exit(code);
