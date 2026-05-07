import { describe, it, expect } from 'vitest';
import { buildUpdateTreasuryTx } from '../../transactions/updateTreasury';
import { PACKAGE_ID, GLOBAL_CONFIG_ID, ADMIN_CAP_ID, PLAYER_A } from '../../test-utils/factories';

describe('buildUpdateTreasuryTx', () => {
  const tx = buildUpdateTreasuryTx(PACKAGE_ID, ADMIN_CAP_ID, GLOBAL_CONFIG_ID, PLAYER_A);

  it('returns a Transaction object with a build function', () => {
    expect(tx).toBeDefined();
    expect(typeof tx.build).toBe('function');
  });

  it('targets update_treasury_address function', () => {
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.function).toBe('update_treasury_address');
    expect(call.MoveCall.module).toBe('matka_pot');
    expect(call.MoveCall.package).toBe(PACKAGE_ID);
  });

  it('passes 3 arguments: adminCap, globalConfig, newAddress', () => {
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.arguments.length).toBe(3);
  });

  it('includes AdminCap as an input', () => {
    const json = tx.getData();
    const adminCapInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === ADMIN_CAP_ID
    );
    expect(adminCapInput).toBeDefined();
  });

  it('encodes the new address as a pure value', () => {
    const json = tx.getData();
    const pureInputs = json.inputs.filter((i: any) => i.Pure !== undefined);
    expect(pureInputs.length).toBeGreaterThanOrEqual(1);
  });
});
