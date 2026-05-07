# IOTA Matka Pot — Security Design

## Admin Page Protection — Full Explanation

This document explains exactly how the admin panel is protected, at every layer.

---

## 1. The Two Layers of Admin Protection

Admin protection operates on **two independent layers**. Both must pass for an admin action to succeed.

```
LAYER 1: Smart Contract (blockchain)
  → The ONLY layer that actually matters for security
  → Cannot be bypassed, faked, or hacked from the frontend
  → Based on possession of AdminCap object

LAYER 2: Frontend (React UI)
  → Convenience layer — hides admin UI from regular users
  → Can technically be bypassed by a determined user
  → Provides zero additional security on its own
  → BUT: bypassing it is pointless because Layer 1 always rejects them

Defence-in-depth: both layers together make the system clean AND secure.
```

---

## 2. Layer 1: Smart Contract Security — AdminCap Pattern

### What is AdminCap?

`AdminCap` is a Move object (not an address, not a password, not a flag in a database). It is a unique on-chain object that exists exactly once in the entire IOTA blockchain.

```
AdminCap { id: UID }  ← this object lives in exactly one wallet
```

At contract deploy time, the `init()` function creates this object and transfers it to the deployer's wallet. That's it — one object, one owner.

### How admin functions are protected

Every admin function signature requires `&AdminCap` as a parameter:

```move
public entry fun create_game(
    _cap: &AdminCap,          // ← caller MUST provide this
    config: &mut GlobalConfig,
    clock: &Clock,
    reveal_ts: u64,
    ctx: &mut TxContext
) { ... }
```

When the IOTA network executes this transaction:
1. It checks: does the transaction sender's wallet actually own the `AdminCap` object with the specified object ID?
2. If YES → function runs
3. If NO → transaction rejected by the network with an error — not by the app, not by a server, by the **blockchain validators themselves**

### Why this is unbreakable

| Attack Attempt | Result |
|---|---|
| Regular user navigates to `/admin` in browser | Frontend blocks (Layer 2) — but even if they bypass it... |
| Regular user manually crafts and submits a `create_game` transaction | IOTA validators reject it: they don't hold `AdminCap` |
| Regular user passes a fake `AdminCap` object ID | IOTA validators check ownership — fake ID fails |
| Regular user tries to duplicate `AdminCap` | Impossible — Move's type system enforces `key` objects are unique |
| Hacker decompiles the React app | They can see the admin UI — but can still never execute any transaction |
| Admin loses their wallet private key | Admin access is lost (same as losing any crypto wallet) |
| Admin transfers `AdminCap` to a new address | New address becomes admin — by design |

### Changing admin (transferring AdminCap)

If the admin ever needs to hand off control:
```move
// Admin calls this explicitly — no one else can
transfer::public_transfer(admin_cap, new_admin_address)
```

The `GlobalConfig.admin_address` field is then updated via a separate setter function. This is the only way to change admin.

---

## 3. Layer 2: Frontend Route Protection

### How it works

The `/admin` route is wrapped in an `AdminGuard` component:

```
Route: /admin
  └── <AdminGuard>
        ├── Reads GlobalConfig.admin_address from on-chain
        ├── Reads useCurrentAccount().address from connected wallet
        ├── If match → renders <AdminPage />
        └── If no match → renders <AccessDenied /> page
```

### What `AdminGuard` checks

1. **Is a wallet connected?** If no wallet is connected → show "Connect Wallet" prompt
2. **Is the connected address the admin?** Compares with `GlobalConfig.admin_address` read live from the blockchain
3. **Both true?** Show admin panel

### The `useIsAdmin` hook

```typescript
// hooks/useIsAdmin.ts (pseudocode, not implementation)
function useIsAdmin() {
    const { currentAccount } = useCurrentAccount()
    const { data: config } = useIotaClientQuery(
        'getObject',
        { id: GLOBAL_CONFIG_ID, options: { showContent: true } }
    )
    const adminAddress = config?.data?.content?.fields?.admin_address
    return {
        isAdmin: currentAccount?.address === adminAddress,
        adminAddress
    }
}
```

### Why frontend-only protection is NOT enough

If someone bypasses the frontend (e.g., using the IOTA CLI directly):
```bash
iota client call \
  --function create_game \
  --module matka_pot \
  --package <PACKAGE_ID> \
  --args <FAKE_ADMIN_CAP> <GLOBAL_CONFIG_ID> 0x6 <REVEAL_TS>
```
→ This will FAIL because they don't own `AdminCap`. The blockchain rejects it.

---

## 4. Admin Page — What Regular Users See

| Scenario | What Regular User Sees |
|---|---|
| Not connected, visits `/admin` | "Please connect your IOTA wallet" page |
| Connected with non-admin wallet, visits `/admin` | "Access Denied — Admin only" page with back button |
| Admin address is known (public on-chain), visits `/admin` | "Access Denied" — they still can't execute any transactions |
| Admin wallet connected, visits `/admin` | Full admin panel rendered |

The admin address itself is **public** (visible on-chain in `GlobalConfig`). This is intentional — transparency is a blockchain principle. But knowing the address gives you zero ability to act as admin.

---

## 5. Other Security Measures in the Contract

### Timing attacks
```move
// Lockout: no entries 10 min before reveal
assert!(clock.timestamp_ms() < game.lockout_timestamp_ms);

// Reveal: only after deadline
assert!(clock.timestamp_ms() >= game.reveal_timestamp_ms);

// Minimum game duration: > 24 hours
assert!(reveal_ts > clock.timestamp_ms() + 86_400_000);
```
`Clock` at `0x6` is a system object. Its value cannot be forged.

### Randomness manipulation prevention
- `reveal_winners` is **private entry** — Move compiler enforces this when `&Random` is a parameter
- This prevents other contracts from calling `reveal_winners` and selectively reverting if they don't win
- IOTA also rejects PTBs that have non-transfer/merge commands following a Random-using MoveCall
- Result: no one can game the random draw

### Minimum contribution enforcement
```move
assert!(coin::value(&payment) >= game.min_contribution_nanos);
```
Cannot be bypassed from the frontend — the contract validates the amount.

### Double-reveal prevention
```move
assert!(game.is_active);  // false after first reveal → rejects all subsequent calls
```

### Unique winner guarantee
After each winner is drawn, their address is removed from the candidate vector before the next draw. Impossible to win twice in the same game.

### Treasury address only settable by admin
```move
public entry fun update_treasury_address(
    _cap: &AdminCap,           // ← admin must hold this
    config: &mut GlobalConfig,
    new_addr: address,
    _ctx: &mut TxContext
) { ... }
```
No player can redirect treasury funds. Ever.

---

## 6. Summary: Who Can Do What

| Action | Who Can | How Enforced |
|---|---|---|
| Create a new pot | Admin only | `AdminCap` required by contract |
| Set treasury address | Admin only | `AdminCap` required by contract |
| Set minimum contribution | Admin only | `AdminCap` required by contract |
| Contribute to pot | Any wallet | Public entry |
| Call reveal (after deadline) | Admin frontend auto-calls | `private entry` (admin's wallet submits) |
| View any pot | Anyone | Public reads |
| View history | Anyone | Public reads |
| View admin panel UI | Admin wallet only | Frontend `AdminGuard` component |
| Execute any admin transaction without `AdminCap` | Nobody | Rejected by IOTA validators |
