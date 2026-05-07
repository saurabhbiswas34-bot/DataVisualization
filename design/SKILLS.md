# IOTA Matka Pot — Skills & Knowledge Reference

This document maps every technology, concept, and skill required to build, deploy, and maintain the IOTA Matka Pot application. Use it as a hiring guide, a learning checklist, or an onboarding reference for new contributors.

---

## Skill Tiers

```
🔴 CRITICAL    — Must know before writing any code. Blocking if missing.
🟡 IMPORTANT   — Required for specific components. Learnable during build.
🟢 HELPFUL     — Improves quality. Not blocking if missing.
```

---

## 1. Blockchain / IOTA Fundamentals

| Skill | Tier | Used Where |
|---|---|---|
| IOTA object model (owned vs shared vs immutable objects) | 🔴 | Game object, AdminCap, Ticket |
| IOTA address format (0x + 64 hex chars) | 🔴 | All address fields, treasury, winners |
| IOTA coin units: IOTA vs NANOS (1 IOTA = 10^9 NANOS) | 🔴 | All prize calculations, min contribution |
| Transaction anatomy (sender, gas, gas budget, digest) | 🔴 | All contract calls |
| Programmable Transaction Blocks (PTBs) | 🔴 | All frontend transaction builders |
| IOTA Testnet vs Mainnet (separate networks, separate IDs) | 🔴 | Deployment, networkConfig.ts |
| Gas pricing on IOTA (NANOS per gas unit) | 🟡 | Gas deduction from treasury logic |
| IOTA Explorer (explorer.iota.org) | 🟡 | Transaction verification, debugging |
| Epoch and checkpoint concepts | 🟡 | Clock accuracy understanding |
| IOTA Testnet faucet | 🟢 | Getting test tokens |

**Learning Resources**:
- https://docs.iota.org/developer/getting-started/
- https://docs.iota.org/developer/iota-101/objects/object-model
- https://docs.iota.org/developer/iota-101/transactions/

---

## 2. Move Programming Language (IOTA Move)

| Skill | Tier | Used Where |
|---|---|---|
| Move module and struct declaration | 🔴 | All contract files |
| `has key` ability — objects with UIDs | 🔴 | AdminCap, GlobalConfig, Game, Ticket |
| `has store` ability — storable types | 🔴 | AdminCap, Ticket (transferable) |
| `has copy, drop` ability — value types | 🔴 | All event structs |
| `UID` and `object::new(ctx)` | 🔴 | Creating all objects |
| `transfer::transfer` and `transfer::share_object` | 🔴 | init(), distribute prizes |
| `transfer::public_transfer` | 🔴 | Push prizes to winner wallets |
| `iota::coin::Coin<T>` and `iota::balance::Balance<T>` | 🔴 | Pot balance, prize distribution |
| `coin::into_balance`, `balance::join`, `coin::from_balance` | 🔴 | Merging contributions, splitting prizes |
| `iota::tx_context::TxContext` — sender, digest | 🔴 | ctx.sender(), ctx.digest() |
| Entry functions (`entry` vs `public entry`) | 🔴 | Admin functions vs reveal_winners |
| Module `init` function (runs once at publish) | 🔴 | AdminCap + GlobalConfig creation |
| `iota::event::emit` | 🔴 | All 5 event types |
| `assert!` for validation | 🔴 | All guard conditions |
| `iota::vec_set::VecSet<K>` | 🔴 | Unique player tracking |
| `iota::table::Table<K,V>` | 🔴 | Contributions per address |
| `std::option::Option<T>` | 🔴 | Optional winners, revealed_at_ms |
| `std::vector` operations (push, remove, index) | 🔴 | Winner candidate pool |
| `iota::random::Random` and `random::new_generator` | 🔴 | reveal_winners random draw |
| `random::generate_u64_in_range` | 🔴 | Picking winner indices |
| `iota::clock::Clock` and `clock::timestamp_ms` | 🔴 | All time validations |
| `iota::hash::sha3_256` | 🟡 | Entropy accumulation |
| `std::bcs::to_bytes` | 🟡 | Serialising tx digest for entropy |
| Move integer arithmetic (overflow safety) | 🟡 | Prize percentage calculations |
| Move unit testing with `iota::test_scenario` | 🟡 | Agent 5 — 10 unit tests |
| `clock::create_for_testing`, `set_for_testing` | 🟡 | Time-sensitive unit tests |
| `random::create_for_testing` | 🟡 | Randomness unit tests |
| Move package structure (Move.toml, sources/, tests/) | 🟡 | Project layout |
| Private entry function restriction with Random | 🔴 | reveal_winners — compiler enforced |
| Move PTB composition attack surface | 🟡 | Security of reveal_winners |

**Learning Resources**:
- https://docs.iota.org/developer/iota-101/move-overview/
- https://docs.iota.org/developer/advanced/onchain-randomness
- https://docs.iota.org/developer/iota-101/access-time
- https://docs.iota.org/developer/iota-101/move-overview/patterns/capabilities

---

## 3. IOTA CLI

| Skill | Tier | Used Where |
|---|---|---|
| `iota client new-address` | 🔴 | Admin wallet setup |
| `iota client switch --env testnet` | 🔴 | Network switching |
| `iota client faucet` | 🔴 | Getting testnet IOTA |
| `iota client balance` | 🟡 | Verifying gas balance |
| `iota client active-address` | 🟡 | Confirming active wallet |
| `iota move build` | 🔴 | Contract compilation |
| `iota move test` | 🔴 | Running unit tests |
| `iota client publish` | 🔴 | Deploying contract to testnet |
| `iota client object <ID>` | 🟡 | Inspecting on-chain objects |
| `iota client call` | 🟡 | CLI-based contract calls (smoke tests) |
| Parsing publish output (PackageID, Created Objects) | 🔴 | Extracting IDs after deploy |

**Learning Resources**:
- https://docs.iota.org/developer/references/cli

---

## 4. TypeScript / JavaScript

| Skill | Tier | Used Where |
|---|---|---|
| TypeScript interfaces and types | 🔴 | types/index.ts, all component props |
| React 18 functional components + hooks | 🔴 | All 13+ components |
| `useState`, `useEffect`, `useRef`, `useCallback` | 🔴 | Countdown timer, polling, form state |
| `useContext` | 🟡 | Shared state (if needed) |
| React Router DOM v6 (createBrowserRouter, useParams) | 🔴 | All page routing |
| `@tanstack/react-query` (`useQuery`, `useQueryClient`) | 🔴 | All blockchain data fetching |
| `async/await` and `Promise.all` | 🔴 | Parallel game object fetching |
| `fetch` API with error handling and fallback | 🔴 | Price feed (CoinGecko + Binance) |
| `TextEncoder` / UTF-8 encoding | 🟡 | Encoding user entropy phrase to bytes |
| `Date.now()`, `setInterval`, `clearInterval` | 🔴 | Auto-reveal polling, countdown |
| `BigInt` for NANOS (numbers > Number.MAX_SAFE_INTEGER) | 🟡 | Large IOTA amounts in NANOS |
| `import.meta.env` (Vite environment variables) | 🔴 | networkConfig.ts |
| ES modules (`import`/`export`) | 🔴 | All files |
| Array methods (filter, sort, map, find) | 🔴 | Game filtering, player sorting |

---

## 5. IOTA dApp Kit & SDK

| Skill | Tier | Used Where |
|---|---|---|
| `@iota/dapp-kit` setup (QueryClientProvider, IotaClientProvider, WalletProvider) | 🔴 | main.tsx providers |
| `createNetworkConfig` + `getFullnodeUrl` | 🔴 | networkConfig.ts |
| `<ConnectButton />` component | 🔴 | Navbar wallet connect |
| `useCurrentAccount()` — get connected wallet address | 🔴 | AdminGuard, isAdmin check |
| `useSignAndExecuteTransaction()` — submit PTBs | 🔴 | All 5 transaction actions |
| `useIotaClientQuery('getObject', ...)` — read on-chain objects | 🔴 | useGame, useIsAdmin hooks |
| `useIotaClientQuery('queryEvents', ...)` — read event log | 🔴 | useActiveGames hook |
| `Transaction` class from `@iota/iota-sdk/transactions` | 🔴 | All 5 PTB builders |
| `tx.moveCall`, `tx.splitCoins`, `tx.object`, `tx.pure` | 🔴 | PTB construction |
| `tx.pure.u64`, `bcs.vector(bcs.u8())` — BCS encoding | 🔴 | addToPot entropy bytes |
| `@iota/dapp-kit/dist/index.css` — dapp-kit styles | 🟡 | main.tsx import |
| Wallet adapter concept (dapp-kit abstracts all wallets) | 🟡 | Understanding multi-wallet support |
| IOTA object content parsing (`data.content.fields`) | 🔴 | Reading Game fields from query |

**Learning Resources**:
- https://docs.iota.org/developer/ts-sdk/dapp-kit/
- https://docs.iota.org/developer/tutorials/simple-token-transfer

---

## 6. React UI / Styling

| Skill | Tier | Used Where |
|---|---|---|
| Tailwind CSS utility classes | 🔴 | All component styling |
| Tailwind responsive prefixes (sm:, md:, lg:) | 🔴 | Responsive grid layout |
| Tailwind dark mode classes | 🟡 | Dark navy theme |
| Radix UI primitives (already in dapp-kit) | 🟡 | Buttons, dialogs |
| CSS Grid and Flexbox (via Tailwind) | 🔴 | Card grids, split layouts |
| `input type="datetime-local"` | 🔴 | CreateGameForm date picker |
| Toast notifications | 🟡 | Transaction success/error feedback |
| Loading skeletons | 🟡 | Game card loading state |
| Conditional class names (`clsx` or template literals) | 🟡 | Status badge colours |
| Accessible HTML (aria labels, semantic elements) | 🟢 | Screen reader support |

---

## 7. Vite Build Tool

| Skill | Tier | Used Where |
|---|---|---|
| `pnpm create @iota/create-dapp` scaffold | 🔴 | Project bootstrap (Agent 2) |
| `vite.config.ts` — Tailwind plugin setup | 🔴 | Styling pipeline |
| `import.meta.env.VITE_*` variables | 🔴 | Environment-specific config |
| `.env.testnet`, `.env.mainnet`, `.env.local` | 🔴 | Network-specific deploys |
| `pnpm dev`, `pnpm build`, `pnpm preview` | 🔴 | Development workflow |
| `dist/` output folder | 🟡 | Vercel deployment source |

---

## 8. Deployment

| Skill | Tier | Used Where |
|---|---|---|
| Vercel CLI (`vercel`, `vercel env add`, `vercel --prod`) | 🔴 | Frontend deployment |
| `vercel.json` — rewrites for SPA routing | 🔴 | React Router on Vercel |
| Vercel environment variables dashboard | 🔴 | Storing PACKAGE_ID, etc. |
| GitHub → Vercel auto-deploy connection | 🟡 | CI/CD pipeline |
| GitHub Actions YAML syntax | 🟡 | `.github/workflows/deploy.yml` |
| GitHub repository secrets | 🟡 | Storing Vercel tokens securely |
| IOTA network switching (testnet / mainnet) | 🔴 | `iota client switch --env` |
| Understanding of gas budgets for publish | 🔴 | `--gas-budget 100000000` |

---

## 9. Security Concepts

| Skill | Tier | Used Where |
|---|---|---|
| Capability pattern in Move (AdminCap) | 🔴 | All admin functions |
| Why `private entry` is required with `&Random` | 🔴 | reveal_winners security |
| PTB composition attack (abort-if-not-win) | 🟡 | Understanding reveal security |
| Gas-dependent attack on randomness | 🟡 | Design of reveal_winners |
| Frontend route guarding vs contract guarding | 🔴 | AdminGuard design |
| Why address checks alone are insufficient | 🔴 | AdminCap vs address comparison |
| Linear types preventing double-spend | 🟡 | Move type system fundamentals |
| Integer overflow in prize math (use u64 carefully) | 🟡 | Prize calculation safety |

---

## 10. Testing

| Skill | Tier | Used Where |
|---|---|---|
| `iota::test_scenario` module | 🔴 | All 10 Move unit tests |
| `test_scenario::begin`, `next_tx`, `end` | 🔴 | Test lifecycle |
| `test_scenario::take_shared<T>` | 🔴 | Getting shared objects in tests |
| `test_scenario::take_from_sender<T>` | 🔴 | Getting owned objects in tests |
| `clock::create_for_testing` + `set_for_testing` | 🔴 | Time-sensitive tests |
| `random::create_for_testing` | 🔴 | Randomness in tests |
| `#[test]` and `#[expected_failure]` attributes | 🔴 | Test and abort-case coverage |
| `assert_eq!` patterns in Move | 🟡 | Checking computed values |
| `iota move test --filter <name>` | 🟢 | Running specific tests |

---

## 11. External APIs

| Skill | Tier | Used Where |
|---|---|---|
| CoinGecko REST API (no key needed) | 🔴 | Live IOTA price feed |
| Binance REST API (no key needed for ticker) | 🟡 | Price feed fallback |
| Handling API rate limits + fallback logic | 🟡 | useIotaPrice hook |
| `@tanstack/react-query` refetchInterval | 🔴 | 60s price refresh |
| CORS handling (both APIs allow browser fetch) | 🟢 | Price API calls |

---

## 12. Git & Collaboration

| Skill | Tier | Used Where |
|---|---|---|
| Feature branches (`cursor/` prefix) | 🔴 | Branch naming convention |
| `git add`, `git commit -m`, `git push` | 🔴 | All agent commits |
| Merge conflict resolution | 🟡 | Wave 2 integration (Agent 6) |
| PR creation and description | 🟡 | Final PR |
| Reading existing code before editing | 🔴 | Agent protocol |

---

## Quick Reference: Technology Versions

| Technology | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| React | 18 |
| TypeScript | 5+ |
| Vite | 5+ |
| @iota/dapp-kit | latest |
| @iota/iota-sdk | latest |
| @tanstack/react-query | 5+ |
| react-router-dom | 6+ |
| Tailwind CSS | 4+ |
| IOTA CLI | latest |
| Move edition | 2024 |

---

## Skill Gap Assessment for Common Backgrounds

### "I know Ethereum/Solidity"
- Missing: Move language, IOTA object model, VecSet/Table, AdminCap pattern
- Already know: PTB ≈ multicall, events, wallets, gas, testing concepts
- Time to ramp: Read Move overview + object model docs (1-2 days)

### "I know React but not Web3"
- Missing: Wallet connect, PTB construction, reading on-chain objects, IOTA types
- Already know: All frontend skills, TypeScript, hooks, routing
- Time to ramp: Read dapp-kit docs + token transfer tutorial (1 day)

### "I know Move on Sui"
- Missing: IOTA-specific `iota::random`, `iota::clock` addresses (0x8, 0x6), IOTA CLI flags
- Already know: ~95% of the Move code — IOTA Move is derived from Sui Move
- Time to ramp: Read IOTA-specific differences doc (2-3 hours)

### "I'm new to both"
- All skills are learnable — start with HLD.md → IOTA getting-started docs → dapp-kit tutorial → Move overview
- Recommended learning order: blockchain basics → Move objects → IOTA CLI → dapp-kit → PTBs → randomness
