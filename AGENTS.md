# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

IOTA Matka Pot is a decentralized lottery dApp built on the IOTA L1 blockchain. It consists of:

- **Frontend** (`frontend/`): React 18 + TypeScript SPA served by Vite. Uses `@iota/dapp-kit` and `@iota/iota-sdk` for blockchain interactions.
- **Smart Contract** (`contract/`): IOTA Move smart contract (already deployed to testnet). Contract tests require the `iota` CLI which is not installed in the cloud environment.

### Cloud agent environment (`install` / update script)

Cursor Cloud runs the `install` field from `.cursor/environment.json` at the **repository root** on each VM start (this is the “update script”). This repo keeps Node dependencies under `frontend/` only, so the configured script copies the committed testnet env template when `.env.local` is missing, then runs `pnpm install` in `frontend/`. Without this, a default root `npm install` fails because there is no root `package.json`.

### Running the Frontend

```bash
cd frontend
cp .env.testnet .env.local   # only needed once; pre-configured with live testnet contract IDs
pnpm install
pnpm dev                     # starts Vite on http://localhost:5173
```

### Available Scripts (frontend/)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Vite dev server (port 5173) |
| `pnpm build` | TypeScript check + production build |
| `pnpm lint` | ESLint (has 9 pre-existing lint errors in hooks/) |
| `pnpm format` | Prettier formatting |
| `pnpm preview` | Serve production build locally |

### Key Notes

- The app requires an IOTA wallet browser extension for full blockchain interaction (connect wallet, contribute to pots, admin actions). Without it, pages still render but wallet-dependent features show "Connect Wallet" prompts.
- No backend server or database — all data comes from the IOTA testnet blockchain via RPC at `https://api.testnet.iota.cafe`.
- The `contract/` directory contains Move smart contract source and tests. Running `iota move test` requires the IOTA CLI (`curl -fsSL https://get.iota.org | sh`), which is not part of the standard dev setup.
- `pnpm lint` currently reports 9 pre-existing errors (`no-unused-vars` and `no-explicit-any` in hooks). These are in the existing codebase and not blockers.
- The build produces a chunk size warning (>500 kB) for the vendor bundle — this is expected and not a build failure.
