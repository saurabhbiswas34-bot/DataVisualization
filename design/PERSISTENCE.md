# IOTA Matka Pot — Data Persistence & Storage Design

## The Core Answer

> **There is no traditional database, no backend server, and no file storage.**
>
> Every piece of data — game state, player contributions, winner results, addresses, prize amounts — is stored permanently as **on-chain objects** on the IOTA blockchain. The blockchain IS the database.

---

## 1. What "On-Chain Storage" Means

In IOTA's object model, every piece of data is an **object** with:
- A globally unique ID (32 bytes)
- An owner (wallet address, shared, or immutable)
- A version number (increments on every mutation)
- A content payload (the actual struct fields)

Objects are stored across the distributed IOTA validator network. They cannot be deleted without explicit on-chain transactions. They are readable by anyone.

```
Traditional App:            IOTA Matka Pot:
┌─────────────────┐         ┌───────────────────────────────┐
│ React Frontend  │         │ React Frontend                │
└────────┬────────┘         └──────────────┬────────────────┘
         │ REST/GraphQL                     │ JSON-RPC / dapp-kit
         ▼                                 ▼
┌─────────────────┐         ┌───────────────────────────────┐
│ Backend Server  │         │ IOTA Validator Network        │
└────────┬────────┘         │  (Distributed — no single     │
         │ SQL/ORM           │   point of failure)           │
         ▼                  └──────────────┬────────────────┘
┌─────────────────┐                        │
│ Database        │         ┌──────────────▼────────────────┐
│ (Postgres etc.) │         │ On-Chain Objects (permanent)  │
└─────────────────┘         │  GlobalConfig, Game, Ticket   │
                            └───────────────────────────────┘
```

---

## 2. Data Map: Every Field and Where It Lives

### 2.1 Platform Configuration Data
**Stored in: `GlobalConfig` object (Shared Object — one copy, lives forever)**

| Field | Type | What it holds |
|---|---|---|
| `admin_address` | `address` | IOTA address of the admin wallet |
| `treasury_address` | `address` | IOTA address where 10% cuts are sent |
| `game_counter` | `u64` | Total number of games ever created |
| `min_contribution_nanos` | `u64` | Current minimum entry amount in NANOS |

- **Object ID**: Fixed at contract deploy time, stored in `networkConfig.ts`
- **Mutability**: Only admin can mutate via `update_treasury_address` and `update_min_contribution`
- **Lifetime**: Permanent — exists as long as the IOTA network exists

---

### 2.2 Game / Pot Data
**Stored in: `Game` object (Shared Object — one per pot)**

| Field | Type | What it holds |
|---|---|---|
| `game_id` | `u64` | Sequential game number |
| `pot_balance` | `Balance<IOTA>` | All contributed IOTA (in NANOS) locked here |
| `min_contribution_nanos` | `u64` | Minimum entry (snapshot at creation) |
| `entries` | `VecSet<address>` | All unique player addresses (1 ticket each) |
| `contributions` | `Table<address, u64>` | How much each address contributed total |
| `accumulated_entropy` | `vector<u8>` | Rolling SHA3-256 of all player phrases |
| `created_at_ms` | `u64` | Unix timestamp when game was created |
| `reveal_timestamp_ms` | `u64` | Unix timestamp when pot will be revealed |
| `lockout_timestamp_ms` | `u64` | Unix timestamp when entries close (10 min early) |
| `is_active` | `bool` | true = open/awaiting reveal; false = finished |
| `revealed_at_ms` | `Option<u64>` | When reveal actually happened (None until then) |
| `winner_1` | `Option<address>` | 1st place winner address |
| `winner_2` | `Option<address>` | 2nd place winner address (None for 1-player games) |
| `winner_3` | `Option<address>` | 3rd place winner address (None for <3 player games) |
| `prize_1_nanos` | `u64` | Amount paid to winner 1 |
| `prize_2_nanos` | `u64` | Amount paid to winner 2 |
| `prize_3_nanos` | `u64` | Amount paid to winner 3 |
| `treasury_cut_nanos` | `u64` | Amount sent to treasury |

- **Object IDs**: Discoverable by querying `GameCreated` events (stored in the event index)
- **Mutability**: Players mutate `pot_balance`, `entries`, `contributions`, `accumulated_entropy` via `add_to_pot`. Contract mutates winners/prizes at reveal. Admin cannot directly edit game data.
- **Lifetime**: Permanent — game data never disappears from the chain

---

### 2.3 Player Contribution Receipt
**Stored in: `Ticket` object (Owned Object — one per contribution, lives in player's wallet)**

| Field | Type | What it holds |
|---|---|---|
| `game_id` | `u64` | Which game this ticket is for |
| `player` | `address` | The contributing wallet address |
| `amount_nanos` | `u64` | How much IOTA was contributed in this entry |
| `contributed_at_ms` | `u64` | When this contribution was made |

- **Where it lives**: In the player's own wallet (owned object)
- **How to find it**: `getOwnedObjects(wallet_address, filter: Ticket type)`
- **Note**: A player who contributes 3 times has 3 Ticket objects but still only 1 draw slot
- **Lifetime**: Permanent in player's wallet unless they explicitly destroy it

---

### 2.4 Event Log (Read-Only Queryable Index)
**Stored in: IOTA event store (append-only, queryable via JSON-RPC)**

Events are emitted by the contract and indexed by the IOTA network. They are NOT objects — they are immutable log entries.

| Event | When Emitted | Fields |
|---|---|---|
| `GameCreated` | On `create_game()` | game_id, reveal_ts, lockout_ts, min_contribution, created_at_ms |
| `TicketIssued` | On every `add_to_pot()` | game_id, player, amount_nanos, total_pot_nanos, player_count |
| `WinnersRevealed` | On `reveal_winners()` | All winner addresses, all prize amounts, treasury info, timestamp |
| `TreasuryUpdated` | On treasury change | old/new address |
| `MinContributionUpdated` | On min update | old/new NANOS value |

**Why events matter for the frontend:**
- The frontend discovers all game object IDs by querying `GameCreated` events
- The frontend builds the history page from `WinnersRevealed` events
- Events provide a fast indexed log — much faster than scanning all objects

---

### 2.5 Frontend State (NOT persistent — session only)

| Data | Where | Lifetime |
|---|---|---|
| Connected wallet address | Browser memory (dapp-kit) | Until tab closes or disconnects |
| Current IOTA price (USD) | React state / react-query cache | 60 second TTL, re-fetched |
| Fetched game objects | react-query cache | 15 second TTL, re-fetched |
| Form inputs (amount, phrase) | React component state | Until form submission or navigation |
| Active tab / current route | React Router | Until navigation |

Nothing in the frontend is saved to disk, localStorage, or any server. Every page refresh re-fetches all data from the blockchain. This is correct and intentional.

---

## 3. Where Each Type of Information Is Stored

### "Where are all the game results stored?"
```
Game object on-chain:
  game.winner_1          → address of 1st place winner
  game.prize_1_nanos     → how much they won
  game.winner_2          → 2nd place
  game.winner_3          → 3rd place
  game.revealed_at_ms    → when the draw happened
  game.treasury_cut_nanos→ how much went to admin

WinnersRevealed event (also indexed):
  → Same data, but accessible via event query API without fetching the full object
```

### "Where are all participant addresses stored?"
```
Game object on-chain:
  game.entries           → VecSet<address> of ALL unique participants
  game.contributions     → Table<address, u64> of each address's total contribution

Ticket objects in player wallets:
  → Each player's wallet contains Ticket NFTs for each game they entered
  → Player can query their own Tickets to see their history

TicketIssued events (event log):
  → Every single contribution is logged as an event with player address + amount
  → Queryable: "show me all contributions to game #12" → scan TicketIssued events
```

### "Where is the pot balance / money stored?"
```
Game object on-chain:
  game.pot_balance: Balance<IOTA>
  
  This is a Balance<IOTA> type — actual IOTA tokens locked inside the Game object.
  Not a number in a database. Real IOTA. Held by the shared Game object.
  
  At reveal: Balance is split and transferred as Coin<IOTA> objects to winner wallets.
  After reveal: game.pot_balance = 0 (all distributed)
```

### "Where is the entropy / lucky phrases stored?"
```
Game object on-chain:
  game.accumulated_entropy: vector<u8>
  
  This is a rolling SHA3-256 hash of all submitted phrases.
  Individual phrases are NOT stored raw — only the accumulated hash.
  Individual phrases ARE visible in TicketIssued events (emitted with contribution).
  
  At reveal: accumulated_entropy is mixed with tx_digest + Random(0x8)
```

---

## 4. Data Lifecycle Diagram

```
                        DEPLOY
                           │
                  GlobalConfig created
                  (on-chain, permanent)
                           │
                           │
                    CREATE GAME
                           │
              Game object created (on-chain)
              GameCreated event emitted
                           │
                           │
             PLAYER CONTRIBUTES (×N)
                           │
              ┌────────────┼────────────────┐
              │            │                │
              ▼            ▼                ▼
      Game.entries    Game.contributions  Ticket object
      updated         updated             → player wallet
      (on-chain)      (on-chain)          (on-chain, owned)
              │
              ▼
      Game.accumulated_entropy updated
      TicketIssued event emitted
              │
              │
           REVEAL
              │
              ▼
      Game.winner_1/2/3 set
      Game.prize_*_nanos set
      Game.is_active = false
      Game.revealed_at_ms set
      Coin<IOTA> objects pushed to winner wallets
      WinnersRevealed event emitted
              │
              │
          3 DAYS LATER (frontend filter only)
              │
              ▼
      Game object still on-chain (unchanged)
      Frontend /history page shows it (filter logic only)
              │
              │
          FOREVER
              │
              ▼
      Game object permanently on IOTA blockchain
      Viewable on IOTA Explorer by anyone
      Auditable by anyone, any time
```

---

## 5. How the Frontend Reconstructs Each Page from Chain Data

### Home Page (Active Pots)
```
1. Query all GameCreated events → get list of game object IDs
2. For each ID: fetch Game object (getObject with showContent: true)
3. Filter: game.is_active == true
4. Sort: by reveal_timestamp_ms ascending
5. Render PotCard for each
```

### Game Detail Page
```
1. Fetch Game object by ID from URL params
2. Read: pot_balance, entries, contributions, reveal_ts, lockout_ts, is_active
3. Derive: countdown, lockout state, prize preview
4. Fetch live IOTA price → show USD equivalent
5. List players: iterate game.entries, join with game.contributions
```

### Results Page
```
1. Fetch Game object by ID
2. Read: winner_1/2/3, prize amounts, treasury_cut, revealed_at_ms
3. Read: entries + contributions for "All Entries" table
4. (Optional): fetch WinnersRevealed event for transaction hash → explorer link
```

### History Page
```
1. Query all GameCreated events → get all game IDs (not just active)
2. Fetch all Game objects
3. Filter: is_active == false AND revealed_at_ms + 3 days < Date.now()
4. Sort: by revealed_at_ms descending (most recent first)
5. Render HistoryCard for each
```

### Admin Panel
```
1. Fetch GlobalConfig object → read treasury_address, min_contribution_nanos
2. Fetch all active Game objects → show in auto-reveal watcher
3. Fetch live IOTA price → suggest new min_contribution_nanos
```

---

## 6. Data Permanence and Auditability

| Data | Permanent? | Who Can Read? | Deletable? |
|---|---|---|---|
| Game object state | ✅ Yes, forever | Anyone | ❌ No |
| Winner addresses | ✅ Yes, forever | Anyone | ❌ No |
| Player contributions | ✅ Yes, forever | Anyone | ❌ No |
| Pot balance history | ✅ Yes, forever | Anyone | ❌ No |
| All events (log) | ✅ Yes, forever | Anyone | ❌ No |
| Ticket NFTs | ✅ Yes, until owner burns | Ticket owner + public | Only by owner explicitly |
| Frontend UI state | ❌ Session only | Local browser | On tab close |
| IOTA price cache | ❌ 60s TTL | Local browser | On refresh |

**The blockchain provides a permanent, public, tamper-proof audit trail of every game, every player, every contribution, and every winner — with no ability for the admin, the developer, or anyone to alter historical records.**
