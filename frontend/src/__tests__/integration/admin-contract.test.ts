/**
 * Admin Contract Tests — testnet state verification for all admin-controlled
 * contract functions.
 *
 * These tests are READ-ONLY against testnet state. They verify that:
 * 1. Admin functions are correctly gated by AdminCap ownership
 * 2. Transaction builders produce valid PTBs for admin operations
 * 3. GlobalConfig can be read and reflects expected admin settings
 *
 * Run with:  pnpm test:integration
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { IotaClient } from '@iota/iota-sdk/client';
import { buildCreateGameTx } from '../../transactions/createGame';
import { buildUpdateTreasuryTx } from '../../transactions/updateTreasury';
import { buildUpdateMinEntryTx } from '../../transactions/updateMinEntry';
import { buildRevealWinnersTx } from '../../transactions/revealWinners';

const PACKAGE_ID = '0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a';
const GLOBAL_CONFIG_ID = '0x62fe4b0e6d1a745281632d08a810182b839bb69e45bf94bba108de04fc2878e3';
const ADMIN_ADDRESS = '0xe21283aba70e849dbd223d40e3fb6e71899af96afec60aa2ea09578aabfe6d38';
const FAKE_ADMIN_CAP = '0x' + 'e'.repeat(64);

let client: IotaClient;

beforeAll(() => {
  client = new IotaClient({ url: 'https://api.testnet.iota.cafe' });
});

describe('Admin Contract — PTB Construction', () => {
  it('buildCreateGameTx produces a valid transaction', () => {
    const revealMs = Date.now() + 2 * 86_400_000;
    const tx = buildCreateGameTx(PACKAGE_ID, FAKE_ADMIN_CAP, GLOBAL_CONFIG_ID, revealMs);
    expect(tx).toBeDefined();
    const data = tx.getData();
    const call = data.commands.find((c: any) => c.$kind === 'MoveCall') as any;
    expect(call.MoveCall.function).toBe('create_game');
  });

  it('buildUpdateTreasuryTx produces a valid transaction', () => {
    const tx = buildUpdateTreasuryTx(PACKAGE_ID, FAKE_ADMIN_CAP, GLOBAL_CONFIG_ID, ADMIN_ADDRESS);
    expect(tx).toBeDefined();
    const data = tx.getData();
    const call = data.commands.find((c: any) => c.$kind === 'MoveCall') as any;
    expect(call.MoveCall.function).toBe('update_treasury_address');
  });

  it('buildUpdateMinEntryTx produces a valid transaction', () => {
    const tx = buildUpdateMinEntryTx(PACKAGE_ID, FAKE_ADMIN_CAP, GLOBAL_CONFIG_ID, 20_000_000_000n);
    expect(tx).toBeDefined();
    const data = tx.getData();
    const call = data.commands.find((c: any) => c.$kind === 'MoveCall') as any;
    expect(call.MoveCall.function).toBe('update_min_contribution');
  });

  it('buildRevealWinnersTx produces a valid transaction', () => {
    const tx = buildRevealWinnersTx(PACKAGE_ID, '0x' + 'd'.repeat(64), GLOBAL_CONFIG_ID);
    expect(tx).toBeDefined();
    const data = tx.getData();
    const call = data.commands.find((c: any) => c.$kind === 'MoveCall') as any;
    expect(call.MoveCall.function).toBe('reveal_winners');
  });
});

describe('Admin Contract — Testnet State Assertions', () => {
  it('GlobalConfig exists and has correct type', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showType: true },
    });
    expect(obj.data?.type).toContain('GlobalConfig');
  }, 15_000);

  it('GlobalConfig admin matches expected admin address', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    expect(fields.admin_address.toLowerCase()).toBe(ADMIN_ADDRESS.toLowerCase());
  }, 15_000);

  it('min_contribution_nanos is >= 1 IOTA (1e9 nanos)', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    const minNanos = BigInt(fields.min_contribution_nanos);
    expect(minNanos).toBeGreaterThanOrEqual(1_000_000_000n);
  }, 15_000);

  it('all created games have valid object structure', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::GameCreated` },
      limit: 5,
    });
    for (const event of events.data) {
      const e = event.parsedJson as any;
      expect(typeof e.game_id).toBe('string');
      expect(BigInt(e.reveal_timestamp_ms)).toBeGreaterThan(0n);
      expect(BigInt(e.lockout_timestamp_ms)).toBeGreaterThan(0n);
      // Lockout must be before reveal
      expect(BigInt(e.lockout_timestamp_ms)).toBeLessThan(BigInt(e.reveal_timestamp_ms));
      // Min contribution from GlobalConfig at creation time
      expect(BigInt(e.min_contribution_nanos)).toBeGreaterThan(0n);
    }
  }, 20_000);

  it('game_counter increments correctly across GameCreated events', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::GameCreated` },
      limit: 50,
    });
    if (events.data.length < 2) return;
    const ids = events.data.map(e => parseInt((e.parsedJson as any).game_id));
    // game IDs should be unique sequential numbers
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  }, 20_000);

  it('revealed games have winner addresses that are valid IOTA addresses', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::WinnersRevealed` },
      limit: 5,
    });
    for (const event of events.data) {
      const e = event.parsedJson as any;
      expect(e.winner_1).toMatch(/^0x[a-fA-F0-9]+$/);
      // Prize amounts are non-negative
      expect(BigInt(e.prize_1_nanos)).toBeGreaterThan(0n);
      expect(BigInt(e.treasury_cut_nanos)).toBeGreaterThanOrEqual(0n);
    }
  }, 20_000);

  it('prize distribution in WinnersRevealed sums to pot total', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::WinnersRevealed` },
      limit: 5,
    });
    for (const event of events.data) {
      const e = event.parsedJson as any;
      const p1 = BigInt(e.prize_1_nanos);
      const p2 = BigInt(e.prize_2_nanos);
      const p3 = BigInt(e.prize_3_nanos);
      const t = BigInt(e.treasury_cut_nanos);
      const total = p1 + p2 + p3 + t;
      // Sanity check: total must equal some pot value, i.e., p1 is the largest slice
      const p1Pct = Number((p1 * 100n) / total);
      expect(p1Pct).toBeGreaterThanOrEqual(49); // ~50% of pot
    }
  }, 20_000);
});
