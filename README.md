# 🛍️ vercel-store

A shop that looks like [vercel.store](https://vercel.store), running on your own computer.
Browse products, pick a size and color, add to your bag. No coding needed to start.

---

## ⚡ Fastest way: let your AI agent do it

Open Claude Code, Cursor, Codex or any coding agent in an empty folder and paste this:

```text
Clone https://github.com/flisk-sh/vercel-store and set it up for me.
Install anything missing (Docker Desktop, Bun, Tilt, the Flisk CLI) and tell me
what to click. Then run `flisk up store` and give me the storefront link.
```

The agent does the rest. You only click where it asks you to.

---

## 🧰 Or do it yourself (5 minutes)

You need a Mac, Linux or WSL2 machine.

### 1. Install the tools

| Tool | Why | Install |
| --- | --- | --- |
| **Docker Desktop** | runs the containers | [docker.com/get-started](https://www.docker.com/get-started/) — open it once and wait for the whale icon to stop animating |
| **Node.js 22+** | runs the Flisk CLI | [nodejs.org](https://nodejs.org) |
| **Tilt** | watches and restarts your services | `brew install tilt` |
| **Flisk CLI** | the landscape tool | `npm install -g @flisk-sh/flisk` |
| **Bun** | fast JavaScript runtime (optional, only for the no-Docker mode) | `curl -fsSL https://bun.sh/install \| bash` |

Check everything at once:

```bash
flisk doctor
```

Green checks mean you are ready. Anything red tells you exactly what to fix.

### 2. Get the code

```bash
git clone https://github.com/flisk-sh/vercel-store.git
cd vercel-store
cp .env.example .env
```

#### Settings

The defaults below come from `.env.example`. An origin includes the scheme, host, and any non-default port, with no path or trailing slash.

| Setting | Default | When to change it |
| --- | --- | --- |
| `VERCEL_STORE_ORIGIN` | `https://vercel.store` | Change when catalog sync should use a different compatible storefront. The BFF also reports this store origin. |
| `STORE_FRONTEND_ORIGIN` | `http://app.vercel-store.localhost:8080` | Match the address the browser uses for the shop. The API uses this origin for its CORS checks. |
| `STORE_BFF_ORIGIN` | `http://api.vercel-store.localhost:8080` | Match the API's public origin in the proxy. |
| `VITE_STORE_BFF_URL` | empty | Leave blank for the default API route inferred from the shop URL. Set a browser-reachable API base URL when the API uses a different host or route. Include the `/api/vercel-bff` prefix if the proxy serves the API there. |
| `FLISK_HTTP_PORT` | `8080` | Set the Flisk proxy's host HTTP port. If you change it, update both `STORE_*_ORIGIN` values and any explicit `VITE_STORE_BFF_URL` that uses this port. |
| `FLISK_HTTPS_PORT` | `8443` | Set the Flisk proxy's host HTTPS port. If you serve the shop over HTTPS, use that scheme and port in the public origin settings. |

`bun run dev:local` sets its own local shop and API origins on ports 3350 and 4350. The Flisk proxy port settings apply to `flisk up`.

### 3. Start the shop

```bash
flisk up store
```

Wait until both services show healthy (first run takes a few minutes; it is downloading the world 🌍).

### 4. Open it

👉 **[http://app.vercel-store.localhost:8080/storefront-web/](http://app.vercel-store.localhost:8080/storefront-web/)**

Try the Black / 2XL tee directly:
[`…/storefront-web/#/products/triangle-wavy-tee?color=Black&size=2XL`](http://app.vercel-store.localhost:8080/storefront-web/#/products/triangle-wavy-tee?color=Black&size=2XL)

### 5. Stop it

```bash
flisk down
```

---

## 🏃 No Docker? Run it with Bun

```bash
bun install
bun run dev:local
```

Then open **http://127.0.0.1:3350/storefront-web/**

---

## 🧱 What is inside

```text
services/store/
├── storefront-web/   Vue 3 storefront  (the pretty part)
└── vercel-bff/       Hono API          (talks to the catalog, keeps your bag)
scripts/
└── sync-catalog.ts   refreshes products from vercel.store
```

- **Catalog**: 12 real products pulled from vercel.store. Refresh with `bun run sync:catalog`.
- **Bag**: lives in the API's memory, so it resets when the API restarts.
- **Checkout**: opens the product on vercel.store (their checkout is theirs).
- **No database, no secrets, no accounts.**

## 🧪 Check your work

```bash
bun install
bun run check    # type checks
bun run test     # unit tests
```

## 🙋 Something broke?

| You see | Try |
| --- | --- |
| `flisk: command not found` | reopen your terminal after installing the Flisk CLI |
| Docker error | open Docker Desktop and wait until it says "running" |
| port already in use | another app uses it; stop that app or run `flisk down` first |
| storefront shows a connection error | wait ~1 minute, then refresh; check `flisk status` |

Still stuck? Open an issue on this repo, or ask your agent: *"run `flisk status` and fix what is red."*

---

Built with [Flisk](https://github.com/flisk-sh) · inspired by [flisk-thor-storefront](https://github.com/flisk-sh/flisk-thor-storefront) · not affiliated with Vercel.

## Use the repository-pinned Flisk CLI

> **Repository-pinned CLI (optional):** Run `bun install` from the repository root to install the version pinned in `package.json`. Use `bun run flisk:project` to initialize project config, `bun run flisk:dry-run` to preview startup, or `bun run flisk:up -- <stack>` to start a stack. The global npm and standalone binary installation paths remain available.
