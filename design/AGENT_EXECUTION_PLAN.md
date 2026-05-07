# IOTA Matka Pot — Coding Agent Execution Plan

## Overview

7 subagents across 3 waves build and test the complete application.
Wave 1 agents are fully independent and run simultaneously.
Wave 2 starts only when all Wave 1 agents have committed their work.
Wave 3 starts only when Wave 2 deploy agent has produced a package ID.

```
WAVE 1 ──────────────────────────────────── (4 agents, parallel)
  Agent 1: Smart Contract (Move)
  Agent 2: Frontend Foundation (hooks, PTBs, routing, config)
  Agent 3: Frontend Public Pages (Home, GameDetail, Results, History)
  Agent 4: Frontend Admin (AdminPage, AdminGuard, admin components)
           │
           ▼ (all four finish, outputs merged)
WAVE 2 ──────────────────────────────────── (2 agents, parallel)
  Agent 5: Move Tests + Testnet Deploy
  Agent 6: Frontend Integration (merge, type-fix, pnpm build)
           │
           ▼ (package ID known, build passing)
WAVE 3 ──────────────────────────────────── (1 agent)
  Agent 7: Wire + End-to-End Testnet Smoke Test
```

---

## Repository Structure Produced by All Agents

```
/workspace
├── contract/                        ← Agent 1 + Agent 5
│   ├── Move.toml
│   ├── sources/
│   │   ├── matka_pot.move
│   │   ├── events.move
│   │   └── prize.move
│   ├── tests/
│   │   └── matka_pot_tests.move
│   └── .deployed.testnet.json       ← written by Agent 5 after deploy
│
├── frontend/                        ← Agent 2 + 3 + 4 + 6 + 7
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── .env.testnet
│   ├── .env.mainnet
│   ├── .env.local.example
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── networkConfig.ts         ← updated by Agent 7 with real IDs
│       ├── types/
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useIotaPrice.ts
│       │   ├── useActiveGames.ts
│       │   ├── useGame.ts
│       │   ├── useAutoReveal.ts
│       │   └── useIsAdmin.ts
│       ├── transactions/
│       │   ├── addToPot.ts
│       │   ├── revealWinners.ts
│       │   ├── createGame.ts
│       │   ├── updateTreasury.ts
│       │   └── updateMinEntry.ts
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── GameDetailPage.tsx
│       │   ├── ResultsPage.tsx
│       │   ├── HistoryPage.tsx
│       │   ├── HistoryDetailPage.tsx
│       │   └── AdminPage.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── PotCard.tsx
│       │   ├── CountdownTimer.tsx
│       │   ├── ContributionForm.tsx
│       │   ├── PriceDisplay.tsx
│       │   ├── PlayersList.tsx
│       │   ├── WinnersBoard.tsx
│       │   ├── AllEntriesTable.tsx
│       │   ├── HistoryCard.tsx
│       │   ├── AdminGuard.tsx
│       │   ├── CreateGameForm.tsx
│       │   ├── TreasurySettings.tsx
│       │   ├── MinContributionUpdater.tsx
│       │   └── RevealWatcher.tsx
│       └── utils/
│           ├── formatIOTA.ts
│           ├── formatAddress.ts
│           ├── priceCalc.ts
│           └── timeUtils.ts
│
└── design/                          ← Already complete
    ├── HLD.md
    ├── LLD.md
    ├── SECURITY.md
    ├── PERSISTENCE.md
    ├── DEPLOYMENT.md
    ├── AGENT_EXECUTION_PLAN.md      ← this file
    └── images/  (7 mockup PNGs)
```

---

## WAVE 1 — Agent Specifications

---

### Agent 1: Smart Contract

**Branch**: `cursor/iota-matka-pot-design-5951` (same branch, `contract/` folder)
**Type**: `generalPurpose`
**Works in**: `/workspace/contract/`
**Depends on**: Nothing — starts immediately

#### Exact Tasks

1. Create `contract/Move.toml`:
   - Package name: `matka_pot`
   - IOTA framework dependency from `https://github.com/iotaledger/iota` at the `testnet` rev

2. Create `contract/sources/events.move`:
   - Module `matka_pot::events`
   - Structs (all `copy, drop`):
     - `GameCreated { game_id, reveal_timestamp_ms, lockout_timestamp_ms, min_contribution_nanos, created_at_ms }`
     - `TicketIssued { game_id, player: address, amount_nanos, total_pot_nanos, player_count, ticket_object_id: ID }`
     - `WinnersRevealed { game_id, unique_players, winner_1: address, prize_1_nanos, winner_2: Option<address>, prize_2_nanos, winner_3: Option<address>, prize_3_nanos, treasury_address: address, treasury_cut_nanos, revealed_at_ms }`
     - `TreasuryUpdated { old_address: address, new_address: address }`
     - `MinContributionUpdated { old_nanos: u64, new_nanos: u64 }`

3. Create `contract/sources/prize.move`:
   - Module `matka_pot::prize`
   - Public function `calculate_prizes(total_pot: u64, unique_count: u64): (u64, u64, u64, u64)`
     - 1 player: returns (90%, 0, 0, 10%)
     - 2 players: returns (50%, 40%, 0, 10%)
     - 3+ players: returns (50%, 30%, 10%, 10%)
   - All math uses integer division. Remainder goes to treasury to avoid dust.

4. Create `contract/sources/matka_pot.move`:
   - Module `matka_pot::matka_pot`
   - Uses: `iota::coin`, `iota::balance`, `iota::transfer`, `iota::clock`, `iota::random`, `iota::vec_set`, `iota::table`, `iota::event`, `iota::hash`, `std::option`, `std::vector`, `std::bcs`
   - Structs: `AdminCap`, `GlobalConfig`, `Game`, `Ticket` (exactly as in LLD.md)
   - Functions in order:
     - `fun init(ctx: &mut TxContext)` — creates AdminCap + GlobalConfig
     - `public entry fun create_game(...)` — admin only, 24h validation
     - `public entry fun add_to_pot(...)` — any user, lockout check, entropy accumulation, Ticket mint
     - `entry fun reveal_winners(...)` — private entry (Random param), deadline check, draw logic, push prizes
     - `public entry fun update_treasury_address(...)` — admin only
     - `public entry fun update_min_contribution(...)` — admin only
   - `reveal_winners` must handle all 3 tiers (1/2/3+ players) and push Coin<IOTA> objects to all winners

5. Run `iota move build` — must succeed with zero errors

#### Acceptance Criteria
- `iota move build` exits 0
- All 5 source files exist
- `reveal_winners` is `entry` not `public entry` (required for Random safety)
- Prize math: 1p=90/10, 2p=50/40/10, 3p+=50/30/10/10 (sums to 100%)

---

### Agent 2: Frontend Foundation

**Branch**: `cursor/iota-matka-pot-design-5951`
**Type**: `generalPurpose`
**Works in**: `/workspace/frontend/`
**Depends on**: Nothing — starts immediately

#### Exact Tasks

1. Scaffold React app:
   ```bash
   cd /workspace
   pnpm create @iota/create-dapp frontend --template react
   cd frontend && pnpm install
   ```

2. Add extra dependencies:
   ```bash
   pnpm add react-router-dom @radix-ui/themes tailwindcss @tailwindcss/vite date-fns
   pnpm add -D @types/node
   ```

3. Create `frontend/src/types/index.ts`:
   - TypeScript interfaces matching all Move structs:
     - `GameFields`, `TicketFields`, `GlobalConfigFields`
     - `WinnerResult`, `PrizeBreakdown`, `PlayerEntry`
     - Network config types

4. Create `frontend/src/networkConfig.ts`:
   - `createNetworkConfig` with testnet + mainnet
   - Export constants: `PACKAGE_ID`, `GLOBAL_CONFIG_ID`, `ADMIN_ADDRESS` from `import.meta.env`
   - Export `RANDOM_OBJECT_ID = '0x8'`, `CLOCK_OBJECT_ID = '0x6'`
   - Placeholder values: `'0xTODO'` — to be updated by Agent 7

5. Create `frontend/src/main.tsx` with all providers:
   - `QueryClientProvider` → `IotaClientProvider` → `WalletProvider` → `App`

6. Create `frontend/src/App.tsx` with React Router:
   - Routes: `/`, `/game/:gameId`, `/game/:gameId/results`, `/history`, `/history/:gameId`, `/admin`

7. Create all 5 hooks in `frontend/src/hooks/`:
   - `useIotaPrice.ts` — CoinGecko primary, Binance fallback, 60s refetch, returns `{ priceUSD, minEntryNanos, minEntryIOTA, isLoading }`
   - `useActiveGames.ts` — query GameCreated events, fetch Game objects, filter is_active=true, 15s refetch
   - `useGame.ts` — fetch single Game object by ID, 10s refetch
   - `useAutoReveal.ts` — 10s interval, checks all active games, auto-submits reveal PTB when time reached (only runs when isAdmin=true)
   - `useIsAdmin.ts` — reads GlobalConfig.admin_address, compares with currentAccount

8. Create all 5 PTB builders in `frontend/src/transactions/`:
   - `addToPot.ts` — builds Transaction with splitCoins + moveCall, accepts optional entropy bytes
   - `revealWinners.ts` — builds Transaction with moveCall passing 0x8 + 0x6
   - `createGame.ts` — builds Transaction for admin create_game call
   - `updateTreasury.ts` — builds Transaction for admin update
   - `updateMinEntry.ts` — builds Transaction for admin update

9. Create all 4 utils in `frontend/src/utils/`:
   - `formatIOTA.ts` — NANOS to IOTA (÷1e9), formats to 4 decimal places
   - `formatAddress.ts` — `0x1234...abcd` truncation (6 chars each side)
   - `priceCalc.ts` — USD ↔ NANOS conversion given priceUSD
   - `timeUtils.ts` — countdown string, isLocked(game), isRevealTime(game), isHistory(game)

10. Create `frontend/vercel.json` (rewrites + security headers)

11. Create `frontend/.env.testnet`, `frontend/.env.mainnet`, `frontend/.env.local.example`

12. Configure Tailwind CSS in `vite.config.ts`

#### Acceptance Criteria
- `pnpm build` succeeds (no TS errors)
- All hooks export correct TypeScript types
- All PTB builders return `Transaction` objects
- networkConfig.ts uses `import.meta.env` for all IDs

---

### Agent 3: Frontend Public Pages

**Branch**: `cursor/iota-matka-pot-design-5951`
**Type**: `generalPurpose`
**Works in**: `/workspace/frontend/src/`
**Depends on**: Nothing — uses type stubs from `types/index.ts` (can define inline if Agent 2 hasn't finished)

#### Exact Tasks

1. `components/Navbar.tsx`:
   - Logo "🎰 IOTA Matka Pot" (gold, left)
   - Network badge (center)
   - `<ConnectButton />` from dapp-kit (right)
   - Navigation links: Home | History
   - Show Admin link only if isAdmin

2. `components/PotCard.tsx`:
   - Props: `game: GameFields`
   - Shows: game_id, pot in IOTA + USD, unique player count, countdown
   - Status badge: OPEN (green) / LOCKED (orange) / REVEALING (pulsing blue)
   - "Enter Pot →" button (disabled if LOCKED)

3. `components/CountdownTimer.tsx`:
   - Props: `targetMs: number, label: string`
   - Live ticking: DD:HH:MM:SS
   - Turns red when < 1 hour remaining
   - Shows "LOCKED" in orange when in lockout window

4. `components/PriceDisplay.tsx`:
   - Shows: "1 IOTA = $X.XX USD · Min entry: Y.YY IOTA (~$1.00)"
   - Pulsing green dot for live indicator
   - Uses `useIotaPrice` hook

5. `components/PlayersList.tsx`:
   - Props: `entries: address[], contributions: Record<string, number>`
   - Table: Rank | Address (truncated) | Contributed (IOTA + USD) | Draw Ticket
   - Each row shows 1 ticket badge
   - Note: "Each address = 1 draw ticket regardless of contribution"

6. `pages/HomePage.tsx`:
   - Uses `useActiveGames` hook
   - Loading skeleton while fetching
   - Empty state: "No active pots — check back soon"
   - Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
   - Live price banner at bottom using `PriceDisplay`

7. `pages/GameDetailPage.tsx`:
   - Reads `:gameId` from URL params
   - Uses `useGame(gameId)` hook
   - Left column: PotHeader + CountdownTimer + PlayersList
   - Right column: ContributionForm (from Agent 4's component — stub if needed)
   - If game.is_active=false: redirect to `/game/:gameId/results`

8. `pages/ResultsPage.tsx`:
   - Reads game from chain
   - Winners podium (1st center/tallest, 2nd left, 3rd right)
   - Treasury row with gas deduction note
   - AllEntriesTable showing all players + lucky phrase column
   - "View on IOTA Explorer" external link
   - "← Back to Home" button

9. `components/AllEntriesTable.tsx`:
   - Props: `entries: address[], contributions, revealedWinners`
   - Full table with rank, address, contribution, lucky phrase indicator, result badge

10. `components/WinnersBoard.tsx`:
    - Props: `winner1, winner2, winner3, prize1, prize2, prize3, treasuryCut, potTotal`
    - Podium layout with gold/silver/bronze cards
    - Prize amounts in IOTA + USD equivalent

11. `pages/HistoryPage.tsx`:
    - Uses `useActiveGames` (all games) filtered by `isHistory(game)`
    - Sort: revealed_at_ms descending
    - Shows `HistoryCard` for each
    - Platform stats bar at bottom

12. `components/HistoryCard.tsx`:
    - Compact horizontal layout: game_id + date | pot + players + winner summary | "View Details →"

13. `pages/HistoryDetailPage.tsx`:
    - Full breakdown: same as ResultsPage but from history context
    - Breadcrumb: "History > Pot #N"

#### Acceptance Criteria
- All pages render without runtime errors against mock/empty data
- Responsive layout works at 375px, 768px, 1280px widths
- All links and navigation work correctly
- No TypeScript errors

---

### Agent 4: Frontend Admin Panel

**Branch**: `cursor/iota-matka-pot-design-5951`
**Type**: `generalPurpose`
**Works in**: `/workspace/frontend/src/`
**Depends on**: Nothing — starts immediately

#### Exact Tasks

1. `components/AdminGuard.tsx`:
   - Uses `useIsAdmin()` hook
   - If no wallet connected: renders `<ConnectWalletPrompt />`
   - If wallet connected but not admin: renders `<AccessDenied />` with back button
   - If admin: renders `{children}`
   - Shows admin IOTA address in small text at bottom for transparency

2. `pages/AdminPage.tsx`:
   - Wrapped in `<AdminGuard>`
   - Title: "Admin Control Panel 🛡"
   - Admin stats bar (total games, treasury balance, treasury address, current min entry)
   - Two-column layout: CreateGameForm (left) | TreasurySettings + MinContributionUpdater (right)
   - RevealWatcher component at bottom (full width)

3. `components/CreateGameForm.tsx`:
   - Date/time picker for reveal date (using native `<input type="datetime-local">`)
   - Min validation: selected date must be > 24 hours from now (enforced client-side with error message)
   - Shows computed lockout time: "Entries will close at: [lockout time]"
   - Prize breakdown preview (read-only display: 50/30/10/10)
   - "CREATE POT" button → calls `createGame` transaction builder → `useSignAndExecuteTransaction`
   - Success toast with game ID + Explorer link
   - Error toast on failure

4. `components/TreasurySettings.tsx`:
   - Shows current treasury address (read from GlobalConfig)
   - Input for new address
   - Warning: "Changing this redirects all future admin cuts"
   - "UPDATE TREASURY" button → calls `updateTreasury` PTB
   - Success/error toast

5. `components/MinContributionUpdater.tsx`:
   - Shows current min contribution in IOTA + USD
   - Live price from `useIotaPrice`
   - "Sync to Live Price" button: auto-calculates 1 USD equivalent in NANOS
   - Manual IOTA input with USD display
   - "UPDATE ON-CHAIN" button → calls `updateMinEntry` PTB

6. `components/RevealWatcher.tsx`:
   - Shows status: "🤖 Auto-Reveal Watcher — ACTIVE" (green dot) if admin connected
   - List of all active games with time remaining
   - Highlights any game with < 5 min until reveal: "⚡ IMMINENT"
   - Shows "Revealing..." spinner when reveal tx is in-flight
   - Shows last reveal result: "✓ Pot #12 revealed at 15:00:43"
   - Uses `useAutoReveal` hook internally

7. `components/ContributionForm.tsx` (shared component, used in GameDetailPage):
   - Amount input in IOTA with live USD equivalent below
   - Minimum enforced: must be >= minEntryIOTA from `useIotaPrice`
   - Error: "Minimum entry is X.XX IOTA (~$1.00)"
   - Optional entropy input: "🎲 Lucky Phrase (optional)"
   - Prize preview panel (dynamic based on current player count + this contribution)
   - "ENTER POT" button → calls `addToPot` PTB → `useSignAndExecuteTransaction`
   - Disabled states: not connected / game locked / game already revealed
   - Loading state while transaction is in-flight
   - Success: "✓ Entry confirmed! Ticket sent to your wallet."

#### Acceptance Criteria
- AdminGuard correctly blocks non-admin addresses
- AdminGuard correctly shows admin panel for admin address
- CreateGameForm rejects dates < 24h in the future with clear error
- All admin transactions use `AdminCap` object ID from `networkConfig.ts`
- ContributionForm disables correctly in locked/revealed states
- All success/error states handled with toasts

---

## WAVE 2 — Agent Specifications

---

### Agent 5: Move Unit Tests + Testnet Deploy

**Branch**: `cursor/iota-matka-pot-design-5951`
**Type**: `generalPurpose`
**Works in**: `/workspace/contract/`
**Depends on**: Agent 1 must have completed and `iota move build` passes

#### Exact Tasks

1. Create `contract/tests/matka_pot_tests.move` with these 10 test cases:

   | Test Name | What It Verifies |
   |---|---|
   | `test_create_game_validates_24h_min` | Aborts if reveal < 24h from now |
   | `test_create_game_succeeds_with_valid_time` | Game created with valid future time |
   | `test_add_to_pot_below_minimum_rejected` | Aborts if contribution < min_contribution_nanos |
   | `test_add_to_pot_during_lockout_rejected` | Aborts if within 10 min of reveal |
   | `test_add_to_pot_creates_ticket` | Ticket object transferred to player |
   | `test_unique_player_deduplication` | 2 contributions from same address = 1 entry in VecSet |
   | `test_reveal_before_deadline_rejected` | Aborts if called before reveal_timestamp_ms |
   | `test_1_player_prize_distribution` | 90% to winner, 10% to treasury |
   | `test_2_player_prize_distribution` | 50%/40%/10% distribution |
   | `test_3_player_prize_distribution` | 50%/30%/10%/10% distribution |

   Use `iota::test_scenario` for all tests.
   Use `clock::create_for_testing`, `clock::set_for_testing`, `clock::destroy_for_testing`.
   Use `random::create_for_testing` for reveal tests.

2. Run tests:
   ```bash
   cd /workspace/contract
   iota move test
   ```
   All 10 must pass. Fix any failures before proceeding.

3. Deploy to testnet:
   ```bash
   iota client switch --env testnet
   iota client faucet
   iota client publish --gas-budget 100000000 2>&1 | tee deploy_output.txt
   ```

4. Parse deploy output and extract:
   - `PACKAGE_ID` — from "Published Objects / PackageID" line
   - `GLOBAL_CONFIG_ID` — from "Created Objects" where ObjectType contains "GlobalConfig"

5. Write `contract/.deployed.testnet.json`:
   ```json
   {
     "network": "testnet",
     "packageId": "0x...",
     "globalConfigId": "0x...",
     "adminAddress": "0x...",
     "deployedAt": "<ISO timestamp>",
     "txDigest": "...",
     "explorerUrl": "https://explorer.iota.org/object/0x...?network=testnet"
   }
   ```

6. Commit this file.

#### Acceptance Criteria
- `iota move test` — 10/10 passing
- `.deployed.testnet.json` exists with valid non-placeholder values
- Package visible at explorer URL

---

### Agent 6: Frontend Integration

**Branch**: `cursor/iota-matka-pot-design-5951`
**Type**: `generalPurpose`
**Works in**: `/workspace/frontend/`
**Depends on**: Agents 2, 3, 4 must all be committed

#### Exact Tasks

1. Pull all committed files from Agents 2, 3, 4

2. Install all dependencies:
   ```bash
   cd /workspace/frontend && pnpm install
   ```

3. Attempt build:
   ```bash
   pnpm build
   ```

4. Fix any TypeScript compilation errors:
   - Import path mismatches between agents
   - Missing prop types
   - Type mismatches in hook return values vs component usage
   - Missing `export` statements

5. Fix any ESLint errors:
   ```bash
   pnpm lint
   ```

6. Verify dev server starts:
   ```bash
   pnpm dev &
   sleep 5
   curl -s http://localhost:5173 | grep -q "IOTA Matka Pot" && echo "OK"
   ```

7. Check all routes resolve (no blank pages):
   - `/` — Home
   - `/game/test123` — GameDetail (empty/loading state is fine)
   - `/history` — History
   - `/admin` — AdminGuard rendered

8. Commit all fixes with message: `fix: frontend integration — resolve cross-agent type mismatches`

#### Acceptance Criteria
- `pnpm build` exits 0 with no errors
- `pnpm lint` exits 0 with no errors
- Dev server starts and home page renders
- All 6 routes resolve without crashing

---

## WAVE 3 — Agent Specification

---

### Agent 7: Wire + End-to-End Testnet Test

**Branch**: `cursor/iota-matka-pot-design-5951`
**Type**: `generalPurpose`
**Works in**: `/workspace/`
**Depends on**: Agent 5 must have written `.deployed.testnet.json`, Agent 6 build must pass

#### Exact Tasks

1. Read `contract/.deployed.testnet.json`:
   - Extract `packageId`, `globalConfigId`, `adminAddress`

2. Update `frontend/.env.testnet` with real values

3. Update `frontend/src/networkConfig.ts`:
   - Replace all `'0xTODO'` placeholders with real IDs

4. Final build verification:
   ```bash
   cd /workspace/frontend
   pnpm build
   ```

5. Run testnet smoke test sequence using IOTA CLI:
   ```bash
   # Step 1: Verify GlobalConfig exists on testnet
   iota client object <GLOBAL_CONFIG_ID>

   # Step 2: Create a test game (reveal 25h from now)
   REVEAL_TS=$(date -d '+25 hours' +%s)000
   iota client call \
     --function create_game \
     --module matka_pot \
     --package <PACKAGE_ID> \
     --args <ADMIN_CAP_ID> <GLOBAL_CONFIG_ID> 0x6 $REVEAL_TS \
     --gas-budget 10000000

   # Step 3: Add test contribution
   iota client call \
     --function add_to_pot \
     --module matka_pot \
     --package <PACKAGE_ID> \
     --args <GAME_OBJECT_ID> <COIN_OBJECT_ID> '[]' 0x6 \
     --gas-budget 10000000

   # Step 4: Verify Game object updated
   iota client object <GAME_OBJECT_ID> --json
   ```

6. Write `contract/TESTNET_SMOKE_TEST.md` with actual results:
   - Package ID (confirmed)
   - GlobalConfig ID (confirmed)
   - Test game object ID
   - All CLI outputs (trimmed)
   - IOTA Explorer links for each transaction
   - Status: PASS / FAIL for each step

7. Final commit and push:
   ```bash
   git add -A
   git commit -m "feat: wire frontend to testnet + smoke test results"
   git push
   ```

#### Acceptance Criteria
- `networkConfig.ts` has no `'0xTODO'` placeholders
- `pnpm build` still passes after wiring
- `iota client object <GLOBAL_CONFIG_ID>` returns valid JSON
- Test game creation transaction succeeds on testnet
- `TESTNET_SMOKE_TEST.md` documents all results

---

## Agent Handoff Protocol

Each agent must do before finishing:

```bash
git add -A
git commit -m "<descriptive message>"
git push origin cursor/iota-matka-pot-design-5951
```

Wave 2 agents check for Wave 1 completion by verifying these files exist:
- `contract/sources/matka_pot.move` (Agent 1)
- `frontend/src/networkConfig.ts` (Agent 2)
- `frontend/src/pages/HomePage.tsx` (Agent 3)
- `frontend/src/pages/AdminPage.tsx` (Agent 4)

Wave 3 agent checks for Wave 2 completion by verifying:
- `contract/.deployed.testnet.json` exists and `packageId` is not `"0xTBD"` (Agent 5)
- `frontend/dist/` directory exists (Agent 6 build passed)

---

## Shared Constants All Agents Must Use

```typescript
// IOTA system object addresses — hardcoded, never change
RANDOM_OBJECT_ID  = '0x8'
CLOCK_OBJECT_ID   = '0x6'

// Prize percentages (flat integers, must sum to 100)
PRIZE_1_PCT = 50   // 1st place
PRIZE_2_PCT = 30   // 2nd place
PRIZE_3_PCT = 10   // 3rd place
TREASURY_PCT = 10  // Admin treasury

// 2-player overrides
PRIZE_1_2P_PCT = 50
PRIZE_2_2P_PCT = 40

// 1-player override
PRIZE_1_1P_PCT = 90

// Timing
MIN_GAME_DURATION_MS  = 86_400_000   // 24 hours
LOCKOUT_DURATION_MS   = 600_000      // 10 minutes
HISTORY_THRESHOLD_MS  = 259_200_000  // 3 days

// Unit
IOTA_DECIMALS = 9   // 1 IOTA = 10^9 NANOS
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| `reveal_winners` randomness logic bug | Medium | High | 3 dedicated unit tests cover all prize tiers |
| `iota move test` clock manipulation fails | Low | High | Use `clock::set_for_testing` and `test_scenario::later_epoch` |
| Agent 3 uses types before Agent 2 defines them | Medium | Medium | Agent 3 defines inline interface types if needed; Agent 6 reconciles |
| Testnet faucet rate-limit | Low | Medium | Only one request needed; faucet gives 10 IOTA which covers all gas |
| `pnpm create @iota/create-dapp` template changes | Low | Low | Agent 2 locks version in `package.json` |
| IOTA fullnode RPC timeout | Low | Low | `@iota/dapp-kit` has built-in retry logic |

---

## Definition of Done

The build is complete when ALL of the following are true:

- [ ] `iota move build` — exits 0
- [ ] `iota move test` — 10/10 passing
- [ ] Contract deployed to IOTA Testnet — package ID confirmed on Explorer
- [ ] `pnpm build` — exits 0, zero TypeScript errors, zero lint errors
- [ ] `networkConfig.ts` — no placeholder `'0xTODO'` values
- [ ] All 6 routes render without crashing
- [ ] AdminGuard blocks non-admin wallets
- [ ] AdminGuard passes admin wallet
- [ ] Testnet smoke test — game creation and contribution confirmed on-chain
- [ ] All code committed and pushed to `cursor/iota-matka-pot-design-5951`
- [ ] PR updated with final status
