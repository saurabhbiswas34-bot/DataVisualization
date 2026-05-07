import { describe, it, expect } from 'vitest';
import { buildRevealWinnersTx } from '../../transactions/revealWinners';
import { PACKAGE_ID, GAME_OBJECT_ID, GLOBAL_CONFIG_ID, CLOCK_OBJECT_ID_NORM, RANDOM_OBJECT_ID_NORM } from '../../test-utils/factories';

describe('buildRevealWinnersTx', () => {
  const tx = buildRevealWinnersTx(PACKAGE_ID, GAME_OBJECT_ID, GLOBAL_CONFIG_ID);

  it('returns a Transaction object with a build function', () => {
    expect(tx).toBeDefined();
    expect(typeof tx.build).toBe('function');
  });

  it('targets reveal_winners function', () => {
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.function).toBe('reveal_winners');
    expect(call.MoveCall.module).toBe('matka_pot');
    expect(call.MoveCall.package).toBe(PACKAGE_ID);
  });

  it('passes 4 arguments: game, random, clock, globalConfig', () => {
    const json = tx.getData();
    const call = json.commands.find((c: any) => c.MoveCall !== undefined) as any;
    expect(call.MoveCall.arguments.length).toBe(4);
  });

  it('includes Random object ID (0x8) as an input', () => {
    const json = tx.getData();
    const randomInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === RANDOM_OBJECT_ID_NORM
    );
    expect(randomInput).toBeDefined();
  });

  it('includes Clock object ID (0x6) as an input', () => {
    const json = tx.getData();
    const clockInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === CLOCK_OBJECT_ID_NORM
    );
    expect(clockInput).toBeDefined();
  });

  it('includes the Game object as an input', () => {
    const json = tx.getData();
    const gameInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === GAME_OBJECT_ID
    );
    expect(gameInput).toBeDefined();
  });

  it('includes the GlobalConfig object as an input', () => {
    const json = tx.getData();
    const configInput = json.inputs.find(
      (i: any) => i.UnresolvedObject?.objectId === GLOBAL_CONFIG_ID
    );
    expect(configInput).toBeDefined();
  });
});
