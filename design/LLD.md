# IOTA Matka Pot — Low Level Design (LLD)

## 1. Smart Contract Package Structure

```
matka_pot/
├── Move.toml                  # package manifest, dependencies
└── sources/
    ├── matka_pot.move         # main module: structs + all entry functions
    ├── prize.move             # prize calculation helper functions
    └── events.move            # all event struct definitions
```

---

## 2. On-Chain Object Definitions (Move Structs)

### 2.1 AdminCap
```move
/// Capability object. Whoever owns this object is the admin.
/// Transferred to the deployer's address at publish time via init().
public struct AdminCap has key, store {
    id: UID
}
```
- **Ownership**: Owned (lives in admin's wallet)
- **Created**: Once, inside `init()` at contract publish
- **Used**: Passed as `&AdminCap` to every admin-gated function
- **Cannot be**: Duplicated, forged, or transferred unless admin explicitly does so

---

### 2.2 GlobalConfig
```move
/// Singleton shared object. Stores platform-wide configuration.
public struct GlobalConfig has key {
    id: UID,
    admin_address: address,          // display only; real auth = AdminCap
    treasury_address: address,       // receives 10% of each pot
    game_counter: u64,               // monotonic, incremented per game
    min_contribution_nanos: u64      // current minimum in NANOS (~1 USD)
}
```
- **Ownership**: Shared (readable/writable by all)
- **Created**: Once, inside `init()` at contract publish
- **Address stored**: For admin: display + frontend check. For treasury: receives funds.

---

### 2.3 Game
```move
/// One game round. Created per pot by admin. Shared so any wallet can interact.
public struct Game has key {
    id: UID,
    game_id: u64,

    // Financials
    pot_balance: Balance<IOTA>,        // accumulated IOTA (NANOS)
    min_contribution_nanos: u64,       // snapshot of GlobalConfig value at creation

    // Players  
    entries: VecSet<address>,          // unique players; 1 address = 1 ticket
    contributions: Table<address, u64>,// total NANOS contributed per address

    // Entropy
    accumulated_entropy: vector<u8>,   // rolling SHA3-256 of all player phrases

    // Timing
    created_at_ms: u64,
    reveal_timestamp_ms: u64,          // must be > created_at_ms + 24h
    lockout_timestamp_ms: u64,         // = reveal_timestamp_ms - 600_000 (10 min)

    // State machine
    is_active: bool,                   // true = open for entries / awaiting reveal
    revealed_at_ms: Option<u64>,       // set when reveal_winners is called

    // Results (set at reveal, None before)
    winner_1: Option<address>,
    winner_2: Option<address>,
    winner_3: Option<address>,
    prize_1_nanos: u64,
    prize_2_nanos: u64,
    prize_3_nanos: u64,
    treasury_cut_nanos: u64
}
```
- **Ownership**: Shared (all wallets can call `add_to_pot`; any wallet can call `reveal_winners`)
- **State transitions**: `is_active: true` → (reveal) → `is_active: false`

---

### 2.4 Ticket
```move
/// Receipt NFT issued to player on each contribution. Owned by player.
public struct Ticket has key, store {
    id: UID,
    game_id: u64,
    player: address,
    amount_nanos: u64,
    contributed_at_ms: u64
}
```
- **Ownership**: Owned (lives in player's wallet)
- **Created**: One per `add_to_pot` call
- **Note**: A player who contributes twice gets two Ticket objects, but still only 1 draw slot

---

## 3. Event Structs

```move
public struct GameCreated has copy, drop {
    game_id: u64,
    reveal_timestamp_ms: u64,
    lockout_timestamp_ms: u64,
    min_contribution_nanos: u64,
    created_at_ms: u64
}

public struct TicketIssued has copy, drop {
    game_id: u64,
    player: address,
    amount_nanos: u64,
    total_pot_nanos: u64,
    player_count: u64,
    ticket_object_id: ID
}

public struct WinnersRevealed has copy, drop {
    game_id: u64,
    unique_players: u64,
    winner_1: address,
    prize_1_nanos: u64,
    winner_2: Option<address>,
    prize_2_nanos: u64,
    winner_3: Option<address>,
    prize_3_nanos: u64,
    treasury_address: address,
    treasury_cut_nanos: u64,
    revealed_at_ms: u64
}

public struct TreasuryUpdated has copy, drop {
    old_address: address,
    new_address: address
}

public struct MinContributionUpdated has copy, drop {
    old_nanos: u64,
    new_nanos: u64
}
```

---

## 4. Entry Function Specifications

### 4.1 `init` (called once at publish)
```
Visibility:  private (auto-called by IOTA at publish)
Creates:
  - AdminCap → transfer to ctx.sender()
  - GlobalConfig → share_object
    - admin_address = ctx.sender()
    - treasury_address = ctx.sender()
    - game_counter = 0
    - min_contribution_nanos = 17_200_000_000  (≈ 1 USD at deploy time)
```

---

### 4.2 `create_game`
```
Visibility:  public entry
Parameters:
  _cap:               &AdminCap
  config:             &mut GlobalConfig
  clock:              &Clock                  (0x6)
  reveal_ts:          u64                     (Unix ms)
  ctx:                &mut TxContext

Validation:
  assert!(reveal_ts > clock.timestamp_ms() + 86_400_000)  // > 24 hours

Logic:
  config.game_counter += 1
  lockout_ts = reveal_ts - 600_000             // 10 minutes before
  Create shared Game object with:
    game_id            = config.game_counter
    min_contribution   = config.min_contribution_nanos
    pot_balance        = balance::zero()
    entries            = vec_set::empty()
    contributions      = table::new()
    accumulated_entropy= vector[]
    created_at_ms      = clock.timestamp_ms()
    reveal_timestamp_ms= reveal_ts
    lockout_timestamp_ms= lockout_ts
    is_active          = true
    all results        = None / 0
  Emit GameCreated event
```

---

### 4.3 `add_to_pot`
```
Visibility:  public entry
Parameters:
  game:         &mut Game
  payment:      Coin<IOTA>
  user_entropy: Option<vector<u8>>           (optional lucky phrase bytes)
  clock:        &Clock
  ctx:          &mut TxContext

Validation:
  assert!(game.is_active)
  assert!(coin::value(&payment) >= game.min_contribution_nanos)
  assert!(clock.timestamp_ms() < game.lockout_timestamp_ms)

Logic:
  sender = ctx.sender()
  
  // Merge payment into pot
  balance::join(&mut game.pot_balance, coin::into_balance(payment))
  
  // Record player (VecSet: insert only if not already present)
  if (!vec_set::contains(&game.entries, &sender)) {
      vec_set::insert(&mut game.entries, sender)
  }
  
  // Record contribution amount
  if (table::contains(&game.contributions, sender)) {
      let existing = table::borrow_mut(&mut game.contributions, sender)
      *existing = *existing + coin_value
  } else {
      table::add(&mut game.contributions, sender, coin_value)
  }
  
  // Accumulate entropy
  if (option::is_some(&user_entropy)) {
      let bytes = option::destroy_some(user_entropy)
      let combined = vector::append(game.accumulated_entropy, bytes)
      game.accumulated_entropy = hash::sha3_256(combined)
  }
  
  // Issue Ticket NFT to player
  let ticket = Ticket {
      id: object::new(ctx),
      game_id: game.game_id,
      player: sender,
      amount_nanos: coin_value,
      contributed_at_ms: clock.timestamp_ms()
  }
  transfer::transfer(ticket, sender)
  
  Emit TicketIssued event
```

---

### 4.4 `reveal_winners` ← MOST CRITICAL FUNCTION
```
Visibility:  private entry  ← REQUIRED when using &Random (Move compiler enforces this)
Parameters:
  game:         &mut Game
  rand:         &Random                      (0x8)
  clock:        &Clock                       (0x6)
  config:       &GlobalConfig
  ctx:          &mut TxContext

Validation:
  assert!(game.is_active)
  assert!(clock.timestamp_ms() >= game.reveal_timestamp_ms)
  assert!(vec_set::size(&game.entries) >= 1)

Compute combined seed:
  tx_bytes = bcs::to_bytes(&ctx.digest())
  seed_input = vector::append(game.accumulated_entropy, tx_bytes)
  combined_seed = hash::sha3_256(seed_input)
  
  // Create generator — IOTA Random + our seed mixed in
  let mut generator = random::new_generator(rand, ctx)
  // Feed combined_seed into generator as additional entropy
  // (generator is seeded by Random object; our bytes add player influence)

unique_count = vec_set::size(&game.entries)
all_players  = vec_set::into_keys(game.entries)  // vector of unique addresses

total_pot    = balance::value(&game.pot_balance)

// Treasury always 10%
treasury_cut = total_pot / 10

// ── 1 PLAYER ──────────────────────────────────────────────────
if (unique_count == 1) {
    winner_1 = all_players[0]
    prize_1  = total_pot - treasury_cut          // 90%
    // Transfer prize_1 to winner_1
    // Transfer treasury_cut to config.treasury_address
    // Set game.winner_1, prize_1_nanos, treasury_cut_nanos
}

// ── 2 PLAYERS ─────────────────────────────────────────────────
else if (unique_count == 2) {
    idx_1    = random::generate_u64_in_range(&mut generator, 0, 1)
    winner_1 = all_players[idx_1]
    winner_2 = all_players[1 - idx_1]           // the other one
    prize_1  = total_pot / 2                     // 50%
    prize_2  = (total_pot * 40) / 100            // 40%
    // treasury_cut covers remainder
    // Transfer prizes
}

// ── 3+ PLAYERS ────────────────────────────────────────────────
else {
    // Draw winner_1
    idx_1    = random::generate_u64_in_range(&mut generator, 0, unique_count - 1)
    winner_1 = all_players[idx_1]
    vector::remove(&mut all_players, idx_1)      // remove before next draw

    // Draw winner_2 from remaining
    idx_2    = random::generate_u64_in_range(&mut generator, 0, unique_count - 2)
    winner_2 = all_players[idx_2]
    vector::remove(&mut all_players, idx_2)

    // Draw winner_3 from remaining
    idx_3    = random::generate_u64_in_range(&mut generator, 0, unique_count - 3)
    winner_3 = all_players[idx_3]

    prize_1  = total_pot / 2                     // 50%
    prize_2  = (total_pot * 30) / 100            // 30%
    prize_3  = total_pot / 10                    // 10%
    // treasury_cut = 10% (set above)
    // Transfer all prizes
}

// Push transfers (IOTA coin objects to each winner)
transfer::public_transfer(coin::from_balance(prize_balance_1, ctx), winner_1)
transfer::public_transfer(coin::from_balance(prize_balance_2, ctx), winner_2)  // if exists
transfer::public_transfer(coin::from_balance(prize_balance_3, ctx), winner_3)  // if exists
transfer::public_transfer(coin::from_balance(treasury_balance, ctx), config.treasury_address)

// Update game state
game.is_active       = false
game.revealed_at_ms  = option::some(clock.timestamp_ms())
game.winner_1        = option::some(winner_1)
// ... etc

Emit WinnersRevealed event
```

> **Gas note**: The admin wallet submits this transaction and pays gas upfront.
> Net treasury = 10% of pot minus gas cost (NANOS). For a 1,000 IOTA pot that is
> ~100 IOTA to treasury; typical gas is < 0.01 IOTA — negligible.

---

### 4.5 `update_treasury_address`
```
Visibility:  public entry
Parameters:  _cap: &AdminCap, config: &mut GlobalConfig, new_addr: address
Logic:       config.treasury_address = new_addr
             Emit TreasuryUpdated
```

### 4.6 `update_min_contribution`
```
Visibility:  public entry
Parameters:  _cap: &AdminCap, config: &mut GlobalConfig, new_min: u64
Logic:       config.min_contribution_nanos = new_min
             Emit MinContributionUpdated
```

---

## 5. Frontend Component Architecture

### 5.1 File Structure
```
frontend/
├── src/
│   ├── main.tsx                    # app entry, providers
│   ├── App.tsx                     # router
│   ├── networkConfig.ts            # package IDs, object IDs, constants
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── GameDetailPage.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── HistoryDetailPage.tsx
│   │   └── AdminPage.tsx
│   │
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── PotCard.tsx             # home page card
│   │   ├── CountdownTimer.tsx      # live countdown hook
│   │   ├── ContributionForm.tsx    # amount + entropy input
│   │   ├── PriceDisplay.tsx        # live IOTA/USD ticker
│   │   ├── PlayersList.tsx         # table of contributors
│   │   ├── WinnersBoard.tsx        # podium display
│   │   ├── AllEntriesTable.tsx     # full entry list
│   │   ├── AdminGuard.tsx          # blocks non-admin access
│   │   └── RevealWatcher.tsx       # auto-reveal polling logic
│   │
│   ├── hooks/
│   │   ├── useIotaPrice.ts         # CoinGecko price feed
│   │   ├── useActiveGames.ts       # query all active Game objects
│   │   ├── useGame.ts              # query single Game object
│   │   ├── useAutoReveal.ts        # 10s polling + reveal trigger
│   │   └── useIsAdmin.ts          # checks wallet vs GlobalConfig.admin_address
│   │
│   ├── transactions/
│   │   ├── addToPot.ts             # builds add_to_pot PTB
│   │   ├── revealWinners.ts        # builds reveal_winners PTB
│   │   ├── createGame.ts           # builds create_game PTB (admin)
│   │   ├── updateTreasury.ts       # builds update_treasury_address PTB
│   │   └── updateMinEntry.ts       # builds update_min_contribution PTB
│   │
│   └── utils/
│       ├── formatIOTA.ts           # NANOS → IOTA display
│       ├── formatAddress.ts        # 0x1234...abcd truncation
│       ├── priceCalc.ts            # USD ↔ NANOS conversion
│       └── timeUtils.ts            # countdown, lockout checks
```

---

### 5.2 Key Hook Implementations (Logic Only — No Code)

#### `useIotaPrice`
- Fetches `https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd`
- Falls back to Binance: `https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT`
- Refetches every 60 seconds via `@tanstack/react-query` `refetchInterval`
- Returns `{ priceUSD, minEntryNanos, minEntryIOTA, lastUpdated }`

#### `useActiveGames`
- Queries `GameCreated` events to get all game object IDs
- Bulk-fetches each Game object using `getObject` with `showContent: true`
- Filters: `is_active == true`
- Sorts: by `reveal_timestamp_ms` ascending
- Refetches every 15 seconds

#### `useAutoReveal`
- Runs only when admin wallet is connected (`useIsAdmin` returns true)
- Every 10 seconds checks: `Date.now() >= game.reveal_timestamp_ms && game.is_active`
- When condition met: calls `signAndExecuteTransaction(buildRevealPTB(gameId))`
- Shows "Revealing…" toast; handles success/failure gracefully
- After success: invalidates game query cache (triggers UI refresh)

#### `useIsAdmin`
- Reads `GlobalConfig.admin_address` field from on-chain object
- Compares with `useCurrentAccount().address`
- Returns `{ isAdmin: boolean, adminAddress: string }`

---

### 5.3 PTB (Programmable Transaction Block) Structures

#### addToPot PTB
```typescript
const tx = new Transaction();
// optional: encode user entropy as bytes
const entropyArg = userPhrase
    ? tx.pure(bcs.vector(bcs.u8()).serialize(encodeUTF8(userPhrase)))
    : tx.pure(bcs.option(bcs.vector(bcs.u8())).serialize(null));

const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountNanos)]);
tx.moveCall({
    target: `${PACKAGE_ID}::matka_pot::add_to_pot`,
    arguments: [
        tx.object(GAME_OBJECT_ID),
        coin,
        entropyArg,
        tx.object('0x6'),           // Clock
    ],
});
```

#### revealWinners PTB
```typescript
const tx = new Transaction();
tx.moveCall({
    target: `${PACKAGE_ID}::matka_pot::reveal_winners`,
    arguments: [
        tx.object(GAME_OBJECT_ID),
        tx.object('0x8'),           // Random
        tx.object('0x6'),           // Clock
        tx.object(GLOBAL_CONFIG_ID),
    ],
});
```

---

## 6. State Machine — Game Lifecycle

```
                    create_game()
                        │
                        ▼
              ┌─────────────────┐
              │   OPEN          │  is_active=true
              │                 │  clock < lockout_ts
              └────────┬────────┘
                       │ add_to_pot() (multiple)
                       │
              ┌─────────────────┐
              │   LOCKED        │  is_active=true
              │                 │  lockout_ts ≤ clock < reveal_ts
              └────────┬────────┘
                       │ (auto-reveal fires)
                       │
              ┌─────────────────┐
              │   REVEALING     │  reveal_winners() executing
              └────────┬────────┘
                       │
              ┌─────────────────┐
              │   REVEALED      │  is_active=false
              │                 │  winners set, prizes pushed
              └────────┬────────┘
                       │ 3 days pass
                       │
              ┌─────────────────┐
              │   HISTORY       │  Frontend filters to /history
              └─────────────────┘
```

---

## 7. Data Flow — Prize Distribution (3+ players example)

```
Total Pot = 1,240 IOTA (1,240,000,000,000 NANOS)

Step 1: Treasury cut
  treasury_cut = 1,240 * 10% = 124 IOTA

Step 2: Prize pool = 1,240 - 124 = 1,116 IOTA

Step 3: Distribution from gross pot
  prize_1 = 1,240 * 50% = 620 IOTA  →  winner_1 wallet
  prize_2 = 1,240 * 30% = 372 IOTA  →  winner_2 wallet
  prize_3 = 1,240 * 10% = 124 IOTA  →  winner_3 wallet
  treasury = 1,240 * 10% = 124 IOTA →  treasury_address
  ─────────────────────────────────────
  Total distributed = 1,240 IOTA  ✓ (100%)

Step 4: Treasury net
  Gas cost ≈ 0.003 IOTA (typical Move tx)
  Net treasury = 124 - 0.003 = 123.997 IOTA
```

---

## 8. Timing Constants

| Constant | Value | Where Enforced |
|---|---|---|
| Minimum game duration | 86,400,000 ms (24 hours) | Smart contract `create_game` |
| Lockout before reveal | 600,000 ms (10 minutes) | Smart contract `add_to_pot` |
| Auto-reveal poll interval | 10,000 ms (10 seconds) | Frontend `useAutoReveal` hook |
| Price feed refresh | 60,000 ms (60 seconds) | Frontend `useIotaPrice` hook |
| Active games refresh | 15,000 ms (15 seconds) | Frontend `useActiveGames` hook |
| History threshold | 259,200,000 ms (3 days) | Frontend filter logic |
| Min contribution | ~17.18 IOTA (≈ 1 USD) | Smart contract + frontend |
