import { describe, it, expect } from 'vitest';
import { buildCreateGameTx } from '../../transactions/createGame';
import { PACKAGE_ID, GLOBAL_CONFIG_ID, ADMIN_CAP_ID, REVEAL_MS, CLOCK_OBJECT_ID_NORM } from '../../test-utils/factories';

describe('buildCreateGameTx', () => {
  const tx = buildCreateGameTx(PACKAGE_ID, ADMIN_CAP_ID, GLOBAL_CONFIG_ID, REVEAL_MS);

  it('returns a Transaction object with a build function', () => {
    expect(tx).toBeDefined();
    expect(typeof tx.build).toBe('function');
  });

  it('has one move call in the transaction', () => {
    const json = tx.getData();
    const calls = json.commands.filter((c: any) => c.MoveCall !== undefined);
    expect(calls.length).toBe(1);
  });

  it('targets the correct package::module::function', () => {
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.package).toBe(PACKAGE_ID);
    expect(call.MoveCall.module).toBe('matka_pot');
    expect(call.MoveCall.function).toBe('create_game');
  });

  it('includes AdminCap, GlobalConfig, Clock, and reveal timestamp (4 args)', () => {
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.arguments.length).toBe(4);
  });

  it('uses the CLOCK_OBJECT_ID system constant (0x6) as an input', () => {
    const json = tx.getData();
    const clockInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === CLOCK_OBJECT_ID_NORM
    );
    expect(clockInput).toBeDefined();
  });

  it('includes AdminCap object as an input', () => {
    const json = tx.getData();
    const adminCapInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === ADMIN_CAP_ID
    );
    expect(adminCapInput).toBeDefined();
  });

  it('includes GlobalConfig object as an input', () => {
    const json = tx.getData();
    const configInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === GLOBAL_CONFIG_ID
    );
    expect(configInput).toBeDefined();
  });
});
