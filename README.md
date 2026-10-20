# 🛍️ vercel-store

A shop that looks like [vercel.store](https://vercel.store), running on your own computer.
Browse products, pick a size and color, add to your bag. No coding needed to start.

---

## ⚡ Fastest way: let your AI agent do it

Open Claude Code, Cursor, Codex or any coding agent in an empty folder and paste this:

```text
Clone https://github.com/tdk-landscape/vercel-store and set it up for me.
Install anything missing (Docker Desktop, Bun, Tilt, the TDK CLI) and tell me
what to click. Then run `tdk up store` and give me the storefront link.
```

The agent does the rest. You only click where it asks you to.

---

## 🧰 Or do it yourself (5 minutes)

You need a Mac, Linux or WSL2 machine.

### 1. Install the tools

| Tool | Why | Install |
| --- | --- | --- |
| **Docker Desktop** | runs the containers | [docker.com/get-started](https://www.docker.com/get-started/) — open it once and wait for the whale icon to stop animating |
| **Node.js 22+** | runs the TDK CLI | [nodejs.org](https://nodejs.org) |
| **Tilt** | watches and restarts your services | `brew install tilt` |
| **TDK CLI** | the landscape tool | `npm install -g @tdk-landscape/tdk-cli-core` |
| **Bun** | fast JavaScript runtime (optional, only for the no-Docker mode) | `curl -fsSL https://bun.sh/install \| bash` |

Check everything at once:

```bash
tdk doctor
```

Green checks mean you are ready. Anything red tells you exactly what to fix.

### 2. Get the code

```bash
git clone https://github.com/tdk-landscape/vercel-store.git
cd vercel-store
cp .env.example .env
```

### 3. Start the shop

```bash
tdk up store
```

Wait until both services show healthy (first run takes a few minutes; it is downloading the world 🌍).

### 4. Open it

👉 **[http://app.vercel-store.localhost:8080/storefront-web/](http://app.vercel-store.localhost:8080/storefront-web/)**

Try the Black / 2XL tee directly:
[`…/storefront-web/#/products/triangle-wavy-tee?color=Black&size=2XL`](http://app.vercel-store.localhost:8080/storefront-web/#/products/triangle-wavy-tee?color=Black&size=2XL)

### 5. Stop it

```bash
tdk down
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
| `tdk: command not found` | reopen your terminal after installing the TDK CLI |
| Docker error | open Docker Desktop and wait until it says "running" |
| port already in use | another app uses it; stop that app or run `tdk down` first |
| storefront shows a connection error | wait ~1 minute, then refresh; check `tdk status` |

Still stuck? Open an issue on this repo, or ask your agent: *"run `tdk status` and fix what is red."*

---

Built with [TDK](https://github.com/tdk-landscape) · inspired by [tdk-thor-storefront](https://github.com/tdk-landscape/tdk-thor-storefront) · not affiliated with Vercel.

## Use the repository-pinned TDK CLI

> **Repository-pinned CLI (optional):** Run `bun install` from the repository root to install the version pinned in `package.json`. Use `bun run tdk:project` to initialize project config, `bun run tdk:dry-run` to preview startup, or `bun run tdk:up -- <stack>` to start a stack. The global npm and standalone binary installation paths remain available.
