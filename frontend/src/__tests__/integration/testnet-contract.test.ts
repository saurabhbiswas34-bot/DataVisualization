/**
 * Testnet Integration Tests — read-only contract state verification.
 *
 * These tests connect directly to the IOTA testnet via the SDK (no browser wallet
 * required) and verify that the deployed contract is in a correct, queryable state.
 * They are excluded from the standard Vitest run (config excludes integration/) and
 * should be run explicitly:
 *
 *   pnpm test:integration
 *
 * They require network access to https://api.testnet.iota.cafe
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { IotaClient, getFullnodeUrl } from '@iota/iota-sdk/client';

const PACKAGE_ID = '0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a';
const GLOBAL_CONFIG_ID = '0x62fe4b0e6d1a745281632d08a810182b839bb69e45bf94bba108de04fc2878e3';
const ADMIN_ADDRESS = '0xe21283aba70e849dbd223d40e3fb6e71899af96afec60aa2ea09578aabfe6d38';
const TESTNET_URL = 'https://api.testnet.iota.cafe';

let client: IotaClient;

beforeAll(() => {
  client = new IotaClient({ url: TESTNET_URL });
});

describe('IOTA Matka Pot — Testnet Contract State', () => {
  it('connects to IOTA testnet', async () => {
    const chainId = await client.getChainIdentifier();
    expect(typeof chainId).toBe('string');
    expect(chainId.length).toBeGreaterThan(0);
  }, 15_000);

  it('GlobalConfig object exists on testnet', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    expect(obj.data).not.toBeNull();
    expect(obj.data?.objectId).toBe(GLOBAL_CONFIG_ID);
  }, 15_000);

  it('GlobalConfig has correct admin_address', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    expect(fields).toBeDefined();
    expect(fields.admin_address.toLowerCase()).toBe(ADMIN_ADDRESS.toLowerCase());
  }, 15_000);

  it('GlobalConfig has a treasury_address set', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    expect(fields.treasury_address).toBeTruthy();
    expect(fields.treasury_address).toMatch(/^0x[a-fA-F0-9]+$/);
  }, 15_000);

  it('GlobalConfig has positive min_contribution_nanos', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    const minNanos = BigInt(fields.min_contribution_nanos);
    expect(minNanos).toBeGreaterThan(0n);
  }, 15_000);

  it('GlobalConfig game_counter is non-negative', async () => {
    const obj = await client.getObject({
      id: GLOBAL_CONFIG_ID,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    const counter = parseInt(fields.game_counter);
    expect(counter).toBeGreaterThanOrEqual(0);
  }, 15_000);

  it('can query GameCreated events for the deployed package', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::GameCreated` },
      limit: 10,
    });
    expect(events).toBeDefined();
    expect(Array.isArray(events.data)).toBe(true);
    // Contract emits game_object_id after our fix
    if (events.data.length > 0) {
      const event = events.data[0].parsedJson as any;
      expect(event).toHaveProperty('game_id');
    }
  }, 20_000);

  it('can fetch a Game object when one exists', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::GameCreated` },
      limit: 1,
    });
    if (events.data.length === 0) {
      console.log('No games found — skipping game object fetch test');
      return;
    }
    const event = events.data[0].parsedJson as any;
    const gameObjectId = event.game_object_id;
    if (!gameObjectId) {
      console.log('Old event without game_object_id — skipping');
      return;
    }
    const gameObj = await client.getObject({
      id: gameObjectId,
      options: { showContent: true },
    });
    expect(gameObj.data).toBeDefined();
    const fields = (gameObj.data?.content as any)?.fields;
    expect(fields).toBeDefined();
    expect(fields.game_id).toBeDefined();
    expect(typeof fields.is_active).toBe('boolean');
  }, 20_000);

  it('TicketIssued events have correct structure', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::TicketIssued` },
      limit: 5,
    });
    if (events.data.length === 0) return; // no tickets yet — skip
    const event = events.data[0].parsedJson as any;
    expect(event).toHaveProperty('game_id');
    expect(event).toHaveProperty('player');
    expect(event).toHaveProperty('amount_nanos');
    expect(BigInt(event.amount_nanos)).toBeGreaterThan(0n);
  }, 20_000);

  it('WinnersRevealed events have correct structure', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::WinnersRevealed` },
      limit: 5,
    });
    if (events.data.length === 0) return; // no reveals yet — skip
    const event = events.data[0].parsedJson as any;
    expect(event).toHaveProperty('game_id');
    expect(event).toHaveProperty('winner_1');
    expect(event).toHaveProperty('prize_1_nanos');
    const totalPrizes =
      BigInt(event.prize_1_nanos) +
      BigInt(event.prize_2_nanos || 0) +
      BigInt(event.prize_3_nanos || 0) +
      BigInt(event.treasury_cut_nanos);
    // Total distributed = pot at reveal time (can't verify exact total, but must be > 0)
    expect(totalPrizes).toBeGreaterThan(0n);
  }, 20_000);
});

describe('IOTA Matka Pot — Testnet Prize Math Verification', () => {
  it('on-chain 1-player prize: winner gets ~90%, treasury ~10%', async () => {
    const events = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::events::WinnersRevealed` },
      limit: 10,
    });
    const singlePlayer = (events.data as any[]).find(
      e => !e.parsedJson?.winner_2 && !e.parsedJson?.winner_3
    );
    if (!singlePlayer) return;
    const e = singlePlayer.parsedJson as any;
    const p1 = BigInt(e.prize_1_nanos);
    const t = BigInt(e.treasury_cut_nanos);
    const total = p1 + t;
    const p1Pct = Number((p1 * 100n) / total);
    expect(p1Pct).toBeGreaterThanOrEqual(89); // ~90% (floor division)
    expect(p1Pct).toBeLessThanOrEqual(91);
  }, 20_000);
});
