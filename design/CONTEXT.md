# IOTA Matka Pot — Complete Project Context

This file is the single source of truth for everything decided, designed, and planned in this project. Any new agent, developer, or contributor should read this file first before touching any other document.

---

## 1. What This App Is

**IOTA Matka Pot** is a decentralised lottery ("pot") application built on the IOTA Layer-1 blockchain. It is inspired by the Indian Matka number lottery concept but implemented as a provably-fair, fully on-chain dApp.

Players contribute IOTA tokens into a shared pot. When the pot's reveal date arrives, winners are selected using verifiable on-chain randomness. Prizes are pushed automatically to winners' wallets. No server, no database, no custodian — everything lives on the blockchain permanently.

---

## 2. Origin of Requirements (Conversation Summary)

All decisions below were confirmed through iterative discussion with the project owner. This section captures every requirement and its final agreed state.

### 2.1 Core Concept (Initial Request)
- Matka pot app on React with IOTA integration
- Users put IOTA into the pot
- IOTA addresses chosen at random as winners
- 1st, 2nd, 3rd winners
- Admin creates games, sets reveal date
- Admin takes 10% treasury cut

### 2.2 Prize Distribution (Confirmed Final)

The following is the **final agreed distribution** — confirmed after the user clarified:

| Player Count | 1st | 2nd | 3rd | Treasury | Total |
|---|---|---|---|---|---|
| 1 player | 90% | — | — | 10% | 100% |
| 2 players | 50% | 40% | — | 10% | 100% |
| 3+ players | 50% | 30% | 10% | 10% | 100% |

### 2.3 Draw Fairness (Confirmed)
- **Each unique IOTA address = exactly 1 draw ticket**
- Contribution amount does NOT affect winning probability
- A player who contributes 10× still gets 1 ticket

### 2.4 Minimum Entry (Confirmed)
- Minimum contribution = **1 USD equivalent in IOTA at time of entry**
- Live price fetched from CoinGecko API (free, no key needed)
- Fallback: Binance API
- As of May 7 2026: IOTA = $0.0582 USD → minimum ≈ 17.18 IOTA
- Displayed live to user in the ContributionForm
- Enforced both on-chain (contract validation) and on the frontend

### 2.5 Who Triggers Reveal (Confirmed)
- **Admin frontend auto-triggers** `reveal_winners` when time is reached
- Admin's connected browser polls every 10 seconds
- When `clock.timestamp_ms() >= game.reveal_timestamp_ms`: auto-submits transaction
- A manual "Trigger Reveal" button also shown in admin panel as backup
- **Gas cost for reveal: deducted from the treasury's 10% cut**
- Net treasury = 10% of pot minus gas (gas is typically < 0.01 IOTA — negligible)

### 2.6 Admin Role (Confirmed)
- Admin NEVER contributes to pots
- Admin earns ONLY the 10% treasury cut per game
- Admin capabilities: create games, set treasury address, update minimum contribution, trigger reveals
- Admin is identified by possession of the `AdminCap` on-chain object (not just address)

### 2.7 Timing Rules (Confirmed)
- Minimum game duration: **> 24 hours** (enforced on-chain)
- **Pot locks 10 minutes before reveal** — no new entries accepted
- Games appear on Home page while active
- Games move to History page **3 days after reveal**

### 2.8 Optional User Entropy (Confirmed)
- Each player can optionally enter a "lucky phrase" when contributing
- Phrases are accumulated on-chain using rolling SHA3-256 hash
- At reveal time: accumulated entropy + transaction digest + Random(0x8) = final randomness seed
- This makes the draw collectively influenced by all participants
- Individual phrases are NOT stored raw — only the accumulated hash

### 2.9 Prize Delivery (Confirmed)
- **Push delivery**: prizes are automatically transferred to winner wallets when `reveal_winners` executes
- No separate claim step needed

### 2.10 Multiple Active Pots (Confirmed)
- Home page shows ALL active pots simultaneously
- Each pot is a separate `Game` object on-chain
- Multiple pots can coexist at different stages (open, locked, revealing)

### 2.11 Hosting (Confirmed)
- **Frontend**: Vercel (free tier, auto-deploy from GitHub)
- **Smart Contract**: IOTA Testnet first, then Mainnet
- No backend server, no database

---

## 3. Final Technical Architecture

### 3.1 Layers
```
Layer          Technology              Purpose
─────────────────────────────────────────────────────────
Frontend       React 18 + TypeScript   User interface
               Vite                    Build tool
               @iota/dapp-kit          Wallet + chain queries
               @iota/iota-sdk          Transaction building
               @tanstack/react-query   Data fetching + caching
               Tailwind CSS            Styling
               React Router DOM v6     Page routing
               Vercel                  Hosting

Smart Contract IOTA Move (L1)          Game logic, prizes, randomness
               iota::random (0x8)      Verifiable randomness
               iota::clock (0x6)       On-chain timestamps
               IOTA Testnet/Mainnet    Network

Price Feed     CoinGecko API           IOTA/USD price (primary)
               Binance API             IOTA/USD price (fallback)
```

### 3.2 Why L1 Move (Not EVM/Solidity)
- `iota::random::Random` (0x8) — native secure on-chain randomness — not available on L2
- `iota::clock::Clock` (0x6) — millisecond-resolution timestamps — native on L1
- `Coin<IOTA>` — native IOTA token handling — cleaner on L1
- Gas cheaper on L1 for this use case

---

## 4. On-Chain Object Model (Persistence)

### How Data Is Stored

**There is no database. The IOTA blockchain is the database.**

| Object | Type | Owner | Contains |
|---|---|---|---|
| `AdminCap` | Owned | Admin wallet | UID only — possession = admin authority |
| `GlobalConfig` | Shared | — | admin_address, treasury_address, game_counter, min_contribution_nanos |
| `Game` | Shared | — | pot_balance, entries, contributions, entropy, timing, winners, prizes |
| `Ticket` | Owned | Player wallet | game_id, player, amount_nanos, contributed_at_ms |

### Key Fields in `Game` Object
```
pot_balance: Balance<IOTA>       — real IOTA tokens locked here
entries: VecSet<address>         — unique players (1 ticket each)
contributions: Table<address,u64>— NANOS per player
accumulated_entropy: vector<u8>  — rolling hash of all lucky phrases
reveal_timestamp_ms: u64         — when draw happens
lockout_timestamp_ms: u64        — reveal_ts - 10 minutes
is_active: bool                  — false after reveal
winner_1/2/3: Option<address>    — set at reveal
prize_1/2/3_nanos: u64           — set at reveal
```

### Event Log (Append-Only, Indexed)
```
GameCreated      → emitted by create_game()
TicketIssued     → emitted by add_to_pot()
WinnersRevealed  → emitted by reveal_winners()
TreasuryUpdated  → emitted by update_treasury_address()
MinContributionUpdated → emitted by update_min_contribution()
```

Frontend discovers game IDs by querying `GameCreated` events.

---

## 5. Admin Security Model

### Two-Layer Protection

**Layer 1 — Smart Contract (the real security)**:
- Every admin function requires `&AdminCap` parameter
- `AdminCap` is a unique on-chain object that exists exactly once
- IOTA validators check caller owns `AdminCap` — cannot be forged
- Even if frontend is bypassed, contract rejects all unauthorized calls

**Layer 2 — Frontend Guard (UX convenience)**:
- `/admin` route wrapped in `<AdminGuard>` component
- Compares connected wallet address with `GlobalConfig.admin_address`
- Wrong wallet → "Access Denied" page
- This layer provides no cryptographic security — only UX cleanliness

### What "admin" means
- The address that deployed the contract gets `AdminCap` via `init()`
- Whoever holds `AdminCap` in their wallet IS the admin
- Admin can transfer `AdminCap` to a new address to change admin

---

## 6. Application Pages

| Route | Name | Access | Description |
|---|---|---|---|
| `/` | Home | Public | Active pots grid, live price banner |
| `/game/:id` | Game Detail | Public | Contribute, countdown, players list |
| `/game/:id/results` | Results | Public | Winners podium, full entry table |
| `/history` | History | Public | Pots revealed > 3 days ago |
| `/history/:id` | History Detail | Public | Full breakdown of past game |
| `/admin` | Admin Panel | Admin only | Create games, settings, reveal watcher |

---

## 7. Key Timing Constants

| Constant | Value | Enforced |
|---|---|---|
| Minimum game duration | 24 hours (86,400,000 ms) | Smart contract — `create_game` |
| Lockout before reveal | 10 minutes (600,000 ms) | Smart contract — `add_to_pot` |
| Auto-reveal poll interval | 10 seconds | Frontend — `useAutoReveal` hook |
| Price feed refresh | 60 seconds | Frontend — `useIotaPrice` hook |
| Active games refresh | 15 seconds | Frontend — `useActiveGames` hook |
| History threshold | 3 days (259,200,000 ms) | Frontend — filter logic |
| Min contribution (current) | ~17.18 IOTA (~$1.00 USD) | Contract + frontend |

---

## 8. Smart Contract Functions Summary

| Function | Visibility | Who Calls | Key Validation |
|---|---|---|---|
| `init` | private | Auto at publish | — |
| `create_game` | public entry | Admin | AdminCap + reveal > 24h |
| `add_to_pot` | public entry | Any wallet | Active + amount >= min + before lockout |
| `reveal_winners` | **private** entry | Admin (auto) | Active + after deadline + ≥1 player |
| `update_treasury_address` | public entry | Admin | AdminCap |
| `update_min_contribution` | public entry | Admin | AdminCap |

> `reveal_winners` MUST be `entry` (not `public entry`) because it takes `&Random`. The Move compiler enforces this. This prevents external contracts from calling it and selectively reverting.

---

## 9. Agent Build Plan (7 Agents, 3 Waves)

See `design/AGENT_EXECUTION_PLAN.md` for full specs. Summary:

```
WAVE 1 (4 agents, fully parallel):
  Agent 1: Smart Contract (Move package — all code)
  Agent 2: Frontend Foundation (hooks, PTBs, routing, types, config)
  Agent 3: Frontend Public Pages (Home, GameDetail, Results, History)
  Agent 4: Frontend Admin (AdminPage, AdminGuard, ContributionForm)

WAVE 2 (2 agents, parallel, after Wave 1):
  Agent 5: Move Tests (10 unit tests) + Testnet Deploy
  Agent 6: Frontend Integration (merge Wave 1, fix types, pnpm build)

WAVE 3 (1 agent, after Wave 2 deploy):
  Agent 7: Wire frontend to deployed IDs + testnet smoke test
```

---

## 10. Deployment Plan

See `design/DEPLOYMENT.md` for full step-by-step guide. Summary:

```
Step 1: iota client publish → get PACKAGE_ID + GLOBAL_CONFIG_ID
Step 2: Update frontend .env.testnet with real IDs
Step 3: vercel --prod → live at https://iota-matka-pot.vercel.app
Step 4: Connect GitHub repo to Vercel for auto-deploy on push
Step 5: (later) repeat Steps 1-3 for Mainnet
```

---

## 11. System Object Addresses (Hardcoded, Never Change)

```
iota::random::Random  →  0x8   (system randomness singleton)
iota::clock::Clock    →  0x6   (system clock singleton)
```

These are passed as arguments in PTBs — never stored in config.

---

## 12. File Structure After Full Build

```
/workspace
├── contract/
│   ├── Move.toml
│   ├── sources/
│   │   ├── matka_pot.move       ← main module
│   │   ├── events.move          ← all event structs
│   │   └── prize.move           ← prize calculation helpers
│   ├── tests/
│   │   └── matka_pot_tests.move ← 10 unit tests
│   └── .deployed.testnet.json   ← IDs after deploy (created by Agent 5)
│
├── frontend/
│   ├── vercel.json
│   ├── .env.testnet
│   ├── .env.mainnet
│   └── src/
│       ├── types/index.ts
│       ├── networkConfig.ts
│       ├── hooks/               ← 5 hooks
│       ├── transactions/        ← 5 PTB builders
│       ├── pages/               ← 6 pages
│       ├── components/          ← 14 components
│       └── utils/               ← 4 utility files
│
└── design/
    ├── HLD.md
    ├── LLD.md
    ├── SECURITY.md
    ├── PERSISTENCE.md
    ├── DEPLOYMENT.md
    ├── AGENT_EXECUTION_PLAN.md
    ├── SKILLS.md
    ├── CONTEXT.md               ← this file
    └── images/                  ← 7 UI mockup PNGs
```

---

## 13. Design Documents Map

| Document | Answers the Question |
|---|---|
| `HLD.md` | What is the system? How do the parts connect? |
| `LLD.md` | Exactly what code do I write? Function by function. |
| `SECURITY.md` | How is admin protected? Can it be hacked? |
| `PERSISTENCE.md` | Where is every piece of data stored? |
| `DEPLOYMENT.md` | How do I deploy to testnet and Vercel? |
| `AGENT_EXECUTION_PLAN.md` | Which agent writes which file? In what order? |
| `SKILLS.md` | What do I need to know to build/contribute? |
| `CONTEXT.md` | What is the full picture? (this file) |

---

## 14. Open Items / Future Enhancements

These were NOT in scope for the initial build but noted during discussion:

| Item | Notes |
|---|---|
| Mainnet deploy | Happens after testnet validation. Use same contract code. |
| Custom domain on Vercel | e.g. `matkapot.iota.io` — set in Vercel dashboard |
| Oracle for price feed | Admin manually updates min contribution. Auto-oracle is future work. |
| Mobile wallet deep-link | IOTA Wallet mobile app integration |
| Multiple languages (i18n) | React-i18next can be added post-launch |
| Game metadata (name, description) | Could add `name: String` to Game struct in a future upgrade |
| Admin notification (when reveal fires) | Email/webhook from admin frontend — post-launch |
| Analytics | Dune Analytics queries on IOTA events — no code change needed |

---

## 15. Current Project Status

As of the time this file was written:

```
✅ COMPLETE: Full design documentation (HLD, LLD, Security, Persistence, Deployment)
✅ COMPLETE: UI mockups (7 screens including mobile)
✅ COMPLETE: Agent execution plan with exact task specs
✅ COMPLETE: Deployment guide (Vercel + IOTA Testnet)
✅ COMPLETE: Skills reference
✅ COMPLETE: This context file

🔲 PENDING: Smart contract code (Agent 1)
🔲 PENDING: Frontend code (Agents 2, 3, 4)
🔲 PENDING: Move unit tests (Agent 5)
🔲 PENDING: Testnet deploy (Agent 5)
🔲 PENDING: Frontend integration (Agent 6)
🔲 PENDING: Testnet wiring + smoke test (Agent 7)
🔲 PENDING: Vercel production deploy
```

**Next action: Spawn Wave 1 agents (say "go") to begin coding.**
