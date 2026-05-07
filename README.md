# IOTA Matka Pot

A decentralised lottery ("pot") application built on the IOTA Layer-1 blockchain.

## Live Testnet Contract

| Field | Value |
|---|---|
| Network | IOTA Testnet |
| Package ID | `0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a` |
| GlobalConfig | `0x62fe4b0e6d1a745281632d08a810182b839bb69e45bf94bba108de04fc2878e3` |
| Explorer | [View on IOTA Explorer](https://explorer.iota.org/object/0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a?network=testnet) |

## How It Works

1. Admin creates a pot with a reveal date (minimum 24 hours in future)
2. Players contribute IOTA (minimum ~1 USD equivalent)
3. Entries lock 10 minutes before reveal
4. At reveal time, admin frontend auto-triggers on-chain random draw
5. Winners receive prizes pushed directly to their wallets:
   - 3+ players: 1st=50%, 2nd=30%, 3rd=10%, Treasury=10%
   - 2 players: 1st=50%, 2nd=40%, Treasury=10%
   - 1 player: Player=90%, Treasury=10%

## Quick Start

### Run Frontend Locally

```bash
cd frontend
cp .env.testnet .env.local
pnpm install
pnpm dev
# → http://localhost:5173
```

### Deploy to Vercel

```bash
cd frontend
vercel --prod
```

### Run Move Tests

```bash
cd contract
iota move test
```

## Documentation

See `design/` folder:
- [High Level Design](design/HLD.md)
- [Low Level Design](design/LLD.md)
- [Security](design/SECURITY.md)
- [Data Persistence](design/PERSISTENCE.md)
- [Deployment Guide](design/DEPLOYMENT.md)
- [Full Context](design/CONTEXT.md)

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | IOTA Move (Layer 1) |
| Frontend | React 18 + TypeScript + Vite |
| Blockchain SDK | @iota/dapp-kit + @iota/iota-sdk |
| Styling | Tailwind CSS + Radix UI |
| Hosting | Vercel (frontend) |
| Price Feed | CoinGecko API |
