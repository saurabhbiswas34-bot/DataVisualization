# IOTA Matka Pot — Deployment Guide

## Overview

Two independent deployments are required:
1. **Smart Contract** → IOTA Testnet (Move package publish)
2. **Frontend** → Vercel (static React app)

They deploy independently. The contract must be deployed first to get the `PACKAGE_ID` and `GLOBAL_CONFIG_ID` needed by the frontend.

---

## Prerequisites

### Install IOTA CLI
```bash
# Linux / macOS
curl -fsSL https://get.iota.org | sh

# Verify
iota --version
```

### Install Node.js tooling
```bash
# Node 20+ required
node --version

# Install pnpm
npm install -g pnpm

# Install Vercel CLI
npm install -g vercel
```

### Install Git
```bash
git --version
```

---

## Step 1 — IOTA Testnet: Smart Contract Deployment

### 1.1 Create a Testnet Wallet

```bash
# Create new address (or import existing)
iota client new-address ed25519

# Switch to testnet
iota client switch --env testnet

# Verify active address
iota client active-address
```

### 1.2 Fund Your Wallet from Testnet Faucet

```bash
# Request testnet IOTA (free)
iota client faucet

# Verify balance (wait ~10 seconds)
iota client balance
# Should show: Total IOTA Balance: 10 IOTA
```

Alternatively use the web faucet:
👉 https://faucet.testnet.iota.cafe

### 1.3 Build the Move Package

```bash
cd contract/

# Check for errors
iota move build

# Run unit tests
iota move test

# Expected output:
# Test result: OK. Total tests: 10; passed: 10; failed: 0
```

### 1.4 Publish to Testnet

```bash
iota client publish --gas-budget 50000000

# This outputs a long transaction result. Find and copy these two values:

# 1. PackageID — look for "Published Objects" section:
#    PackageID: 0x537d7c04ddd8f7611de17910909c99c610227f9949126e684ba4a7b6eb55e3e1

# 2. GlobalConfig Object ID — look for "Created Objects" section,
#    find the object with ObjectType containing "::GlobalConfig":
#    ObjectID: 0x9e54291864e24091153c6f6250cb2788d2e928c438ee15c2be4db7614f85ae3e
```

### 1.5 Save the Deployed IDs

Create a file `contract/.deployed.testnet.json`:
```json
{
  "network": "testnet",
  "packageId": "0xYOUR_PACKAGE_ID_HERE",
  "globalConfigId": "0xYOUR_GLOBAL_CONFIG_ID_HERE",
  "adminAddress": "0xYOUR_ADMIN_WALLET_ADDRESS_HERE",
  "deployedAt": "2026-05-07T15:00:00Z",
  "explorerUrl": "https://explorer.iota.org/object/0xYOUR_PACKAGE_ID_HERE?network=testnet"
}
```

### 1.6 Verify on IOTA Explorer

Open in browser:
```
https://explorer.iota.org/object/0xYOUR_PACKAGE_ID_HERE?network=testnet
```

You should see the published Move package with modules: `matka_pot`, `events`, `prize`.

---

## Step 2 — Frontend: Environment Configuration

### 2.1 Create Environment Files

After contract deployment, update the frontend environment files:

**`frontend/.env.testnet`**
```env
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE
VITE_GLOBAL_CONFIG_ID=0xYOUR_GLOBAL_CONFIG_ID_HERE
VITE_ADMIN_ADDRESS=0xYOUR_ADMIN_WALLET_ADDRESS_HERE
VITE_IOTA_FULLNODE_URL=https://api.testnet.iota.cafe
VITE_COINGECKO_API=https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd
VITE_BINANCE_API=https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT
```

**`frontend/.env.mainnet`** (fill in later for production)
```env
VITE_NETWORK=mainnet
VITE_PACKAGE_ID=0xTBD
VITE_GLOBAL_CONFIG_ID=0xTBD
VITE_ADMIN_ADDRESS=0xTBD
VITE_IOTA_FULLNODE_URL=https://api.iota.cafe
VITE_COINGECKO_API=https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd
VITE_BINANCE_API=https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT
```

**`frontend/.env.local`** (for local development against testnet)
```env
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE
VITE_GLOBAL_CONFIG_ID=0xYOUR_GLOBAL_CONFIG_ID_HERE
VITE_ADMIN_ADDRESS=0xYOUR_ADMIN_WALLET_ADDRESS_HERE
VITE_IOTA_FULLNODE_URL=https://api.testnet.iota.cafe
VITE_COINGECKO_API=https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd
VITE_BINANCE_API=https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT
```

> **⚠ Never commit `.env.local` to git.** It is already in `.gitignore`.
> `.env.testnet` and `.env.mainnet` are safe to commit (they contain no secrets).

### 2.2 Test the Build Locally

```bash
cd frontend/

# Install dependencies
pnpm install

# Run dev server (uses .env.local)
pnpm dev
# → App available at http://localhost:5173

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Step 3 — Vercel Deployment (Testnet)

### 3.1 Install Vercel CLI and Login

```bash
npm install -g vercel
vercel login
# → Opens browser for GitHub OAuth
```

### 3.2 Add `vercel.json` to frontend root

**`frontend/vercel.json`**
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

The `rewrites` rule is critical — it sends all routes to `index.html` so React Router handles `/game/:id`, `/admin`, etc. correctly.

### 3.3 Deploy to Vercel (First Time)

```bash
cd frontend/

vercel

# Follow the prompts:
# ? Set up and deploy "frontend"? → Yes
# ? Which scope? → Your account
# ? Link to existing project? → No
# ? What's your project's name? → iota-matka-pot
# ? In which directory is your code located? → ./
# ✓ Deployed to https://iota-matka-pot-xxxx.vercel.app
```

### 3.4 Set Environment Variables on Vercel

```bash
# Set each variable for the testnet deployment
vercel env add VITE_NETWORK
# → Enter: testnet
# → Select environments: Production, Preview, Development

vercel env add VITE_PACKAGE_ID
# → Enter: 0xYOUR_PACKAGE_ID_HERE

vercel env add VITE_GLOBAL_CONFIG_ID
# → Enter: 0xYOUR_GLOBAL_CONFIG_ID_HERE

vercel env add VITE_ADMIN_ADDRESS
# → Enter: 0xYOUR_ADMIN_WALLET_ADDRESS_HERE

vercel env add VITE_IOTA_FULLNODE_URL
# → Enter: https://api.testnet.iota.cafe

vercel env add VITE_COINGECKO_API
# → Enter: https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd

vercel env add VITE_BINANCE_API
# → Enter: https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT
```

### 3.5 Redeploy with Environment Variables

```bash
vercel --prod

# Output:
# ✓ Production deployment: https://iota-matka-pot.vercel.app
```

---

## Step 4 — GitHub Auto-Deploy (CI/CD)

Connect Vercel to GitHub so every push auto-deploys:

### 4.1 Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New → Project"
3. Import `saurabhbiswas34-bot/DataVisualization` from GitHub
4. Set **Root Directory** to `frontend/`
5. Set **Framework** to Vite
6. Add all environment variables from Step 3.4
7. Click Deploy

After this, every `git push` to `main` → Vercel auto-rebuilds → live in ~45 seconds.
Every PR → Vercel creates a unique preview URL.

### 4.2 GitHub Actions (Alternative)

**`.github/workflows/deploy.yml`**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install
        working-directory: frontend

      - name: Build
        run: pnpm build
        working-directory: frontend
        env:
          VITE_NETWORK: testnet
          VITE_PACKAGE_ID: ${{ secrets.VITE_PACKAGE_ID }}
          VITE_GLOBAL_CONFIG_ID: ${{ secrets.VITE_GLOBAL_CONFIG_ID }}
          VITE_ADMIN_ADDRESS: ${{ secrets.VITE_ADMIN_ADDRESS }}
          VITE_IOTA_FULLNODE_URL: https://api.testnet.iota.cafe
          VITE_COINGECKO_API: https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd
          VITE_BINANCE_API: https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
```

Add these to GitHub repo secrets:
- `VERCEL_TOKEN` — from https://vercel.com/account/tokens
- `VERCEL_ORG_ID` — from Vercel project settings
- `VERCEL_PROJECT_ID` — from Vercel project settings
- `VITE_PACKAGE_ID`, `VITE_GLOBAL_CONFIG_ID`, `VITE_ADMIN_ADDRESS`

---

## Step 5 — Mainnet Deployment (When Ready)

### 5.1 Deploy Contract to Mainnet

```bash
# Switch to mainnet
iota client switch --env mainnet

# Ensure wallet has real IOTA for gas (buy from exchange)
iota client balance

# Publish (same command, different network)
iota client publish --gas-budget 50000000

# Save new PACKAGE_ID and GLOBAL_CONFIG_ID to contract/.deployed.mainnet.json
```

### 5.2 Create Separate Vercel Project for Mainnet

```bash
cd frontend/
vercel --name iota-matka-pot-mainnet

# Set VITE_NETWORK=mainnet and mainnet IDs
# Deploy to: https://iota-matka-pot-mainnet.vercel.app
```

---

## Deployed URLs Reference

| Environment | Frontend URL | Contract |
|---|---|---|
| Local dev | http://localhost:5173 | IOTA Localnet |
| Testnet | https://iota-matka-pot.vercel.app | IOTA Testnet |
| Mainnet (future) | https://iota-matka-pot-mainnet.vercel.app | IOTA Mainnet |

---

## Post-Deployment Checklist

### Contract Verification
- [ ] Package visible on IOTA Explorer testnet
- [ ] `GlobalConfig` object exists and readable
- [ ] `AdminCap` object is in admin wallet
- [ ] `iota move test` — all tests passing

### Frontend Verification
- [ ] App loads at Vercel URL
- [ ] Wallet connect works (IOTA Wallet extension)
- [ ] Live IOTA price displaying correctly
- [ ] Admin panel accessible with admin wallet
- [ ] Admin panel blocked for non-admin wallets
- [ ] Can create a game from admin panel
- [ ] Can contribute to a pot
- [ ] Lockout activates 10 minutes before reveal
- [ ] Auto-reveal fires when time reached
- [ ] Winners displayed correctly on Results page
- [ ] History page shows revealed pots

### Testnet Test Wallets Needed
- 1 × Admin wallet (holds AdminCap, has testnet IOTA for gas)
- 3 × Player wallets (each funded via faucet for test contributions)

Get testnet IOTA: https://faucet.testnet.iota.cafe

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `iota client publish` fails | Run `iota client faucet` first, ensure balance > 0 |
| Frontend shows blank page | Check `vercel.json` rewrites rule is present |
| Wallet won't connect | Ensure IOTA Wallet browser extension is installed |
| `getObject` returns null | Wrong `VITE_GLOBAL_CONFIG_ID` in env vars |
| Admin panel shows "Access Denied" | Wrong wallet connected, or `VITE_ADMIN_ADDRESS` mismatch |
| Price not loading | CoinGecko rate limit — Binance fallback kicks in after 3s |
| Reveal not auto-triggering | Admin wallet must be connected and on the site |
