# IOTA Matka Pot — Testnet Deployment Status

## Contract Deployment ✅

- Network: IOTA Testnet
- Package ID: 0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a
- GlobalConfig ID: 0x62fe4b0e6d1a745281632d08a810182b839bb69e45bf94bba108de04fc2878e3
- AdminCap ID: 0x6effe1533ce61adbc16242a449ab08f73c2dea67669df0c999a8e2de6fc73ce7
- Admin Address: 0xe21283aba70e849dbd223d40e3fb6e71899af96afec60aa2ea09578aabfe6d38
- Deployed At: 2026-05-07T04:10:00Z
- Tx Digest: 2NW4nhNYnzMokbxeukjH5gjXfDGVTrdrcJbyPq9i12Yd
- Explorer: https://explorer.iota.org/object/0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a?network=testnet

## Move Tests ✅
- 12/12 tests passing

## Frontend Build ✅
- pnpm build: success
- All 6 routes implemented:
  - `/` — HomePage (active games list)
  - `/game/:gameId` — GameDetailPage (pot details + enter game)
  - `/game/:gameId/results` — ResultsPage (winners and prize breakdown)
  - `/history` — HistoryPage (past games list)
  - `/history/:gameId` — HistoryDetailPage (detailed game history)
  - `/admin` — AdminPage (AdminCap-gated admin panel)

## Components ✅
- AdminGuard (AdminCap-based security)
- Navbar (admin-aware with active route highlighting)
- PotCard, PriceDisplay, CountdownTimer
- PlayersList, AllEntriesTable, WinnersBoard
- HistoryCard
- CreateGameForm, RevealWatcher, MinContributionUpdater, TreasurySettings

## Hooks ✅
- useActiveGames — live game polling
- useGame — single game details
- useIsAdmin — AdminCap ownership check
- useIotaPrice — CoinGecko + Binance fallback
- useAutoReveal — 10s polling for auto-reveal

## Next Steps
1. Deploy frontend to Vercel
2. Add secrets to GitHub repo for CI/CD
3. Connect admin wallet and test game creation on testnet
