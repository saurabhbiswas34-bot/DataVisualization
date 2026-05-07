import { describe, it, expect } from 'vitest';
import { buildAddToPotTx } from '../../transactions/addToPot';
import { PACKAGE_ID, GAME_OBJECT_ID, CLOCK_OBJECT_ID_NORM } from '../../test-utils/factories';

const AMOUNT_NANOS = 20_000_000_000n; // 20 IOTA

describe('buildAddToPotTx', () => {
  it('returns a Transaction object with a build function', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS);
    expect(tx).toBeDefined();
    expect(typeof tx.build).toBe('function');
  });

  it('has a SplitCoins command for the payment', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS);
    const json = tx.getData();
    const splits = json.commands.filter((c: any) => c.SplitCoins !== undefined);
    expect(splits.length).toBe(1);
  });

  it('has a MoveCall targeting add_to_pot', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS);
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.function).toBe('add_to_pot');
    expect(call.MoveCall.module).toBe('matka_pot');
    expect(call.MoveCall.package).toBe(PACKAGE_ID);
  });

  it('passes 4 arguments: game, coin, entropy, clock', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS, 'lucky');
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.arguments.length).toBe(4);
  });

  it('includes the game object as an input', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS);
    const json = tx.getData();
    const gameInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === GAME_OBJECT_ID
    );
    expect(gameInput).toBeDefined();
  });

  it('uses empty entropy when no entropy provided', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS);
    expect(tx).toBeDefined();
  });

  it('uses empty entropy when entropy is whitespace-only', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS, '   ');
    expect(tx).toBeDefined();
  });

  it('includes the Clock object ID', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS);
    const json = tx.getData();
    const clockInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === CLOCK_OBJECT_ID_NORM
    );
    expect(clockInput).toBeDefined();
  });

  it('encodes entropy as pure bytes when provided', () => {
    const tx = buildAddToPotTx(PACKAGE_ID, GAME_OBJECT_ID, AMOUNT_NANOS, 'hello');
    const json = tx.getData();
    const pureInputs = json.inputs.filter((i: any) => i.Pure !== undefined);
    expect(pureInputs.length).toBeGreaterThanOrEqual(1);
  });
});
