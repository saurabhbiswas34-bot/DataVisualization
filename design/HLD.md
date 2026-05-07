# IOTA Matka Pot — High Level Design (HLD)

## 1. Overview

IOTA Matka Pot is a decentralised lottery ("pot") application built on the IOTA Layer-1 blockchain using the Move smart contract language. Players contribute IOTA tokens into a shared pot. When the pot's reveal date arrives, the admin's connected frontend automatically triggers a provably-fair on-chain draw. Winners receive prizes pushed directly to their wallets. All game data lives permanently on-chain — no server, no database, no custodian.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                     │
│   React Frontend (TypeScript + Vite)                                │
│   ┌────────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│   │  Home Page     │  │ Game Detail    │  │  Admin Panel         │ │
│   │  (Pot Grid)    │  │ (Contribute)   │  │  (Create/Settings)   │ │
│   └────────────────┘  └────────────────┘  └──────────────────────┘ │
│   ┌────────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│   │  Results Page  │  │  History Page  │  │  Mobile Views        │ │
│   └────────────────┘  └────────────────┘  └──────────────────────┘ │
│                                                                     │
│   @iota/dapp-kit  │  @iota/iota-sdk  │  @tanstack/react-query      │
└─────────────────────────────────────────────────────────────────────┘
                │  JSON-RPC / WebSocket
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    IOTA NETWORK (Layer 1)                           │
│                                                                     │
│   Move Smart Contract Package                                       │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐ │
│   │ AdminCap   │  │GlobalConfig│  │   Game     │  │   Ticket    │ │
│   │ (Owned)    │  │ (Shared)   │  │ (Shared)   │  │  (Owned)    │ │
│   └────────────┘  └────────────┘  └────────────┘  └─────────────┘ │
│                                                                     │
│   System Singletons:  Random (0x8)  │  Clock (0x6)                 │
└─────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES (read-only, no trust)               │
│                                                                     │
│   CoinGecko API (IOTA price feed — frontend only, no key needed)   │
│   Binance API   (fallback price feed)                               │
│   IOTA Explorer (block explorer, independent verification)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Actors

| Actor | Description | Identifies As |
|---|---|---|
| **Admin** | The deployer/owner of the contract. Creates games, sets treasury address, monitors auto-reveal. Never contributes to pots. | Wallet holding `AdminCap` object |
| **Player** | Any IOTA wallet holder. Can contribute to active pots, receive prizes, view history. | Any connected wallet |
| **System (Blockchain)** | IOTA Move VM executing contract logic. Provides randomness (0x8) and time (0x6). | Validators / consensus |
| **Frontend Watcher** | The admin's browser tab polling for games ready to reveal. | Admin-connected React app |

---

## 4. Core Concepts

### 4.1 Pot (Game)
A single round of the lottery. Created by admin with a future reveal date (minimum 24 hours away). Accepts player contributions until 10 minutes before reveal time ("lockout"). At reveal time, winners are drawn randomly and prizes are pushed to their wallets.

### 4.2 Ticket
An on-chain NFT-like object issued to a player when they contribute. Serves as a receipt. Regardless of contribution amount, each unique address holds exactly one draw slot.

### 4.3 Randomness
IOTA provides `iota::random::Random` (address `0x8`) — a system-maintained shared object fed by validator consensus. The contract also collects optional "lucky phrases" from players, hashes them together into an `accumulated_entropy` byte string, and mixes this with the on-chain random seed at reveal time. This makes the draw collectively influenced by all participants.

### 4.4 Auto-Reveal
The blockchain cannot self-execute transactions. The admin's connected frontend polls every 10 seconds. When `clock.timestamp_ms() >= game.reveal_timestamp_ms`, it automatically builds and submits the `reveal_winners` transaction. The gas cost is deducted from the treasury's 10% cut.

---

## 5. Prize Distribution

| Players in Pot | 1st Place | 2nd Place | 3rd Place | Treasury |
|---|---|---|---|---|
| 1 unique player | 90% | — | — | 10% |
| 2 unique players | 50% | 40% | — | 10% |
| 3 or more | 50% | 30% | 10% | 10% |

- Treasury cut is always exactly 10% of gross pot
- Gas cost for `reveal_winners` is deducted from the treasury's share
- Admin never contributes — earns only through the 10% treasury cut
- Each unique address = exactly 1 draw ticket, regardless of contribution amount

---

## 6. Page Map

| Route | Page | Access |
|---|---|---|
| `/` | Home — active pots grid | Public |
| `/game/:id` | Game Detail — contribute, countdown, players | Public |
| `/game/:id/results` | Results — winners, entry list | Public |
| `/history` | History — pots older than 3 days | Public |
| `/history/:id` | History Detail — full breakdown | Public |
| `/admin` | Admin Panel | Admin wallet only |

---

## 7. Screen Mockups

### Home Page — Multiple Active Pots
![Home Page](images/mockup_home_page.png)

### Game Detail — Contribute & Countdown
![Game Detail](images/mockup_game_detail.png)

### Admin Panel — Create Pot & Settings
![Admin Panel](images/mockup_admin_panel.png)

### Results Page — Winners Board
![Results](images/mockup_results_page.png)

### History Page — Past Pots
![History](images/mockup_history_page.png)

### End-to-End Workflow
![Workflow](images/mockup_workflow_diagram.png)

### Mobile Views
![Mobile](images/mockup_mobile_views.png)

---

## 8. Non-Functional Requirements

| Requirement | Approach |
|---|---|
| **Decentralisation** | All game state on-chain. No backend server. No database. |
| **Fairness** | Provably random via IOTA's `Random` (0x8) + player entropy |
| **Transparency** | All draws, contributions, and winners are public on-chain events |
| **Immutability** | History data lives forever in IOTA blockchain objects |
| **Minimum entry** | 1 USD equivalent in IOTA at time of entry (live price feed) |
| **Minimum game duration** | 24 hours (enforced on-chain in `create_game`) |
| **Lockout** | No entries accepted in last 10 minutes before reveal |
| **Mobile responsive** | Tailwind CSS responsive grid, tested on 375px+ viewports |

---

## 9. Technology Stack Summary

| Layer | Technology |
|---|---|
| Smart Contract | IOTA Move (L1) |
| Frontend Framework | React 18 + TypeScript + Vite |
| Blockchain SDK | `@iota/dapp-kit` + `@iota/iota-sdk` |
| Data Fetching | `@tanstack/react-query` |
| UI Components | Radix UI + Tailwind CSS |
| Wallet Support | IOTA Wallet, Nightly, Cosmostation (via dapp-kit) |
| Price Feed | CoinGecko API (primary) + Binance API (fallback) |
| Explorer Link | https://explorer.iota.org |
| Deployment | IOTA Testnet → Mainnet |
